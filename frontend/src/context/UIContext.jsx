import React, { createContext, useContext, useState, useCallback } from 'react';

const UIContext = createContext(null);

export const UIProvider = ({ children }) => {
    // === SINGLE SOURCE OF TRUTH ===

    // Main view mode (mutually exclusive)
    const [view, setView] = useState('journal'); // 'journal' | 'calendar' | 'insights'

    // Journal-specific state
    const [activeFolder, setActiveFolder] = useState('Journal');
    const [expandedFolders, setExpandedFolders] = useState(['Journal']);
    const [selectedEntryId, setSelectedEntryId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Panel state
    const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
    const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // === CONTROLLED ACTIONS ===

    const selectEntry = useCallback((entryId) => {
        setSelectedEntryId(entryId);
        // Auto-expand folder if entry belongs to collapsed folder
        // (This will be handled by the caller passing the folder name)
    }, []);

    const toggleFolder = useCallback((folderName) => {
        setExpandedFolders(prev =>
            prev.includes(folderName)
                ? prev.filter(f => f !== folderName)
                : [...prev, folderName]
        );
    }, []);

    const resetToHome = useCallback(() => {
        setView('journal');
        setActiveFolder('Journal');
        setSelectedEntryId(null);
        setSearchTerm('');
        setIsFullscreen(false);
        // Keep sidebar states as-is (don't reset collapse states)
    }, []);

    const switchView = useCallback((newView) => {
        setView(newView);
        if (newView !== 'journal') {
            setSelectedEntryId(null);
        }
    }, []);

    const selectFolder = useCallback((folderName) => {
        setActiveFolder(folderName);
        setView('journal');
        // Auto-expand the selected folder
        if (!expandedFolders.includes(folderName)) {
            setExpandedFolders(prev => [...prev, folderName]);
        }
    }, [expandedFolders]);

    const value = {
        // State
        view,
        activeFolder,
        expandedFolders,
        selectedEntryId,
        searchTerm,
        isLeftSidebarCollapsed,
        isRightPanelCollapsed,
        isFullscreen,

        // Actions
        setView: switchView,
        setActiveFolder: selectFolder,
        setExpandedFolders,
        setSelectedEntryId: selectEntry,
        setSearchTerm,
        setIsLeftSidebarCollapsed,
        setIsRightPanelCollapsed,
        setIsFullscreen,
        toggleFolder,
        resetToHome
    };

    return (
        <UIContext.Provider value={value}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within UIProvider');
    }
    return context;
};
