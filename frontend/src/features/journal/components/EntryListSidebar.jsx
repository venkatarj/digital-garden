import React, { useState } from 'react';
import { useJournal } from '../context/JournalContext';
import Sidebar from './Sidebar';

const EntryListSidebar = () => {
    const {
        entries,
        folders,
        expandedFolders,
        toggleFolder,
        selectedDate,
        setSelectedDate,
        id: selectedEntryId,
        loadEntryData,
    } = useJournal();

    const [searchTerm, setSearchTerm] = useState('');

    // Handle delete through a local handler that shows confirmation
    const handleDeleteEntry = (e, entryId) => {
        // This will be handled by the parent's delete modal
        // For now, just prevent default behavior
        e.stopPropagation();
        // The actual delete is handled in JournalViewContent through handleDelete
    };

    return (
        <Sidebar
            entries={entries}
            folders={folders}
            expandedFolders={expandedFolders}
            toggleFolder={toggleFolder}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedEntryId={selectedEntryId}
            onEntryClick={loadEntryData}
            onDeleteEntry={handleDeleteEntry}
        />
    );
};

export default EntryListSidebar;
