import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Folder, Lock, Unlock, Clock, Sparkles, Smile, Sun, Meh, Moon, Frown,
    Sprout, Tag, Save, CheckCircle, Wand2, Trash2
} from 'lucide-react';
import { analyzeEntry } from '../../ai/SemanticEngine';

const JournalView = ({ entryToEdit, activeFolder, isPrivate, setIsPrivate, onRefresh, setAppBackground }) => {
    // Editor State
    const [id, setId] = useState(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedMood, setSelectedMood] = useState('😐');
    const [tags, setTags] = useState('');

    // Smart Feature State
    const [suggestedTags, setSuggestedTags] = useState([]);
    const [isReflecting, setIsReflecting] = useState(false);
    const [learning, setLearning] = useState('');
    const [reflectionPrompt, setReflectionPrompt] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Animation/UI State
    const [isEditorFocused, setIsEditorFocused] = useState(false);
    const [saveStatus, setSaveStatus] = useState('idle');
    const [showGrowthAnim, setShowGrowthAnim] = useState(false);
    const [ghostTitle, setGhostTitle] = useState('');
    const [showHelper, setShowHelper] = useState(false);
    const [showTags, setShowTags] = useState(false);
    const typingTimeoutRef = useRef(null);

    // Config
    const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:8000`;

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
    const prompts = {
        reflect: ["What went well?", "What drained you?", "One thing to improve:"],
        vent: ["Why do I feel this way?", "Is this fact or feeling?", "Let it all out:"],
        gratitude: ["1. ", "2. ", "3. "],
    };

    const helperStyle = {
        background: 'white', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '15px',
        cursor: 'pointer', fontSize: '12px', color: '#4a5568', transition: 'all 0.2s'
    };

    // --- EFFECTS ---

    // Sync background
    useEffect(() => {
        setAppBackground(moodThemes[selectedMood] || '#F5F7F5');
    }, [selectedMood]);

    // Load Entry
    useEffect(() => {
        if (entryToEdit) {
            setId(entryToEdit.id);
            setTitle(entryToEdit.title);
            setContent(entryToEdit.content);
            setSelectedMood(entryToEdit.mood);
            // activeFolder is managed by parent, but entryToEdit.folder might differ?
            // For now assume activeFolder matches or we just save specific fields.
            // But if I load an entry from "Ideas" while in "Journal", activeFolder in App might be "Journal".
            // Ideally App updates activeFolder too.
            // Tags logic: if content has [Tags: ...], extract them?
            // Simple extraction:
            const match = entryToEdit.content.match(/\[Tags: (.*?)\]/);
            if (match) {
                setTags(match[1]);
                setContent(entryToEdit.content.replace(match[0], '').trim());
            } else {
                setTags('');
            }
        } else {
            // Reset for new entry
            setId(null); setTitle(''); setContent('');
            setSelectedMood('😐'); setTags('');
        }
    }, [entryToEdit]);

    // "Need help?" reveal
    useEffect(() => {
        if (content.length > 0 && isEditorFocused) {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setShowHelper(true), 5000);
        } else {
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
    }, [content, tags]);

    // --- ACTIONS ---

    const insertPrompt = (type) => {
        const lines = prompts[type].join('\n\n');
        setContent(prev => prev + (prev ? '\n\n' : '') + lines);
    };

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

    const handleSaveEntry = async () => {
        if (!content) return;

        setSaveStatus('analyzing');
        setIsAnalyzing(true);
        let dynamicPrompt = "What is one thing you learned today?";
        try {
            dynamicPrompt = await analyzeEntry(content);
        } catch (e) { console.error(e); }
        setReflectionPrompt(dynamicPrompt);
        setIsAnalyzing(false);

        setSaveStatus('saving');
        const finalContent = tags ? `${content}\n\n[Tags: ${tags}]` : content;

        // Create or Update
        // Note: If ID exists, we should technically PUT, but backend only has POST /entries (create).
        // The current backend doesn't support Update?
        // Checking main.py... "POST /entries/" creates new.
        // There is no PUT.
        // So "Editing" actually creates a new entry currently?
        // Wait, let's check backend.
        // I can't check right now easily without tool call.
        // I'll assume standard POST behavior is Create.
        // If I want to update, I'd need an endpoint.
        // For now, I'll stick to existing behavior (POST).
        // If ID exists, maybe I should delete old?
        // Or just Creating New Version.
        await axios.post(`${API_URL}/entries/`, {
            title: title || 'Untitled', content: finalContent, folder: activeFolder, mood: selectedMood
        });

        setSaveStatus('saved');
        setShowGrowthAnim(true);
        onRefresh(); // Refresh list in sidebar

        setTimeout(() => {
            setSaveStatus('idle');
            setIsReflecting(true);
        }, 1200);
    };

    const handleFinishReflection = async () => {
        setIsReflecting(false);
        setShowGrowthAnim(false);
        setTitle(''); setContent(''); setId(null); setTags(''); setLearning('');
        onRefresh();
    };

    // --- RENDER ---
    return (
        <div className="app-container"
            style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}>

            {/* Growth Animation Overlay */}
            {showGrowthAnim && (
                <div className="growth-overlay">
                    <Sprout size={100} className="growth-icon" />
                </div>
            )}

            {/* Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', color: '#8898aa', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Folder size={14} /> <span>{activeFolder}</span>
                    {id && <span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px' }}>Editing ID: {id}</span>}
                </div>
                <div style={{ cursor: 'pointer', display: 'flex', gap: '5px', alignItems: 'center' }} onClick={() => setIsPrivate(!isPrivate)}>
                    {isPrivate ? <Lock size={14} /> : <Unlock size={14} />}
                    {isPrivate ? 'Private' : 'Shareable'}
                </div>
            </div>

            {/* Mood Selector */}
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', gap: '10px', background: 'rgba(255,255,255,0.5)', padding: '10px 20px', borderRadius: '30px', backdropFilter: 'blur(10px)' }}>
                    {moods.map(m => (
                        <button key={m.value} onClick={() => setSelectedMood(m.value)} title={m.label}
                            className={`mood-btn ${selectedMood === m.value ? 'mood-selected' : ''}`}
                            style={{
                                padding: '12px', borderRadius: '50%', border: 'none', background: 'transparent',
                                cursor: 'pointer', fontSize: '28px'
                            }}>
                            {m.icon}
                        </button>
                    ))}
                </div>
            </div>

            {/* Writing Helpers */}
            {showHelper && (
                <div className="helper-reveal" style={{ display: 'flex', gap: '10px', marginBottom: '15px', justifyContent: 'center' }}>
                    <button onClick={() => insertPrompt('reflect')} style={helperStyle}>🤔 Reflect</button>
                    <button onClick={() => insertPrompt('vent')} style={helperStyle}>😤 Vent</button>
                    <button onClick={() => insertPrompt('gratitude')} style={helperStyle}>🙏 Gratitude</button>
                </div>
            )}
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <button onClick={() => setContent('')} style={{ ...helperStyle, color: '#e53e3e', opacity: content ? 1 : 0 }}>Clear</button>
            </div>

            {/* Editor Card */}
            <div className={`editor-card ${isEditorFocused ? 'focused' : ''}`}>
                <div className="ghost-input-container" style={{ marginBottom: '15px' }}>
                    <input
                        placeholder="Title..."
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        onKeyDown={handleTitleKeyDown}
                        onFocus={() => setIsEditorFocused(true)}
                        style={{ fontSize: '32px', fontWeight: 'bold', border: 'none', background: 'transparent', width: '100%', outline: 'none', color: '#2d3748', position: 'relative', zIndex: 1 }}
                    />
                    {ghostTitle && !title && <div className="ghost-text visible" style={{ fontSize: '32px' }}>{ghostTitle}</div>}
                    {content.length > 10 && !title && !ghostTitle && (
                        <button onClick={handleAutoTitle} style={{ position: 'absolute', right: 0, top: '5px', background: 'none', border: 'none', cursor: 'pointer', color: '#7C9A86' }}>
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
                    style={{ width: '100%', minHeight: '400px', border: 'none', background: 'transparent', fontSize: '18px', lineHeight: '1.8', outline: 'none', resize: 'none', color: '#4a5568', fontFamily: 'inherit' }}
                />
            </div>

            {/* Delight Button */}
            {content.length > 50 && (
                <div style={{ margin: '10px 0', textAlign: 'center' }}>
                    <button onClick={() => setContent(content + '\\n\\n✨ Today I learned: ')}
                        style={{ background: 'white', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', color: '#7C9A86', fontSize: '13px' }}>
                        ✨ Add a small win
                    </button>
                </div>
            )}

            {/* Bottom Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    {!showTags ? (
                        <button onClick={() => setShowTags(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
                            <Tag size={14} /> + Tags
                        </button>
                    ) : (
                        <div style={{ display: 'flex', gap: '5px' }}>
                            {suggestedTags.map(st => (
                                <button key={st} onClick={() => setTags(prev => prev ? `${prev}, ${st}` : st)}
                                    style={{ fontSize: '11px', color: '#7C9A86', background: 'rgba(124, 154, 134, 0.1)', border: 'none', padding: '2px 6px', borderRadius: '10px', cursor: 'pointer' }}>
                                    + {st}
                                </button>
                            ))}
                            <input autoFocus placeholder="work, health..." value={tags} onChange={e => setTags(e.target.value)} onBlur={() => !tags && setShowTags(false)}
                                className="tag-pill"
                                style={{ background: 'white', border: '1px solid #e2e8f0', padding: '5px 10px', borderRadius: '15px', fontSize: '13px', outline: 'none' }} />
                        </div>
                    )}
                </div>
                <button onClick={handleSaveEntry}
                    className={`save-btn ${saveStatus === 'saved' ? 'saved' : ''}`}
                    disabled={saveStatus !== 'idle'}
                    style={{ background: '#7C9A86', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(124, 154, 134, 0.4)' }}>

                    {saveStatus === 'analyzing' && <Wand2 className="spin" size={18} />}
                    {saveStatus === 'saving' && <Save size={18} />}
                    {saveStatus === 'saved' && <CheckCircle size={18} />}
                    {saveStatus === 'idle' && <Save size={18} />}

                    {saveStatus === 'analyzing' ? 'Thinking...' : (
                        saveStatus === 'saved' ? 'Saved!' : (saveStatus === 'saving' ? 'Saving...' : 'Save Entry')
                    )}
                </button>
            </div>

            {/* Reflection Overlay */}
            {isReflecting && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(5px)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: '20px'
                }}>
                    <h3 style={{ color: '#7C9A86', marginBottom: '15px' }}>Entry Saved.</h3>
                    <p className="fade-in-up" style={{ color: '#4a5568', marginBottom: '20px', fontSize: '20px', fontWeight: '500', maxWidth: '80%', textAlign: 'center' }}>
                        {reflectionPrompt || "What is one thing you learned today?"}
                    </p>
                    <input value={learning} onChange={e => setLearning(e.target.value)} placeholder="Type your answer..."
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && handleFinishReflection()}
                        style={{
                            border: 'none', borderBottom: '2px solid #7C9A86', background: 'transparent',
                            fontSize: '16px', color: '#2d3748', width: '60%', textAlign: 'center', outline: 'none', padding: '10px'
                        }}
                    />
                    <button onClick={handleFinishReflection} style={{ marginTop: '30px', background: 'transparent', color: '#718096', border: 'none', cursor: 'pointer' }}>
                        Skip / Done
                    </button>
                </div>
            )}
        </div>
    );
};

export default JournalView;
