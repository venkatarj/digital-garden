import React, { useState, useEffect } from 'react';
import { analyzeEntry } from '../../ai/SemanticEngine';
import Sidebar from './components/Sidebar';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import ToastNotification from './components/ToastNotification';
import AdaptiveRightPanel from './components/AdaptiveRightPanel';
import EditorPanel from './components/EditorPanel';
import { JournalProvider, useJournal } from './context/JournalContext';

// Main wrapper component with Context Provider
const JournalView = ({ entries, folders, entryToEdit, activeFolder: initialActiveFolder, isPrivate, setIsPrivate, onRefresh, setAppBackground }) => {
    return (
        <JournalProvider
            entries={entries}
            folders={folders}
            onRefresh={onRefresh}
            initialEntry={entryToEdit}
            initialFolder={initialActiveFolder}
        >
            <JournalViewContent
                isPrivate={isPrivate}
                setIsPrivate={setIsPrivate}
                setAppBackground={setAppBackground}
            />
        </JournalProvider>
    );
};

// Content component (to be refactored in later phases)
const JournalViewContent = ({ isPrivate, setIsPrivate, setAppBackground }) => {
    // Access context
    const journal = useJournal();

    // Destructure what we need from context
    const {
        id, selectedMood,
        expandedFolders, selectedDate,
        entries, folders,
        setSelectedDate,
        loadEntryData, deleteEntry,
        toggleFolder
    } = journal;

    // Local UI state
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, entryId: null, entryTitle: '' });
    const [isDeleting, setIsDeleting] = useState(false);
    const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success', id: 0 });
    const [optimisticDeletedIds, setOptimisticDeletedIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const moodThemes = {
        '😄': '#FFF9C4', '🙂': '#DCEDC8', '😐': '#F5F7F5', '😞': '#E1F5FE', '😡': '#FFEBEE',
    };

    // Sync background color to parent
    useEffect(() => {
        setAppBackground(moodThemes[selectedMood] || '#F5F7F5');
    }, [selectedMood, setAppBackground]);

    // Local delete modal handlers (uses local deleteModal state)
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
        setOptimisticDeletedIds(prev => [...prev, idToDelete]);

        try {
            await deleteEntry(idToDelete); // Use context function
            setToast({ isVisible: true, message: 'Entry deleted successfully', type: 'success', id: Date.now() });
        } catch (e) {
            console.error(e);
            setOptimisticDeletedIds(prev => prev.filter(pid => pid !== idToDelete));
            setToast({ isVisible: true, message: 'Failed to delete entry', type: 'error', id: Date.now() });
        } finally {
            setIsDeleting(false);
            setDeleteModal({ isOpen: false, entryId: null, entryTitle: '' });
        }
    };

    // --- RENDER ---
    return (
        <div className="journal-layout"
            style={{
                '--mood-bg': moodThemes[selectedMood] || '#F5F7F5'
            }}>

            {/* --- LEFT: ENTRY LIST SIDEBAR --- */}
            <aside className="entry-sidebar">
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
            </aside>

            {/* --- CENTER: EDITOR --- */}
            <EditorPanel
                isPrivate={isPrivate}
                setIsPrivate={setIsPrivate}
                onDelete={handleDelete}
            />

            {/* --- RIGHT: ADAPTIVE PANEL --- */}
            <aside className="adaptive-panel">
                <AdaptiveRightPanel optimisticDeletedIds={optimisticDeletedIds} />
            </aside>

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
