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
        <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200/60 backdrop-blur-xl">
            {/* Search Header */}
            <div className="p-4 border-b border-white/50 bg-white/40 sticky top-0 z-10 backdrop-blur-md shadow-sm">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                    <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={selectedDate ? `Filter: ${selectedDate}` : "Search entries..."}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm group-hover:shadow-md"
                    />
                    {selectedDate && (
                        <button
                            onClick={() => setSelectedDate(null)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full hover:bg-red-200 transition-colors"
                        >
                            Clear Date
                        </button>
                    )}
                </div>
            </div>

            {/* Folders List */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-hide space-y-2">
                <AnimatePresence>
                    {folders.map(folder => {
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
                                className="overflow-hidden rounded-xl"
                            >
                                {/* Folder Header */}
                                <motion.button
                                    onClick={() => toggleFolder(folder)}
                                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.6)' }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`
                                w-full flex items-center justify-between p-3 rounded-lg transition-colors
                                ${isExpanded ? 'bg-white shadow-sm ring-1 ring-black/5' : 'hover:bg-white/50 text-slate-600'}
                            `}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className={`p-1.5 rounded-md ${isExpanded ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                            <Folder size={14} fill={isExpanded ? "currentColor" : "none"} />
                                        </span>
                                        <span className={`text-sm font-medium ${isExpanded ? 'text-slate-800' : 'text-slate-600'}`}>
                                            {folder}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 rounded">
                                            {folderEntries.length}
                                        </span>
                                        <ChevronRight
                                            size={14}
                                            className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
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
                                            <div className="pl-3 pr-1 pb-2 pt-1 border-l-2 border-slate-100 ml-4 mt-1 space-y-1">
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
                    <div className="p-8 text-center text-slate-400">
                        <Hash className="mx-auto mb-2 opacity-20" size={48} />
                        <p className="text-sm">No results found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
