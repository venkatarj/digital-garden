import React, { useState, useEffect } from 'react';
import { analyzeEntry } from '../../ai/SemanticEngine';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import ToastNotification from './components/ToastNotification';
import AdaptiveRightPanel from './components/AdaptiveRightPanel';
import EditorPanel from './components/EditorPanel';
import { JournalProvider, useJournal } from './context/JournalContext';

// Main wrapper component with Context Provider
const JournalView = ({ entries, folders, selectedEntry, activeFolder, isPrivate, setIsPrivate, onRefresh, onDelete, setAppBackground }) => {
    return (
        <JournalProvider
            entries={entries}
            folders={folders}
            onRefresh={onRefresh}
            initialEntry={selectedEntry}
            initialFolder={selectedEntry?.folder || activeFolder}
        >
            <JournalViewContent
                isPrivate={isPrivate}
                setIsPrivate={setIsPrivate}
                onDelete={onDelete}
                setAppBackground={setAppBackground}
            />
        </JournalProvider>
    );
};

// Content component (to be refactored in later phases)
const JournalViewContent = ({ isPrivate, setIsPrivate, onDelete, setAppBackground }) => {
    // Access context
    const journal = useJournal();

    // Destructure what we need from context
    const {
        selectedMood,
        entries,
        isFullscreen
    } = journal;

    const moodThemes = {
        '😄': '#FEFCE8', '🙂': '#F0FAF0', '😐': '#F5F7F5', '😞': '#F0F7FE', '😡': '#FEF2F2',
    };

    // Sync background color to parent
    useEffect(() => {
        setAppBackground(moodThemes[selectedMood] || '#F5F7F5');
    }, [selectedMood, setAppBackground]);

    // --- RENDER ---
    return (
        <div className={`journal-layout ${isFullscreen ? 'fullscreen-mode' : ''}`}
            style={{
                '--mood-bg': moodThemes[selectedMood] || '#F5F7F5'
            }}>

            {/* --- EDITOR MAIN --- */}
            <main className="editor-main">
                <EditorPanel
                    isPrivate={isPrivate}
                    setIsPrivate={setIsPrivate}
                    onDelete={onDelete}
                />
            </main>

            {/* --- RIGHT: ADAPTIVE PANEL (Hidden in fullscreen) --- */}
            {!isFullscreen && (
                <aside className="adaptive-panel">
                    <AdaptiveRightPanel />
                </aside>
            )}
        </div>
    );
};

export default JournalView;
