import React from 'react';
import AdaptiveRightPanel from './components/AdaptiveRightPanel';
import EditorPanel from './components/EditorPanel';
import ToastNotification from './components/ToastNotification';
import { JournalProvider, useJournal } from './context/JournalContext';

// Main wrapper component with Context Provider
const JournalView = ({ entries, folders, selectedEntry, activeFolder, isPrivate, setIsPrivate, onRefresh, onDelete }) => {
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
            />
        </JournalProvider>
    );
};

// Content component
const JournalViewContent = ({ isPrivate, setIsPrivate, onDelete }) => {
    const { selectedMood, isFullscreen, newNoteToast, setNewNoteToast, handleUndoNewNote } = useJournal();

    const moodThemes = {
        '😄': '#FEFCE8', '🙂': '#F0FAF0', '😐': '#F5F7F5', '😞': '#F0F7FE', '😡': '#FEF2F2',
    };

    // --- RENDER ---
    return (
        <div className={`journal-layout ${isFullscreen ? 'fullscreen-mode' : ''}`}
            style={{
                '--mood-bg': moodThemes[selectedMood] || '#F5F7F5'
            }}>

            {/* --- EDITOR MAIN --- */}
            <EditorPanel
                isPrivate={isPrivate}
                setIsPrivate={setIsPrivate}
                onDelete={onDelete}
            />

            {/* New Note Undo Toast */}
            <ToastNotification
                isVisible={newNoteToast.isVisible}
                message="Note saved"
                type="success"
                onUndo={newNoteToast.previousEntry?.id ? handleUndoNewNote : null}
                onClose={() => setNewNoteToast(prev => ({ ...prev, isVisible: false }))}
            />

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
