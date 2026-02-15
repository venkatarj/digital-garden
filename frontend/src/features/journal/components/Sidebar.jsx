import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Folder, ChevronDown, ChevronRight, Hash } from 'lucide-react';
import EntryList from './EntryList';

const Sidebar = ({
    folders,
    expandedFolders,
    toggleFolder,
    entries,
    searchTerm,
    setSearchTerm,
    selectedDate,
    setSelectedDate,
    selectedEntryId,
    onEntryClick,
    onDeleteEntry
}) => {
    return (
        <div className="flex flex-col h-full bg-[var(--bg-secondary)] border-r border-[var(--border-color)] backdrop-blur-xl transition-colors duration-300">
            {/* Search Header */}
            <div className="p-4 border-b border-[var(--border-color)] bg-[var(--glass-bg)] sticky top-0 z-10 backdrop-blur-md shadow-sm">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-text)] group-focus-within:text-[var(--accent-primary)] transition-colors" size={16} />
                    <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={selectedDate ? `Filter: ${selectedDate}` : "Search entries..."}
                        className="w-full pl-10 pr-12 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[var(--radius-md)] text-sm text-[var(--contrast-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] transition-all shadow-sm group-hover:shadow-[var(--card-shadow)] placeholder-[var(--muted-text)]"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1">
                        {!searchTerm && (
                            <kbd className="hidden group-hover:inline-block sm:inline-block h-5 px-1.5 pt-[1px] text-[10px] font-mono font-medium text-[var(--muted-text)] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[4px] shadow-sm">
                                ⌘K
                            </kbd>
                        )}
                        {selectedDate && (
                            <button
                                onClick={() => setSelectedDate(null)}
                                className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full hover:bg-red-200 transition-colors pointer-events-auto"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Folders List */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-hide space-y-2">
                <AnimatePresence>
                    {folders.filter(f => f !== 'Journal').map(folder => {
                        const isExpanded = expandedFolders.includes(folder);
                        const folderEntries = entries.filter(e => e.folder === folder);
                        const filteredEntries = folderEntries
                            .filter(e => {
                                const matchSearch = searchTerm ? (
                                    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    e.content.toLowerCase().includes(searchTerm.toLowerCase())
                                ) : true;
                                const matchDate = selectedDate ? e.date === selectedDate : true;
                                return matchSearch && matchDate;
                            })
                            .sort((a, b) => b.id - a.id);

                        if (searchTerm && filteredEntries.length === 0) return null; // Hide empty folders during search

                        return (
                            <motion.div
                                key={folder}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="overflow-hidden rounded-[var(--radius-lg)] mb-2"
                            >
                                {/* Folder Header */}
                                <motion.button
                                    onClick={() => toggleFolder(folder)}
                                    whileHover={{ backgroundColor: 'var(--border-color)' }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`
                                w-full flex items-center justify-between p-3 rounded-[var(--radius-md)] transition-colors sidebar-item group
                                ${isExpanded ? 'bg-[var(--bg-primary)] shadow-[var(--card-shadow)] ring-1 ring-[var(--border-color)]' : 'hover:bg-[var(--bg-primary)]/50 text-[var(--muted-text)]'}
                            `}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className={`p-1.5 rounded-[var(--radius-sm)] ${isExpanded ? 'bg-[var(--accent-secondary)] text-[var(--accent-primary)]' : 'bg-[var(--bg-primary)] text-[var(--muted-text)]'}`}>
                                            <Folder size={14} fill={isExpanded ? "currentColor" : "none"} />
                                        </span>
                                        <span className={`text-sm font-medium ${isExpanded ? 'text-[var(--contrast-text)]' : 'text-[var(--muted-text)]'}`}>
                                            {folder}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-medium text-[var(--muted-text)] bg-[var(--bg-primary)] px-2 py-0.5 rounded-full border border-[var(--border-color)] group-hover:border-[var(--accent-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                                            {folderEntries.length}
                                        </span>
                                        <ChevronRight
                                            size={14}
                                            className={`text-[var(--muted-text)] transition-all duration-200 ${isExpanded ? 'rotate-90 opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                        />
                                    </div>
                                </motion.button>

                                {/* Folder Content (Entries) */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className="pl-3 pr-1 pb-2 pt-1 border-l-2 border-[var(--border-color)] ml-4 mt-1 space-y-1">
                                                <EntryList
                                                    entries={filteredEntries}
                                                    onSelect={onEntryClick}
                                                    onDelete={onDeleteEntry}
                                                    selectedId={selectedEntryId}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {/* Empty State for Search */}
                {searchTerm && entries.length === 0 && (
                    <div className="p-8 text-center text-[var(--muted-text)]">
                        <Hash className="mx-auto mb-2 opacity-20" size={48} />
                        <p className="text-sm">No results found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
