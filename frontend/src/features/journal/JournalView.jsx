import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Folder, Lock, Unlock, Clock, Sparkles, Smile, Sun, Meh, Moon, Frown,
    Sprout, Tag, Save, CheckCircle, Wand2, Trash2, ChevronLeft, ChevronRight,
    Plus, Search, FileText, Settings, BarChart2, ChevronDown, ChevronUp
} from 'lucide-react';
import { analyzeEntry } from '../../ai/SemanticEngine';
import MoodSelector from './components/MoodSelector';
import Sidebar from './components/Sidebar';
import CalendarPanel from './components/CalendarPanel';
import QuickCheckIn from './components/QuickCheckIn';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import ToastNotification from './components/ToastNotification';

// Helper: Animate numbers
const CountUp = ({ end, duration = 1000 }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = 0;
        const increment = end / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(Math.ceil(start));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [end, duration]);
    return <span>{count}</span>;
};

const JournalView = ({ entries, folders, entryToEdit, activeFolder: initialActiveFolder, isPrivate, setIsPrivate, onRefresh, setAppBackground }) => {
    // Editor State
    const [id, setId] = useState(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const [selectedMood, setSelectedMood] = useState('😐');
    const [previewMood, setPreviewMood] = useState(null); // New: For hover preview
    const [activeHint, setActiveHint] = useState(null); // New: Smart tag hint
    const [tags, setTags] = useState('');
    const [currentFolder, setCurrentFolder] = useState(initialActiveFolder || 'Journal'); // Local folder state for Pill

    // Navigation State
    const [expandedFolders, setExpandedFolders] = useState([initialActiveFolder || 'Journal']); // For Accordion
    const [selectedDate, setSelectedDate] = useState(null); // Active Recall: Date Filter

    // --- MODAL & TOAST ---
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, entryId: null, entryTitle: '' });
    const [isDeleting, setIsDeleting] = useState(false);
    const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success', id: 0 });
    const [optimisticDeletedIds, setOptimisticDeletedIds] = useState([]);

    // Smart Feature State
    const [suggestedTags, setSuggestedTags] = useState([]);
    const [isReflecting, setIsReflecting] = useState(false);
    const [learning, setLearning] = useState('');
    const [reflectionPrompt, setReflectionPrompt] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Animation/UI State
    const [isEditorFocused, setIsEditorFocused] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isThoughtSettled, setIsThoughtSettled] = useState(true);
    const [saveStatus, setSaveStatus] = useState('idle');
    const [showGrowthAnim, setShowGrowthAnim] = useState(false);
    const [ghostTitle, setGhostTitle] = useState('');
    const [showHelper, setShowHelper] = useState(false);
    const [showTags, setShowTags] = useState(false);
    const typingTimeoutRef = useRef(null);

    const [searchTerm, setSearchTerm] = useState('');

    // --- HABIT STATE ---
    const [allHabits, setAllHabits] = useState([]);
    const [completedHabitIds, setCompletedHabitIds] = useState([]);
    const [isManagingHabits, setIsManagingHabits] = useState(false);
    const [newHabitName, setNewHabitName] = useState('');
    const [newHabitIcon, setNewHabitIcon] = useState('⚡️');
    const [isInsightsOpen, setIsInsightsOpen] = useState(false); // For Soft Dropdown

    // NOTE: In a real app, API_URL should be imported from a config/context
    const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

    // Fetch Habits
    useEffect(() => {
        fetchHabits();
    }, []);

    const fetchHabits = async () => {
        try {
            const res = await axios.get(`${API_URL}/habits/`);
            setAllHabits(res.data);
        } catch (e) { console.error("Failed to fetch habits"); }
    };

    const toggleHabit = (habitId) => {
        if (completedHabitIds.includes(habitId)) {
            setCompletedHabitIds(prev => prev.filter(id => id !== habitId));
        } else {
            setCompletedHabitIds(prev => [...prev, habitId]);
        }
    };

    const handleAddHabit = async () => {
        if (!newHabitName) return;
        try {
            await axios.post(`${API_URL}/habits/`, { name: newHabitName, icon: newHabitIcon });
            setNewHabitName('');
            fetchHabits();
        } catch (e) { console.error(e); }
    };

    const handleDeleteHabit = async (habitId) => {
        if (!window.confirm("Delete this habit?")) return;
        try {
            await axios.delete(`${API_URL}/habits/${habitId}`);
            fetchHabits();
        } catch (e) { console.error(e); }
    };

    const moodThemes = {
        '😄': '#FFF9C4', '🙂': '#DCEDC8', '😐': '#F5F7F5', '😞': '#E1F5FE', '😡': '#FFEBEE',
    };
    const moods = [
        { icon: <Smile size={24} />, value: '😄', label: 'Happy' },
        { icon: <Sun size={24} />, value: '🙂', label: 'Good' },
        { icon: <Meh size={24} />, value: '😐', label: 'Neutral' },
        { icon: <Moon size={24} />, value: '😞', label: 'Sad' },
        { icon: <Frown size={24} />, value: '😡', label: 'Angry' },
    ];
    // Life OS: "Deep Dive" Questions
    const DEEP_DIVE_QUESTIONS = {
        reflect: [
            "What is one thing you learned about yourself today?",
            "If you could live today over again, what would you do differently?",
            "What gave you energy today? What took it away?",
            "What are you avoiding right now?"
        ],
        vent: [
            "What is the specific emotion you are feeling right now?",
            "Is this feeling a fact, or an interpretation?",
            "What would the 'best version of you' say to this situation?",
            "Write it all out. Leave nothing in your head."
        ],
        gratitude: [
            "Who is someone that made your life easier today?",
            "What is a small thing you took for granted today?",
            "What is a challenge that turned into a lesson?",
            "List 3 things that made you smile."
        ]
    };

    const [activeOverlay, setActiveOverlay] = useState(null); // 'reflect', 'vent', 'gratitude' or null
    const [currentQuestion, setCurrentQuestion] = useState('');

    const openOverlay = (type) => {
        const questions = DEEP_DIVE_QUESTIONS[type];
        const randomQ = questions[Math.floor(Math.random() * questions.length)];
        setCurrentQuestion(randomQ);
        setActiveOverlay(type);
    };

    const helperStyle = {
        background: 'white', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '15px',
        cursor: 'pointer', fontSize: '12px', color: '#4a5568', transition: 'all 0.2s'
    };

    // --- DERIVED STATE ---
    // We need to access entries from ALL folders for navigation, or just scoped?
    // Let's keep navigation simple: Arrows navigate within the *currently selected folder* of the entry being edited.
    const currentContextEntries = entries
        .filter(e => e.folder === currentFolder)
        .sort((a, b) => b.id - a.id);

    const currentIndex = id ? currentContextEntries.findIndex(e => e.id === id) : -1;
    const prevEntry = currentIndex !== -1 && currentIndex < currentContextEntries.length - 1 ? currentContextEntries[currentIndex + 1] : null;
    const nextEntry = currentIndex !== -1 && currentIndex > 0 ? currentContextEntries[currentIndex - 1] : null;

    // --- EFFECTS ---

    // Sync folder from App.jsx (fixes folder navigation bug)
    useEffect(() => {
        if (initialActiveFolder && initialActiveFolder !== currentFolder) {
            setCurrentFolder(initialActiveFolder);
            // Expand the folder when navigating to it
            if (!expandedFolders.includes(initialActiveFolder)) {
                setExpandedFolders([initialActiveFolder]);
            }
        }
    }, [initialActiveFolder]);

    // Sync background
    useEffect(() => {
        setAppBackground(moodThemes[selectedMood] || '#F5F7F5');
    }, [selectedMood]);

    // Load Entry
    useEffect(() => {
        if (entryToEdit) {
            loadEntryData(entryToEdit);
        }
    }, [entryToEdit]); // Don't reset if entryToEdit is null, unless explicit? 
    // actually usually we want to reset if entryToEdit becomes null, but here we might just stay in "New" mode.
    // The parent passes null when switching views, but maybe we just stick to manual reset.

    const loadEntryData = (entry) => {
        setId(entry.id);
        setTitle(entry.title);
        setContent(entry.content);
        setSelectedMood(entry.mood);
        setCurrentFolder(entry.folder);
        // Load completed habits (assuming backend returns them)
        if (entry.completed_habits) {
            setCompletedHabitIds(entry.completed_habits.map(h => h.id));
        } else {
            setCompletedHabitIds([]); // Reset if new/legacy
        }
        setCurrentFolder(entry.folder); // Update pill to match entry

        // Ensure the folder containing this entry is expanded
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
        setId(null); setTitle(''); setContent('');
        setSelectedMood('😐'); setTags('');
        setCompletedHabitIds([]); // Reset habits
        // Keep currentFolder as is (sticky selection)
    };


    const toggleFolder = (folder) => {
        if (expandedFolders.includes(folder)) {
            setExpandedFolders([]);
        } else {
            setExpandedFolders([folder]);
        }
    };

    // Auto-close accordion after 10s of inactivity
    useEffect(() => {
        if (expandedFolders.length === 0) return;
        const timer = setTimeout(() => {
            setExpandedFolders([]);
        }, 10000);
        return () => clearTimeout(timer);
    }, [expandedFolders]);

    // Life OS: "Thought Settling" Engine
    useEffect(() => {
        if (isEditorFocused) {
            setIsTyping(true);
            setIsThoughtSettled(false);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

            // The "Settling" Phase
            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
                setIsThoughtSettled(true); // Thoughts have settled
                setShowHelper(true);
            }, 2000); // 2 seconds of silence = settled thought
        } else {
            setIsTyping(false);
            setIsThoughtSettled(true);
            setShowHelper(false);
        }
        return () => clearTimeout(typingTimeoutRef.current);
    }, [content, isEditorFocused]);

    // Ghost Title
    useEffect(() => {
        if (!title && content.length > 5) {
            const words = content.split(' ').slice(0, 3).join(' ');
            setGhostTitle(words + '...');
        } else {
            setGhostTitle('');
        }
    }, [title, content]);

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

        // Life OS: Smart Hint Logic (Full Scan)
        const words = lowerContent.split(/[\s\n]+/).map(w => w.replace(/[^a-z0-9]/g, ''));
        let foundTag = null;

        // Scan ALL content to find first untagged keyword
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

    // --- ACTIONS ---

    // insertPrompt replaced by openOverlay above

    const handleAutoTitle = () => {
        if (!content) return;
        const words = content.split(' ').slice(0, 5).join(' ');
        setTitle(words + '...');
    };

    const handleTitleKeyDown = (e) => {
        if (e.key === 'Tab' && ghostTitle) {
            e.preventDefault();
            setTitle(ghostTitle);
            setGhostTitle('');
        }
    };

    // Autosave Timer ref
    const autosaveTimerRef = useRef(null);

    // Contextual Save (Create or Update)
    const saveEntry = async (silent = true) => {
        if (!content && !title) return;

        if (!silent) setIsAnalyzing(true);
        if (!silent) setSaveStatus('saving');
        // Silent save doesn't change status to 'saving' visibly unless we want a small indicator

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
                setId(res.data.id); // Switch to Update mode
            }

            if (!silent) {
                setShowGrowthAnim(true);
            }
            setSaveStatus('saved');
            onRefresh();

            if (!silent) {
                setTimeout(() => {
                    setSaveStatus('idle');
                    setIsReflecting(true);
                }, 1200);
            } else {
                // Clear 'saved' after 2s for cleaner UI
                setTimeout(() => setSaveStatus('idle'), 2000);
            }
        } catch (e) { console.error(e); setSaveStatus('error'); }
    };

    // Autosave Effect
    useEffect(() => {
        if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
        if (content || title) {
            setSaveStatus('saving-quiet'); // subtle indicator
            autosaveTimerRef.current = setTimeout(() => {
                saveEntry(true);
            }, 2000); // 2s debounce
        }
        return () => clearTimeout(autosaveTimerRef.current);
    }, [content, title, selectedMood, tags, currentFolder]);

    // Manual Trigger (for "Done" button if we add one)
    const handleSaveEntry = () => saveEntry(false);

    const handleFinishReflection = async () => {
        setIsReflecting(false);
        setShowGrowthAnim(false);
        resetEditor();
        onRefresh();
    };

    const handleDelete = (e, entryId) => {
        if (e) e.stopPropagation();
        const entry = entries.find(e => e.id === entryId);
        setDeleteModal({
            isOpen: true,
            entryId,
            entryTitle: entry ? entry.title : 'Untitled Entry'
        });
    };

    const confirmDelete = async () => {
        const idToDelete = deleteModal.entryId;
        if (!idToDelete) return;

        setIsDeleting(true);
        // Optimistic UI Update
        setOptimisticDeletedIds(prev => [...prev, idToDelete]);

        try {
            await axios.delete(`${API_URL}/entries/${idToDelete}`);
            setToast({ isVisible: true, message: 'Entry deleted successfully', type: 'success', id: Date.now() });

            if (id === idToDelete) resetEditor();
            onRefresh();
        } catch (e) {
            console.error(e);
            // Rollback UI
            setOptimisticDeletedIds(prev => prev.filter(pid => pid !== idToDelete));
            setToast({ isVisible: true, message: 'Failed to delete entry', type: 'error', id: Date.now() });
        } finally {
            setIsDeleting(false);
            setDeleteModal({ isOpen: false, entryId: null, entryTitle: '' });
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
                // Determine new unique tags
                const currentTags = tags ? tags.split(',').map(t => t.trim()) : [];
                const addedTags = newTags.filter(t => !currentTags.includes(t));

                if (addedTags.length > 0) {
                    setTags(prev => prev ? `${prev}, ${addedTags.join(', ')}` : addedTags.join(', '));
                    // Show a small success toast or indicator?
                    // For now, expand the tags view
                    setShowTags(true);
                }
            }
        } catch (e) {
            console.error("Auto-tag failed", e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // --- RENDER ---
    // --- RESIZE STATE ---
    const [middleWidth, setMiddleWidth] = useState(260);
    const [rightWidth, setRightWidth] = useState(280);
    const isDraggingMiddle = useRef(false);
    const isDraggingRight = useRef(false);

    const handleQuickAdd = async (text) => {
        try {
            await axios.post(`${API_URL}/entries/`, {
                title: 'Quick Note',
                content: text,
                folder: 'Journal', // Default to Journal
                mood: '😐'
            });
            onRefresh();
        } catch (e) {
            console.error("Quick add failed", e);
        }
    };

    // --- RESIZE HANDLERS ---
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isDraggingMiddle.current) {
                const newWidth = Math.max(200, Math.min(600, e.clientX - 70 - 40)); // Approximate offset logic (Sidebar width + padding)
                // Actually, logic is cleaner if we just use movementX, but absolute clientX is safer.
                // We need to know where the container starts. 
                // Let's assume Left Sidebar is roughly steady.
                // Better approach: 
                setMiddleWidth(prev => Math.max(150, Math.min(500, prev + e.movementX)));
            }
            if (isDraggingRight.current) {
                setRightWidth(prev => Math.max(200, Math.min(500, prev - e.movementX)));
            }
        };

        const handleMouseUp = () => {
            isDraggingMiddle.current = false;
            isDraggingRight.current = false;
            document.body.style.cursor = 'default';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const startResizeMiddle = (e) => {
        e.preventDefault();
        isDraggingMiddle.current = true;
        document.body.style.cursor = 'col-resize';
    };

    const startResizeRight = (e) => {
        e.preventDefault();
        isDraggingRight.current = true;
        document.body.style.cursor = 'col-resize';
    };


    // --- RENDER ---
    return (
        <div className={`journal-view-container ${isEditorFocused ? 'focus-mode' : ''} ${isThoughtSettled ? 'thought-settled' : ''}`}
            style={{
                display: 'flex', height: '100%', gap: '0',
                '--active-mood-color': moodThemes[previewMood || selectedMood] || 'transparent'
            }}>

            {/* --- MIDDLE COLUMN: ACCORDION SIDEBAR --- */}
            <div className="sidebar-transition sidebar-left"
                style={{ width: `${middleWidth}px`, borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', flexShrink: 0, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                <Sidebar
                    entries={entries.filter(e => !optimisticDeletedIds.includes(e.id))}
                    folders={folders}
                    expandedFolders={expandedFolders}
                    toggleFolder={toggleFolder}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    selectedEntryId={id}
                    onEntryClick={loadEntryData}
                    onDeleteEntry={handleDelete}
                />
            </div>

            {/* RESIZER 1 */}
            <div onMouseDown={startResizeMiddle} className="resizer">
                <div className="resizer-line"></div>
            </div>

            {/* --- RIGHT COLUMN: EDITOR --- */}
            <div className={`app-container ${isTyping || isEditorFocused ? 'zen-mode' : ''}`}
                style={{
                    flex: 1, margin: '0 20px', display: 'flex', flexDirection: 'column', height: '100%', minWidth: '400px',
                    overflowY: 'auto' /* Enable independent scrolling */
                }}>

                {/* Growth Animation Overlay */}
                {showGrowthAnim && (
                    <div className="growth-overlay">
                        <Sprout size={100} className="growth-icon" />
                    </div>
                )}

                {/* Top Bar: Breadcrumbs & Navigation */}
                <div className="top-bar-container" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', color: 'var(--muted-text)', fontSize: '13px', alignItems: 'center', transition: 'opacity 0.5s' }}>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--contrast-text)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <FileText size={14} /> {id ? (title || 'Untitled') : 'New Entry'}
                        </span>
                        {id && <span style={{ marginLeft: '10px', background: 'var(--bg-secondary)', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', color: 'var(--muted-text)' }}>#{id}</span>}
                    </div>

                    <div style={{ flex: 1 }}></div>

                    {/* Controls */}
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <button onClick={resetEditor} title="New Note" style={{ background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: '20px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 'bold' }}>
                            <Plus size={14} /> New
                        </button>
                        {/* Arrows */}
                        <div style={{ display: 'flex', gap: '2px', background: 'var(--bg-primary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <button disabled={!prevEntry} onClick={() => loadEntryData(prevEntry)} title="Previous (Older)"
                                style={{ padding: '4px 8px', border: 'none', background: 'transparent', cursor: prevEntry ? 'pointer' : 'default', opacity: prevEntry ? 1 : 0.3, color: 'var(--contrast-text)' }}>
                                <ChevronLeft size={16} />
                            </button>
                            <div style={{ width: '1px', background: 'var(--border-color)' }}></div>
                            <button disabled={!nextEntry} onClick={() => loadEntryData(nextEntry)} title="Next (Newer)"
                                style={{ padding: '4px 8px', border: 'none', background: 'transparent', cursor: nextEntry ? 'pointer' : 'default', opacity: nextEntry ? 1 : 0.3, color: 'var(--contrast-text)' }}>
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        <div style={{ cursor: 'pointer', display: 'flex', gap: '5px', alignItems: 'center', color: 'var(--muted-text)' }} onClick={() => setIsPrivate(!isPrivate)}>
                            {isPrivate ? <Lock size={14} /> : <Unlock size={14} />}
                        </div>

                        {id && (
                            <button onClick={(e) => handleDelete(e, id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--nothing-red)', opacity: 0.6 }} title="Delete Entry">
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Mood Selector - Animated */}
                <div className="mood-selector-container" style={{ marginBottom: '20px', textAlign: 'center', transition: 'opacity 0.5s', maxWidth: '680px', margin: '0 auto 20px auto', width: '100%' }}>
                    <MoodSelector
                        selectedMood={selectedMood}
                        onSelectMood={setSelectedMood}
                        onPreview={setPreviewMood}
                    />
                </div>

                {/* Writing Helpers */}
                {showHelper && (
                    <div className="helper-reveal helper-buttons-container" style={{ display: 'flex', gap: '10px', marginBottom: '15px', justifyContent: 'center', transition: 'opacity 0.5s', maxWidth: '680px', margin: '0 auto 15px auto', width: '100%' }}>
                        <button onClick={() => openOverlay('reflect')} style={helperStyle}>🤔 Deep Dive</button>
                        <button onClick={() => openOverlay('vent')} style={helperStyle}>😤 Clear Mind</button>
                        <button onClick={() => openOverlay('gratitude')} style={helperStyle}>🙏 Give Thanks</button>
                    </div>
                )}
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <button onClick={() => setContent('')} style={{ ...helperStyle, color: 'var(--nothing-red)', opacity: content ? 1 : 0 }}>Clear</button>
                </div>

                {/* Editor Card Container */}
                <div className={`editor-card ${isEditorFocused ? 'focused' : ''}`}
                    style={{
                        boxShadow: isEditorFocused ? 'var(--card-shadow)' : 'none',
                        border: isEditorFocused ? '1px solid var(--border-color)' : '1px solid transparent',
                        position: 'relative',
                        maxWidth: '680px', margin: '0 auto', width: '100%'
                    }}>
                    {/* Life OS: Smart Floating Hint */}
                    {activeHint && (
                        <div className="fail-safe-hint fade-in-up"
                            onClick={() => {
                                setTags(prev => prev ? `${prev}, ${activeHint}` : activeHint);
                                setActiveHint(null);
                            }}
                            style={{
                                position: 'absolute', bottom: '20px', right: '20px',
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--accent-primary)',
                                padding: '8px 16px', borderRadius: '20px',
                                color: 'var(--accent-primary)', fontSize: '12px', fontWeight: 'bold',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.1)', cursor: 'pointer',
                                zIndex: 50, display: 'flex', alignItems: 'center', gap: '6px'
                            }}>
                            <Sparkles size={12} /> Add #{activeHint}
                        </div>
                    )}

                    {/* Editor - Ghost Text & Focus */}
                    <div className="ghost-input-container" style={{ marginBottom: '15px' }}>
                        <input
                            placeholder="Title..."
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            onKeyDown={handleTitleKeyDown}
                            onFocus={() => setIsEditorFocused(true)}
                            style={{ fontSize: '32px', fontWeight: 'bold', border: 'none', background: 'transparent', width: '100%', outline: 'none', color: 'var(--contrast-text)', position: 'relative', zIndex: 1 }}
                        />
                        {ghostTitle && !title && <div className="ghost-text visible" style={{ fontSize: '32px', color: 'var(--muted-text)' }}>{ghostTitle}</div>}

                        {content.length > 10 && !title && !ghostTitle && (
                            <button onClick={handleAutoTitle} style={{ position: 'absolute', right: 0, top: '5px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)' }}>
                                <Sparkles size={20} />
                            </button>
                        )}
                    </div>

                    <textarea
                        placeholder="Start writing..."
                        value={content}
                        onChange={e => { setContent(e.target.value); if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); }}
                        onFocus={() => setIsEditorFocused(true)}
                        onBlur={() => setIsEditorFocused(false)}
                        style={{ width: '100%', minHeight: '400px', border: 'none', background: 'transparent', fontSize: '18px', lineHeight: '1.8', outline: 'none', resize: 'none', color: 'var(--contrast-text)', fontFamily: 'var(--font-sans)', caretColor: 'var(--accent-primary)' }}
                    />
                </div>

                {/* Delight Button */}
                {content.length > 50 && (
                    <div style={{ margin: '10px 0', textAlign: 'center' }}>
                        <button onClick={() => setContent(content + '\n\n✨ Today I learned: ')}
                            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', color: 'var(--accent-primary)', fontSize: '13px' }}>
                            ✨ Add a small win
                        </button>
                    </div>
                )}

                {/* Life OS: Deep Dive Overlay */}
                {activeOverlay && (
                    <div className="overlay-backdrop" onClick={() => setActiveOverlay(null)}>
                        <div className="deep-dive-card" onClick={e => e.stopPropagation()}>
                            <h3 style={{ color: 'var(--accent-primary)', marginBottom: '10px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {activeOverlay === 'vent' ? 'Clear Your Mind' : (activeOverlay === 'reflect' ? 'Deep Reflection' : 'Gratitude Practice')}
                            </h3>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', lineHeight: '1.4', color: 'var(--contrast-text)' }}>
                                {currentQuestion}
                            </div>
                            <textarea
                                autoFocus
                                placeholder="Type your answer..."
                                style={{ width: '100%', minHeight: '100px', border: 'none', background: 'var(--bg-secondary)', padding: '15px', borderRadius: '10px', fontSize: '16px', color: 'var(--contrast-text)', resize: 'none', outline: 'none' }}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        // Save to journal
                                        const newEntry = `\n\n### ${currentQuestion}\n${e.target.value}`;
                                        setContent(prev => prev + newEntry);
                                        setActiveOverlay(null);
                                    }
                                }}
                            />
                            <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--muted-text)', textAlign: 'right' }}>
                                Press <strong>Enter</strong> to save to journal
                            </div>
                        </div>
                    </div>
                )}

                {/* Bottom Bar - Animated Save */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {/* Tags Area */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {!showTags ? (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => setShowTags(true)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-text)', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', padding: '4px 8px', borderRadius: '6px', ':hover': { background: 'var(--bg-secondary)' } }}>
                                        <Tag size={14} /> + Tags
                                    </button>

                                    <button onClick={handleAutoTag} disabled={isAnalyzing || !content || content.length < 20}
                                        title="AI Auto-Tag"
                                        style={{
                                            background: isAnalyzing ? 'var(--bg-secondary)' : 'var(--accent-primary)',
                                            opacity: (!content || content.length < 20) ? 0.5 : 1,
                                            border: 'none', cursor: (!content || content.length < 20) ? 'default' : 'pointer',
                                            color: isAnalyzing ? 'var(--muted-text)' : '#fff',
                                            display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px',
                                            padding: '4px 10px', borderRadius: '15px', fontWeight: '500',
                                            transition: 'all 0.2s'
                                        }}>
                                        {isAnalyzing ? <span className="animate-spin">⏳</span> : <Sparkles size={12} />}
                                        {isAnalyzing ? 'Analyzing...' : 'Auto-Tag'}
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--muted-text)', marginRight: '5px' }}>SUGGESTED:</div>
                                    {suggestedTags.map(st => (
                                        <button key={st} onClick={() => setTags(prev => prev ? `${prev}, ${st}` : st)}
                                            style={{ fontSize: '11px', color: 'var(--accent-primary)', background: 'var(--bg-secondary)', border: 'none', padding: '4px 8px', borderRadius: '10px', cursor: 'pointer', fontWeight: '500' }}>
                                            + {st}
                                        </button>
                                    ))}
                                    <input
                                        autoFocus
                                        placeholder="work, health..."
                                        value={tags}
                                        onChange={e => setTags(e.target.value)}
                                        onBlur={() => !tags && setShowTags(false)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                setShowTags(false);
                                                saveEntry(true);
                                            }
                                        }}
                                        className="tag-pill"
                                        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '15px', fontSize: '13px', outline: 'none', color: 'var(--contrast-text)', minWidth: '150px' }}
                                    />
                                </div>
                            )}
                        </div>
                        {/* Autosave Indicator */}
                        <div style={{
                            background: 'var(--bg-primary)', padding: '6px 12px', borderRadius: '20px',
                            border: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--muted-text)',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            opacity: saveStatus === 'idle' ? 0 : 1, transition: 'opacity 0.5s'
                        }}>
                            {saveStatus === 'saved' ? <CheckCircle size={12} color="var(--accent-primary)" /> : <Clock size={12} />}
                            {saveStatus === 'saved' ? 'Saved' : 'Saving...'}
                        </div>
                    </div>
                </div>

                {/* Reflection Overlay */}
                {isReflecting && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--glass-bg)', backdropFilter: 'blur(5px)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: 'var(--radius-lg)'
                    }}>
                        <h3 style={{ color: 'var(--accent-primary)', marginBottom: '15px' }}>Entry Saved.</h3>
                        <p className="fade-in-up" style={{ color: 'var(--contrast-text)', marginBottom: '20px', fontSize: '20px', fontWeight: '500', maxWidth: '80%', textAlign: 'center' }}>
                            {reflectionPrompt || "What is one thing you learned today?"}
                        </p>
                        <input value={learning} onChange={e => setLearning(e.target.value)} placeholder="Type your answer..."
                            autoFocus
                            onKeyDown={e => e.key === 'Enter' && handleFinishReflection()}
                            style={{
                                border: 'none', borderBottom: '2px solid var(--accent-primary)', background: 'transparent',
                                fontSize: '16px', color: 'var(--contrast-text)', width: '60%', textAlign: 'center', outline: 'none', padding: '10px'
                            }}
                        />
                        <button onClick={handleFinishReflection} style={{ marginTop: '30px', background: 'transparent', color: 'var(--muted-text)', border: 'none', cursor: 'pointer' }}>
                            Skip / Done
                        </button>
                    </div>
                )}
            </div>

            {/* RESIZER 2 */}
            <div onMouseDown={startResizeRight} className="resizer">
                <div className="resizer-line"></div>
            </div>

            {/* --- UNIFIED LIFE PANEL (RIGHT RAIL) --- */}
            <div className="sidebar-transition sidebar-right"
                style={{ width: `${rightWidth}px`, paddingLeft: '10px', display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border-color)', background: 'var(--bg-secondary)', height: '100%', flexShrink: 0 }}>

                {/* 1. QUICK CHECK-IN (TOP) */}
                {/* 1. QUICK NOTE & HABITS */}
                <div style={{ flex: '0 0 auto', maxHeight: '60%', overflowY: 'auto', paddingRight: '5px' }}>

                    <div style={{ marginBottom: '20px', paddingTop: '10px' }}>
                        <QuickCheckIn
                            onAddEntry={handleQuickAdd}
                            isManagingHabits={isManagingHabits}
                            onToggleManage={() => setIsManagingHabits(!isManagingHabits)}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 5, paddingBottom: '5px' }}>
                        <h4 style={{ margin: 0, color: 'var(--contrast-text)', fontSize: '14px', fontWeight: '600' }}>Habit Tracker</h4>
                        <Settings size={14} color="var(--muted-text)" style={{ cursor: 'pointer', opacity: 0.8 }} onClick={() => setIsManagingHabits(!isManagingHabits)} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {allHabits.map(h => {
                            const isDone = completedHabitIds.includes(h.id);
                            return (
                                <div key={h.id} onClick={() => !isManagingHabits && toggleHabit(h.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px',
                                        background: isDone ? 'var(--contrast-text)' : 'var(--bg-primary)',
                                        border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s',
                                        color: isDone ? 'var(--bg-primary)' : 'var(--contrast-text)',
                                        borderRadius: 'var(--radius-md)', marginBottom: '8px',
                                        boxShadow: 'var(--shadow-soft)'
                                    }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isDone ? 'var(--nothing-red)' : 'var(--border-color)', boxShadow: isDone ? '0 0 5px var(--nothing-red)' : 'none' }}></div>
                                        <span style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{h.name}</span>
                                    </div>
                                    <span style={{ fontSize: '16px', opacity: isDone ? 1 : 0.5 }}>{h.icon}</span>
                                    {isManagingHabits && (
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteHabit(h.id); }} style={{ border: 'none', background: 'transparent', color: 'var(--nothing-red)', cursor: 'pointer' }}>
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Inline Add Button */}
                    {isManagingHabits || allHabits.length === 0 ? (
                        <div style={{ marginTop: '15px', border: '1px dashed var(--muted-text)', padding: '10px', background: 'var(--bg-primary)' }}>
                            <div style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                                <input placeholder="Name..." value={newHabitName} onChange={e => setNewHabitName(e.target.value)}
                                    style={{ flex: 1, border: 'none', borderBottom: '1px solid var(--contrast-text)', background: 'transparent', color: 'var(--contrast-text)', outline: 'none', fontSize: '12px', fontFamily: 'var(--font-mono)', padding: '4px' }} />
                                <input placeholder="Icon" value={newHabitIcon} onChange={e => setNewHabitIcon(e.target.value)}
                                    style={{ width: '30px', border: 'none', borderBottom: '1px solid var(--contrast-text)', background: 'transparent', color: 'var(--contrast-text)', outline: 'none', fontSize: '12px', textAlign: 'center' }} />
                            </div>
                            <button onClick={handleAddHabit} style={{ width: '100%', background: 'var(--contrast-text)', color: 'var(--bg-primary)', border: 'none', padding: '6px', fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
                                + ADD
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setIsManagingHabits(true)} style={{ marginTop: '15px', width: '100%', border: '1px dashed var(--muted-text)', background: 'transparent', padding: '8px', color: 'var(--muted-text)', fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
                            + ADD NEW
                        </button>
                    )}
                </div>

                {/* 2. INSIGHTS (SOFT DROPDOWN - MIDDLE) */}
                <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                    <div onClick={() => setIsInsightsOpen(!isInsightsOpen)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', cursor: 'pointer', color: 'var(--muted-text)' }}>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--contrast-text)' }}>
                            <BarChart2 size={16} /> Insights
                        </h4>
                        {isInsightsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>

                    {isInsightsOpen && (
                        <div className="fade-in-up" style={{ padding: '0 0 20px 0' }}>
                            <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', padding: '15px', borderRadius: '4px' }}>
                                <div style={{ fontSize: '10px', color: 'var(--muted-text)', fontFamily: 'var(--font-mono)', marginBottom: '5px' }}>THIS WEEK</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'baseline', gap: '5px', color: 'var(--contrast-text)' }}>
                                    <CountUp end={entries.filter(e => {
                                        const d = new Date(e.date || Date.now());
                                        const now = new Date();
                                        return d > new Date(now.setDate(now.getDate() - 7));
                                    }).length} />
                                    <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--muted-text)' }}>entries</span>
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--nothing-red)', marginTop: '10px' }}>Keep the streak alive! 🔥</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. CALENDAR (BOTTOM PINNED) */}
                <div style={{ marginTop: 'auto', paddingTop: '20px', paddingBottom: '20px', width: '100%' }}>
                    <CalendarPanel
                        entries={entries.filter(e => !optimisticDeletedIds.includes(e.id))}
                        selectedDate={selectedDate}
                        onDateSelect={setSelectedDate}
                    />
                </div>
            </div>
            {/* --- MODALS --- */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmDelete}
                entryTitle={deleteModal.entryTitle}
                isDeleting={isDeleting}
            />

            <ToastNotification
                isVisible={toast.isVisible}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />
        </div>
    );
};

export default JournalView;
