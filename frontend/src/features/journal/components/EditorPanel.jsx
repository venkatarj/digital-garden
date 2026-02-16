import React, { useState, useRef } from 'react';
import {
    FileText, Plus, ChevronLeft, ChevronRight, Lock, Unlock, Trash2,
    Sprout, Sparkles, Tag, CheckCircle, Clock
} from 'lucide-react';
import { useJournal } from '../context/JournalContext';
import MoodSelector from './MoodSelector';

const EditorPanel = ({ isPrivate, setIsPrivate, onDelete }) => {
    const {
        id, title, content, selectedMood, tags, currentFolder,
        isEditorFocused, saveStatus, isTyping, isThoughtSettled,
        showGrowthAnim, ghostTitle, showHelper, showTags,
        suggestedTags, activeHint, isAnalyzing,
        activeOverlay, currentQuestion,
        isReflecting, learning, reflectionPrompt,
        entries,
        setTitle, setContent, setSelectedMood, setTags,
        setIsEditorFocused, setShowTags,
        setActiveHint, setActiveOverlay, setCurrentQuestion,
        setLearning,
        loadEntryData, resetEditor, saveEntry,
        handleAutoTag, handleFinishReflection
    } = useJournal();

    const [previewMood, setPreviewMood] = useState(null);
    const typingTimeoutRef = useRef(null);

    // Deep Dive Questions
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

    // Navigation: prev/next within current folder
    const currentContextEntries = entries
        .filter(e => e.folder === currentFolder)
        .sort((a, b) => b.id - a.id);

    const currentIndex = id ? currentContextEntries.findIndex(e => e.id === id) : -1;
    const prevEntry = currentIndex !== -1 && currentIndex < currentContextEntries.length - 1 ? currentContextEntries[currentIndex + 1] : null;
    const nextEntry = currentIndex !== -1 && currentIndex > 0 ? currentContextEntries[currentIndex - 1] : null;

    const handleAutoTitle = () => {
        if (!content) return;
        const words = content.split(' ').slice(0, 5).join(' ');
        setTitle(words + '...');
    };

    const handleTitleKeyDown = (e) => {
        if (e.key === 'Tab' && ghostTitle) {
            e.preventDefault();
            setTitle(ghostTitle);
        }
    };

    return (
        <main className={`editor-main ${isTyping || isEditorFocused ? 'zen-mode' : ''} ${isEditorFocused ? 'focus-mode' : ''} ${isThoughtSettled ? 'thought-settled' : ''}`}
            style={{
                flex: 1, margin: '0 20px', display: 'flex', flexDirection: 'column', height: '100%', minWidth: '400px',
                overflowY: 'auto'
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
                        <button onClick={(e) => onDelete(e, id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--nothing-red)', opacity: 0.6 }} title="Delete Entry">
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
        </main>
    );
};

export default EditorPanel;
