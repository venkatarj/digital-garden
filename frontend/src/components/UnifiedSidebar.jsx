import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Calendar as CalIcon, BarChart2, Folder, Plus, Search,
    Download, LogOut, Moon, Sun, Palette, ChevronLeft, ChevronRight, Lock,
    ChevronDown, FileText, Clock, Trash2, Cloud
} from 'lucide-react';
import { useUI } from '../context/UIContext';
import { useTheme } from '../context/ThemeContext';

const UnifiedSidebar = ({
    folders,
    entries,
    onEntryClick,
    onDeleteEntry,
    onAddFolder,
    onDeleteFolder,
    onExportData,
    onLogout,
    isDarkMode,
    toggleDarkMode
}) => {
    const ui = useUI(); // Use centralized UI state
    const [isAddingFolder, setIsAddingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const { accent, setAccent, themes } = useTheme();
    const [showPalette, setShowPalette] = useState(false);
    const [hoveredFolder, setHoveredFolder] = useState(null);

    const handleAddFolder = () => {
        if (newFolderName.trim()) {
            onAddFolder(newFolderName.trim());
            setNewFolderName('');
            setIsAddingFolder(false);
        }
    };

    const handleHomeClick = () => {
        ui.resetToHome();
        onEntryClick(null); // Clear selected entry in parent
    };

    const navItems = [
        { id: 'journal', label: 'Journal', icon: BookOpen },
        { id: 'calendar', label: 'Calendar', icon: CalIcon },
        { id: 'insights', label: 'Insights', icon: BarChart2 }
    ];

    // Filter entries based on search
    const filteredEntries = entries
        .filter(e => {
            const matchesSearch = ui.searchTerm
                ? e.title?.toLowerCase().includes(ui.searchTerm.toLowerCase()) ||
                e.content?.toLowerCase().includes(ui.searchTerm.toLowerCase())
                : true;
            return matchesSearch;
        })
        .sort((a, b) => b.id - a.id);

    if (ui.isLeftSidebarCollapsed) {
        return (
            <aside className="unified-sidebar-collapsed" style={{
                width: '60px',
                background: 'var(--bg-secondary)',
                borderRight: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '20px 10px',
                gap: '20px'
            }}>
                {/* Expand button */}
                <button
                    onClick={() => ui.setIsLeftSidebarCollapsed(false)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--muted-text)',
                        padding: '8px'
                    }}
                >
                    <ChevronRight size={20} />
                </button>

                {/* Icon-only navigation */}
                {navItems.map(item => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => ui.setView(item.id)}
                            title={item.label}
                            style={{
                                background: ui.view === item.id ? 'var(--accent-primary)' : 'transparent',
                                color: ui.view === item.id ? 'white' : 'var(--muted-text)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '10px',
                                cursor: 'pointer',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Icon size={20} />
                        </button>
                    );
                })}

                {/* Bottom icons */}
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button onClick={toggleDarkMode} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted-text)' }}>
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <button onClick={onLogout} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted-text)' }}>
                        <LogOut size={20} />
                    </button>
                </div>
            </aside>
        );
    }

    return (
        <aside className="unified-sidebar" style={{
            width: '280px',
            background: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            overflow: 'hidden'
        }}>
            {/* Header: Branding + Collapse */}
            <div style={{
                padding: '12px 20px', // Reduced vertical padding
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div
                    onClick={handleHomeClick}
                    style={{
                        position: 'relative',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px'
                    }}
                    title="Go Home"
                >
                    {/* Main Cloud Shape */}
                    <Cloud
                        size={64} // Slightly smaller height
                        strokeWidth={2}
                        style={{
                            color: 'var(--accent-primary)',
                            fill: 'var(--bg-primary)',
                            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))',
                            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }}
                    />

                    {/* Text Inside */}
                    <span style={{
                        position: 'absolute',
                        top: '57%', // Adjusted for 64px
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '14px', // Adjusted for fit
                        fontWeight: '800',
                        color: 'var(--accent-primary)',
                        letterSpacing: '-0.5px',
                        pointerEvents: 'none',
                        zIndex: 10,
                        textShadow: '0 2px 0 var(--bg-primary)'
                    }}>
                        delulu
                    </span>

                    {/* Floating Pixels (Decorative) - Adjusted positions */}
                    <motion.div
                        animate={{ y: [0, -3, 0], opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        style={{
                            position: 'absolute',
                            top: '10px',
                            left: '6px',
                            width: '5px',
                            height: '5px',
                            background: 'var(--accent-primary)',
                            borderRadius: '1px',
                            boxShadow: '0 0 4px var(--accent-primary)'
                        }}
                    />
                    <motion.div
                        animate={{ y: [0, 2, 0], opacity: [0.4, 0.8, 0.4] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            left: '0px',
                            width: '4px',
                            height: '4px',
                            background: 'var(--accent-primary)',
                            borderRadius: '1px'
                        }}
                    />
                </div>
                <button
                    onClick={() => ui.setIsLeftSidebarCollapsed(true)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--muted-text)',
                        padding: '4px'
                    }}
                >
                    <ChevronLeft size={20} />
                </button>
            </div>

            {/* Search Bar */}
            <div style={{ padding: '16px' }}>
                <div style={{ position: 'relative' }}>
                    <Search
                        size={16}
                        style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--muted-text)'
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Search entries..."
                        value={ui.searchTerm}
                        onChange={(e) => ui.setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px 8px 36px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            background: 'var(--bg-primary)',
                            color: 'var(--contrast-text)',
                            fontSize: '14px',
                            outline: 'none'
                        }}
                    />
                    <kbd style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '11px',
                        color: 'var(--muted-text)',
                        background: 'var(--bg-secondary)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-color)'
                    }}>⌘K</kbd>
                </div>
            </div>

            {/* Navigation */}
            <div style={{ padding: '0 16px', marginBottom: '20px' }}>
                {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = ui.view === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => ui.setView(item.id)}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 12px',
                                marginBottom: '4px',
                                background: isActive ? 'var(--accent-primary)' : 'transparent',
                                color: isActive ? 'white' : 'var(--contrast-text)',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Icon size={18} />
                            {item.label}
                        </button>
                    );
                })}
            </div>

            {/* Folders Section with Expandable Entries (only show in journal view) */}
            {ui.view === 'journal' && (
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '0 16px'
                }}>
                    <div style={{
                        marginBottom: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'var(--muted-text)',
                        textTransform: 'uppercase'
                    }}>
                        Folders
                    </div>

                    {/* Render each folder with expandable entries */}
                    {folders.map(folder => {
                        const folderEntries = entries
                            .filter(e => e.folder === folder)
                            .filter(e => !ui.searchTerm ||
                                e.title?.toLowerCase().includes(ui.searchTerm.toLowerCase()) ||
                                e.content?.toLowerCase().includes(ui.searchTerm.toLowerCase())
                            )
                            .sort((a, b) => b.id - a.id);
                        const isExpanded = ui.expandedFolders.includes(folder);

                        return (
                            <div key={folder} style={{ marginBottom: '8px' }}>
                                {/* Folder Header */}
                                <div
                                    onClick={() => {
                                        ui.setActiveFolder(folder);
                                        onEntryClick(null);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '8px 12px',
                                        background: ui.activeFolder === folder ? 'var(--bg-primary)' : 'transparent',
                                        color: ui.activeFolder === folder ? 'var(--contrast-text)' : 'var(--muted-text)',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span
                                            onClick={(e) => { e.stopPropagation(); ui.toggleFolder(folder); }}
                                            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '2px' }}
                                        >
                                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        </span>
                                        <div
                                            onMouseEnter={() => setHoveredFolder(folder)}
                                            onMouseLeave={() => setHoveredFolder(null)}
                                            style={{ position: 'relative', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', margin: '-6px' }} // Tightened hit area
                                        >
                                            <AnimatePresence mode="wait">
                                                {hoveredFolder === folder ? (
                                                    <motion.div
                                                        key="delete"
                                                        initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                                                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                                        exit={{ opacity: 0, scale: 0.5, rotate: 20 }}
                                                        transition={{ duration: 0.2 }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDeleteFolder(folder);
                                                        }}
                                                        style={{ cursor: 'pointer', color: '#ef4444' }}
                                                        title="Delete Folder"
                                                    >
                                                        <Trash2 size={14} />
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        key="folder"
                                                        initial={{ opacity: 0, scale: 0.5 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.5 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        <Folder size={14} />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <span>{folder}</span>
                                        <span style={{ fontSize: '11px', opacity: 0.5 }}>({folderEntries.length})</span>
                                    </div>
                                </div>

                                {/* Nested Entries */}
                                <AnimatePresence>
                                    {isExpanded && folderEntries.length > 0 && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            style={{ overflow: 'hidden' }}
                                        >
                                            <div style={{ paddingLeft: '20px', paddingTop: '4px' }}>
                                                {folderEntries.map(entry => (
                                                    <div
                                                        key={entry.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onEntryClick(entry);
                                                            ui.setActiveFolder(folder);
                                                        }}
                                                        style={{
                                                            padding: '6px 12px',
                                                            marginBottom: '2px',
                                                            cursor: 'pointer',
                                                            background: ui.selectedEntryId === entry.id ? 'var(--bg-primary)' : 'transparent',
                                                            borderRadius: '4px',
                                                            fontSize: '13px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            transition: 'background 0.2s'
                                                        }}
                                                        onMouseOver={(e) => {
                                                            if (ui.selectedEntryId !== entry.id) {
                                                                e.currentTarget.style.background = 'var(--bg-primary)';
                                                                e.currentTarget.style.opacity = '0.6';
                                                            }
                                                        }}
                                                        onMouseOut={(e) => {
                                                            if (ui.selectedEntryId !== entry.id) {
                                                                e.currentTarget.style.background = 'transparent';
                                                                e.currentTarget.style.opacity = '1';
                                                            }
                                                        }}
                                                    >
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{
                                                                fontWeight: '500',
                                                                color: 'var(--contrast-text)',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}>
                                                                <FileText size={12} style={{ marginRight: '6px', display: 'inline' }} />
                                                                {entry.title || 'Untitled'}
                                                            </div>
                                                            <div style={{
                                                                fontSize: '11px',
                                                                opacity: 0.6,
                                                                color: 'var(--muted-text)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                marginTop: '2px'
                                                            }}>
                                                                <Clock size={10} />
                                                                {entry.created_at ? new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Just now'}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDeleteEntry(e, entry.id);
                                                            }}
                                                            style={{
                                                                background: 'transparent',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                color: 'var(--nothing-red)',
                                                                opacity: 0.5,
                                                                padding: '4px',
                                                                display: 'flex',
                                                                alignItems: 'center'
                                                            }}
                                                            onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                                                            onMouseOut={(e) => e.currentTarget.style.opacity = '0.5'}
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}

                    {/* Add New Folder Button */}
                    {isAddingFolder ? (
                        <input
                            autoFocus
                            placeholder="Folder name..."
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()}
                            onBlur={() => setIsAddingFolder(false)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                marginTop: '8px',
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                color: 'var(--contrast-text)',
                                fontSize: '13px',
                                outline: 'none'
                            }}
                        />
                    ) : (
                        <button
                            onClick={() => setIsAddingFolder(true)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                marginTop: '8px',
                                background: 'transparent',
                                border: '1px dashed var(--border-color)',
                                borderRadius: '6px',
                                color: 'var(--muted-text)',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px'
                            }}
                        >
                            <Plus size={14} /> New Folder
                        </button>
                    )}
                </div>
            )}

            {/* Bottom Actions */}
            <div style={{
                marginTop: 'auto',
                padding: '16px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                <button
                    onClick={onExportData}
                    style={{
                        width: '100%',
                        padding: '8px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--muted-text)',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderRadius: '6px'
                    }}
                >
                    <Download size={16} /> Export Data
                </button>
                <button
                    onClick={onLogout}
                    style={{
                        width: '100%',
                        padding: '8px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--muted-text)',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderRadius: '6px'
                    }}
                >
                    <LogOut size={16} /> Logout
                </button>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                        onClick={toggleDarkMode}
                        style={{
                            flex: 1,
                            padding: '8px',
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: 'var(--contrast-text)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                    </button>

                    <div style={{ position: 'relative', flex: 1 }}>
                        <AnimatePresence>
                            {showPalette && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    style={{
                                        position: 'absolute',
                                        bottom: '130%',
                                        left: '50%',
                                        marginLeft: '-64px', // Shift left by 64px to align with Sidebar Center (280px width)
                                        transform: 'translateX(-50%)',
                                        marginBottom: '0',
                                        background: 'var(--glass-bg)',
                                        backdropFilter: 'blur(16px)',
                                        border: '1px solid var(--glass-border)',
                                        padding: '12px 16px',
                                        borderRadius: '20px',
                                        boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.2), 0 8px 16px -4px rgba(0,0,0,0.1)',
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(4, 1fr)',
                                        placeItems: 'center',
                                        gap: '12px',
                                        zIndex: 100
                                    }}
                                >
                                    {Object.entries(themes).map(([key, theme]) => (
                                        <button
                                            key={key}
                                            onClick={() => { setAccent(key); setShowPalette(false); }}
                                            title={theme.label}
                                            style={{
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: '50%',
                                                background: theme.color,
                                                border: '2px solid white',
                                                boxShadow: accent === key
                                                    ? '0 0 0 2px var(--contrast-text), 0 4px 12px rgba(0,0,0,0.2)'
                                                    : '0 2px 4px rgba(0,0,0,0.1)',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                                transform: accent === key ? 'scale(1.1)' : 'scale(1)'
                                            }}
                                            onMouseOver={(e) => {
                                                if (accent !== key) e.currentTarget.style.transform = 'scale(1.2) translateY(-2px)';
                                            }}
                                            onMouseOut={(e) => {
                                                if (accent !== key) e.currentTarget.style.transform = 'scale(1)';
                                            }}
                                        />
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <button
                            onClick={() => setShowPalette(!showPalette)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                color: 'var(--contrast-text)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative'
                            }}
                        >
                            <Palette size={16} style={{ color: themes[accent]?.color }} />
                        </button>
                    </div>
                </div>
            </div>
        </aside >
    );
};

export default UnifiedSidebar;
