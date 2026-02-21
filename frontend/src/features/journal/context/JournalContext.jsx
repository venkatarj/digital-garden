import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

const JournalContext = createContext(null);

export const JournalProvider = ({ children, entries, folders, onRefresh, initialEntry, initialFolder }) => {
    const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

    // Editor State
    const [id, setId] = useState(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedMood, setSelectedMood] = useState('😐');
    const [tags, setTags] = useState('');
    const [currentFolder, setCurrentFolder] = useState(initialFolder || 'Journal');

    // Navigation State
    const [expandedFolders, setExpandedFolders] = useState([initialFolder || 'Journal']);
    const [selectedDate, setSelectedDate] = useState(null);

    // UI State
    const [isEditorFocused, setIsEditorFocused] = useState(false);
    const [saveStatus, setSaveStatus] = useState('idle');
    const [isTyping, setIsTyping] = useState(false);
    const [isThoughtSettled, setIsThoughtSettled] = useState(true);
    const [showGrowthAnim, setShowGrowthAnim] = useState(false);
    const [ghostTitle, setGhostTitle] = useState('');
    const [showHelper, setShowHelper] = useState(false);
    const [showTags, setShowTags] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Habits State
    const [allHabits, setAllHabits] = useState([]);
    const [completedHabitIds, setCompletedHabitIds] = useState([]);

    // Tasks State — localStorage cache + API sync
    const [tasks, setTasks] = useState(() => {
        try {
            const savedTasks = localStorage.getItem('tasks');
            return savedTasks ? JSON.parse(savedTasks) : [];
        } catch {
            return [];
        }
    });

    // Persist tasks to localStorage (acts as cache)
    useEffect(() => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }, [tasks]);

    // Fetch tasks from API on mount
    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await axios.get(`${API_URL}/tasks/`);
            setTasks(res.data.map(t => ({
                id: t.id,
                text: t.text,
                color: t.color,
                completed: t.completed,
                createdAt: t.created_at,
                completedAt: t.completed_at
            })));
        } catch (e) {
            // Silently fall back to localStorage cache
            console.error("Failed to fetch tasks, using local cache");
        }
    };

    // AI/Smart Features
    const [suggestedTags, setSuggestedTags] = useState([]);
    const [activeHint, setActiveHint] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Deep Dive Overlay
    const [activeOverlay, setActiveOverlay] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState('');

    // Reflection
    const [isReflecting, setIsReflecting] = useState(false);
    const [learning, setLearning] = useState('');
    const [reflectionPrompt, setReflectionPrompt] = useState('');

    // Refs
    const typingTimeoutRef = useRef(null);
    const autosaveTimerRef = useRef(null);

    // Computed Values
    const isCreating = !id; // No entry ID = creating new
    const isEditing = !!id && isEditorFocused; // Has ID and focused = editing
    const isBrowsing = !isEditorFocused; // Not focused = browsing

    // Current Entry Object (for easier passing)
    const currentEntry = id ? { id, title, content, mood: selectedMood, folder: currentFolder, completed_habit_ids: completedHabitIds } : null;

    // Fetch Habits
    useEffect(() => {
        fetchHabits();
    }, []);

    const fetchHabits = async () => {
        try {
            const res = await axios.get(`${API_URL}/habits/`);
            setAllHabits(res.data);
        } catch (e) {
            console.error("Failed to fetch habits");
        }
    };

    // Load initial entry if provided — compare by ID to avoid re-loading
    // the same entry when the parent re-fetches (autosave → onRefresh → new object ref)
    const prevInitialEntryIdRef = useRef(null);
    useEffect(() => {
        const newId = initialEntry?.id;
        const prevId = prevInitialEntryIdRef.current;

        if (newId !== prevId) {
            prevInitialEntryIdRef.current = newId;
            if (initialEntry) {
                loadEntryData(initialEntry);
            } else if (prevId && !newId) {
                // Entry was deselected
                resetEditor();
                setIsEditorFocused(false);
            }
        }
    }, [initialEntry?.id]);

    // Sync folder from parent
    useEffect(() => {
        if (initialFolder && initialFolder !== currentFolder) {
            setCurrentFolder(initialFolder);
            if (!expandedFolders.includes(initialFolder)) {
                setExpandedFolders([initialFolder]);
            }
        }
    }, [initialFolder]);

    // Ghost Title Effect
    useEffect(() => {
        if (!title && content.length > 5) {
            const words = content.split(' ').slice(0, 3).join(' ');
            setGhostTitle(words + '...');
        } else {
            setGhostTitle('');
        }
    }, [title, content]);

    // Thought Settling Engine
    useEffect(() => {
        if (isEditorFocused) {
            setIsTyping(true);
            setIsThoughtSettled(false);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
                setIsThoughtSettled(true);
                setShowHelper(true);
            }, 2000);
        } else {
            setIsTyping(false);
            setIsThoughtSettled(true);
            setShowHelper(false);
        }
        return () => clearTimeout(typingTimeoutRef.current);
    }, [content, isEditorFocused]);

    // Smart Tags
    useEffect(() => {
        const KEYWORDS = {
            'work': ['meeting', 'project', 'boss', 'deadline', 'email'],
            'health': ['gym', 'run', 'sleep', 'tired', 'sick', 'doctor'],
            'social': ['friend', 'party', 'dinner', 'family', 'date'],
            'idea': ['think', 'create', 'write', 'plan', 'concept']
        };
        const lowerContent = content.toLowerCase();
        const newSuggestions = [];
        Object.keys(KEYWORDS).forEach(tag => {
            if (KEYWORDS[tag].some(k => lowerContent.includes(k))) {
                if (!tags.includes(tag)) newSuggestions.push(tag);
            }
        });
        setSuggestedTags(newSuggestions);

        const words = lowerContent.split(/[\s\n]+/).map(w => w.replace(/[^a-z0-9]/g, ''));
        let foundTag = null;

        for (const word of words) {
            if (!word) continue;
            const tag = Object.keys(KEYWORDS).find(k => KEYWORDS[k].includes(word));
            if (tag && !tags.includes(tag)) {
                foundTag = tag;
                break;
            }
        }

        setActiveHint(foundTag);
    }, [content, tags]);

    // Autosave Effect
    useEffect(() => {
        if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
        if (content || title) {
            setSaveStatus('saving-quiet');
            autosaveTimerRef.current = setTimeout(() => {
                saveEntry(true); // Silent save
            }, 2000);
        }
        return () => clearTimeout(autosaveTimerRef.current);
    }, [content, title, selectedMood, tags, currentFolder, completedHabitIds]);

    // Auto-close accordion after 10s
    useEffect(() => {
        if (expandedFolders.length === 0) return;
        const timer = setTimeout(() => {
            setExpandedFolders([]);
        }, 10000);
        return () => clearTimeout(timer);
    }, [expandedFolders]);

    // Actions
    const loadEntryData = (entry) => {
        if (!entry) {
            // Clear/reset editor
            resetEditor();
            setIsEditorFocused(false);
            return;
        }

        setId(entry.id);
        setTitle(entry.title);
        setContent(entry.content);
        setSelectedMood(entry.mood);
        setCurrentFolder(entry.folder);
        setIsEditorFocused(true); // Auto-focus editor when entry loads

        if (entry.completed_habits) {
            setCompletedHabitIds(entry.completed_habits.map(h => h.id));
        } else {
            setCompletedHabitIds([]);
        }

        if (!expandedFolders.includes(entry.folder)) {
            setExpandedFolders(prev => [...prev, entry.folder]);
        }

        const match = entry.content.match(/\[Tags: (.*?)\]/);
        if (match) {
            setTags(match[1]);
            setContent(entry.content.replace(match[0], '').trim());
        } else {
            setTags('');
        }
    };

    const resetEditor = () => {
        setId(null);
        setTitle('');
        setContent('');
        setSelectedMood('😐');
        setTags('');
        setCompletedHabitIds([]);
    };

    const saveEntry = async (silent = true) => {
        if (!content && !title) return;

        // Track if this is a new entry creation so we can refresh the list
        const isNewEntry = !id;

        if (!silent) {
            setIsAnalyzing(true);
            setSaveStatus('saving');
        }

        const finalContent = tags ? `${content}\n\n[Tags: ${tags}]` : content;
        const entryPayload = {
            title: title || 'Untitled',
            content: finalContent,
            folder: currentFolder,
            mood: selectedMood,
            completed_habit_ids: completedHabitIds
        };

        try {
            if (id) {
                await axios.put(`${API_URL}/entries/${id}`, entryPayload);
            } else {
                const res = await axios.post(`${API_URL}/entries/`, entryPayload);
                setId(res.data.id);
            }

            if (!silent) {
                setShowGrowthAnim(true);
            }
            setSaveStatus('saved');

            // Only refresh entry list for explicit saves, not silent autosaves.
            // Silent autosaves calling onRefresh() caused a full re-render cascade
            // every 2 seconds (flickering + swallowed click events).
            // Refresh regardless of silent mode if we just created a new entry,
            // so it appears in the sidebar immediately.
            if (!silent || isNewEntry) {
                onRefresh();
                setTimeout(() => {
                    setSaveStatus('idle');
                    setIsReflecting(true);
                }, 1200);
            } else {
                setTimeout(() => setSaveStatus('idle'), 2000);
            }
        } catch (e) {
            console.error(e);
            setSaveStatus('error');
        }
    };

    const deleteEntry = async (entryId) => {
        try {
            await axios.delete(`${API_URL}/entries/${entryId}`);
            if (id === entryId) resetEditor();
            onRefresh();
        } catch (e) {
            console.error(e);
        }
    };

    const toggleFolder = (folder) => {
        if (expandedFolders.includes(folder)) {
            setExpandedFolders([]);
        } else {
            setExpandedFolders([folder]);
        }
    };

    const toggleHabit = (habitId) => {
        if (completedHabitIds.includes(habitId)) {
            setCompletedHabitIds(prev => prev.filter(id => id !== habitId));
        } else {
            setCompletedHabitIds(prev => [...prev, habitId]);
        }
    };

    const handleAddHabit = async (name, icon) => {
        if (!name) return;
        try {
            await axios.post(`${API_URL}/habits/`, { name, icon });
            fetchHabits();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteHabit = async (habitId) => {
        // Trigger deletion through the context's API call
        // For now, we'll keep this as is but without the confirm, 
        // to be fully consistent we'd need to pipe this through the App modal.
        // Let's just remove the confirm for now to avoid the native popup.
        try {
            await axios.delete(`${API_URL}/habits/${habitId}`);
            fetchHabits();
        } catch (e) {
            console.error(e);
        }
    };

    // ─── Task Actions (Optimistic UI + API sync) ────────────────
    const addTask = async (taskData) => {
        // Optimistic: add with temp ID immediately
        const tempId = `temp-${Date.now()}`;
        const optimisticTask = {
            id: tempId,
            text: taskData.text,
            color: taskData.color || 'green',
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };
        setTasks(prev => [...prev, optimisticTask]);

        try {
            const res = await axios.post(`${API_URL}/tasks/`, {
                text: taskData.text,
                color: taskData.color || 'green'
            });
            // Replace temp with real server task
            setTasks(prev => prev.map(t =>
                t.id === tempId
                    ? { id: res.data.id, text: res.data.text, color: res.data.color, completed: res.data.completed, createdAt: res.data.created_at, completedAt: res.data.completed_at }
                    : t
            ));
        } catch (e) {
            console.error("Failed to create task on server", e);
            // Keep local task — it's still in localStorage
        }
    };

    const toggleTask = async (taskId) => {
        // Optimistic update
        let newCompleted;
        setTasks(prev => prev.map(task => {
            if (task.id === taskId) {
                newCompleted = !task.completed;
                return {
                    ...task,
                    completed: newCompleted,
                    completedAt: newCompleted ? new Date().toISOString() : null
                };
            }
            return task;
        }));

        try {
            await axios.patch(`${API_URL}/tasks/${taskId}`, { completed: newCompleted });
        } catch (e) {
            console.error("Failed to toggle task on server", e);
        }
    };

    const deleteTask = async (taskId) => {
        // Optimistic removal
        const previousTasks = tasks;
        setTasks(prev => prev.filter(task => task.id !== taskId));

        try {
            await axios.delete(`${API_URL}/tasks/${taskId}`);
        } catch (e) {
            console.error("Failed to delete task on server", e);
            setTasks(previousTasks); // Rollback on failure
        }
    };

    const updateTaskColor = async (taskId, color) => {
        // Optimistic update
        setTasks(prev => prev.map(task =>
            task.id === taskId ? { ...task, color } : task
        ));

        try {
            await axios.patch(`${API_URL}/tasks/${taskId}`, { color });
        } catch (e) {
            console.error("Failed to update task color on server", e);
        }
    };

    const handleAutoTag = async () => {
        if (!content || content.length < 20) return;
        setIsAnalyzing(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/autotag/`, { content }, {
                headers: { 'x-token': token }
            });
            const newTags = res.data.tags;
            if (newTags && newTags.length > 0) {
                const currentTags = tags ? tags.split(',').map(t => t.trim()) : [];
                const addedTags = newTags.filter(t => !currentTags.includes(t));

                if (addedTags.length > 0) {
                    setTags(prev => prev ? `${prev}, ${addedTags.join(', ')}` : addedTags.join(', '));
                    setShowTags(true);
                }
            }
        } catch (e) {
            console.error("Auto-tag failed", e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleFinishReflection = async () => {
        setIsReflecting(false);
        setShowGrowthAnim(false);
        resetEditor();
        onRefresh();
    };

    const value = {
        // State
        id, title, content, selectedMood, tags, currentFolder,
        expandedFolders, selectedDate,
        isEditorFocused, saveStatus, isTyping, isThoughtSettled,
        showGrowthAnim, ghostTitle, showHelper, showTags,
        isFullscreen,
        allHabits, completedHabitIds,
        tasks,
        suggestedTags, activeHint, isAnalyzing,
        activeOverlay, currentQuestion,
        isReflecting, learning, reflectionPrompt,

        // Computed
        isCreating, isEditing, isBrowsing, currentEntry,

        // Data from parent
        entries, folders,

        // Setters
        setTitle, setContent, setSelectedMood, setTags, setCurrentFolder,
        setSelectedDate, setIsEditorFocused, setShowTags, setIsFullscreen,
        setActiveHint, setActiveOverlay, setCurrentQuestion,
        setLearning, setReflectionPrompt,

        // Actions
        loadEntryData, resetEditor, saveEntry, deleteEntry,
        toggleFolder, toggleHabit, handleAddHabit, handleDeleteHabit,
        handleAutoTag, handleFinishReflection, onRefresh,

        // Task Actions
        addTask, toggleTask, deleteTask, updateTaskColor
    };

    return (
        <JournalContext.Provider value={value}>
            {children}
        </JournalContext.Provider>
    );
};

export const useJournal = () => {
    const context = useContext(JournalContext);
    if (!context) {
        throw new Error('useJournal must be used within JournalProvider');
    }
    return context;
};
