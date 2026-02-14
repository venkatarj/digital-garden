import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2 } from 'lucide-react';

const getMoodGradient = (mood) => {
    const map = {
        '😄': 'from-amber-400 to-orange-500',
        '🙂': 'from-green-400 to-emerald-500',
        '😐': 'from-gray-300 to-gray-400',
        '😞': 'from-blue-300 to-cyan-400',
        '😡': 'from-red-400 to-rose-500',
    };
    return map[mood] || 'from-gray-200 to-gray-300';
}

const EntryList = ({ entries, onSelect, onDelete, selectedId }) => {
    return (
        <AnimatePresence mode="popLayout">
            {entries.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-4 text-center text-gray-400 text-sm italic"
                >
                    No entries found
                </motion.div>
            )}

            {entries.map((entry, i) => {
                const isSelected = selectedId === entry.id;

                return (
                    <motion.div
                        key={entry.id}
                        layout // Smooth layout changes when items are removed/added
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: i * 0.05, duration: 0.2 }}
                        onClick={() => onSelect(entry)}
                        className={`
                            group relative mb-2 rounded-xl p-3 cursor-pointer
                            border transition-all duration-200 overflow-hidden
                            ${isSelected
                                ? 'bg-white shadow-md border-orange-100 ring-1 ring-orange-200'
                                : 'hover:bg-white/60 hover:shadow-sm border-transparent hover:border-gray-100'
                            }
                        `}
                    >
                        {/* Interactive Mood Strip */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-all
                                        ${isSelected ? 'opacity-100 w-1.5' : 'opacity-60 group-hover:opacity-100 group-hover:w-1.5'}
                                        bg-gradient-to-b ${getMoodGradient(entry.mood)}`}
                        />

                        <div className="pl-3 flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                                <h3 className={`font-medium text-sm truncate pr-2 transition-colors
                                              ${isSelected ? 'text-gray-900' : 'text-gray-600 group-hover:text-gray-900'}
                                `}>
                                    {entry.title || 'Untitled'}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-400 font-mono">
                                        {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                    {entry.content.includes('[Tags:') && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400/50" />
                                    )}
                                </div>
                            </div>

                            {/* Hover Actions */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 transform translate-x-2 group-hover:translate-x-0 duration-200">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(e, entry.id); }}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </AnimatePresence>
    );
};

export default EntryList;
