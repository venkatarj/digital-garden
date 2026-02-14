import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Settings, Plus } from 'lucide-react';

const QuickCheckIn = ({ onAddEntry, isManagingHabits, onToggleManage }) => {
    const [text, setText] = useState('');
    const charLimit = 280; // Twitter style short thought

    const handleSubmit = () => {
        if (!text.trim()) return;
        onAddEntry(text);
        setText('');
    };

    const progress = (text.length / charLimit) * 100;
    const isOverLimit = text.length > charLimit;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl glass-card relative overflow-hidden group"
        >
            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={onToggleManage}
                    className="p-1.5 rounded-full hover:bg-slate-100/50 text-slate-400 transition-colors"
                >
                    <Settings size={14} />
                </button>
            </div>

            <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                    <Zap size={16} fill="currentColor" />
                </div>
                <h3 className="font-display font-semibold text-slate-700 text-sm">Quick Check-in</h3>
            </div>

            <div className="relative">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="What's on your mind right now?"
                    rows={3}
                    className="w-full px-4 py-3 bg-white/50 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 resize-none transition-all placeholder:text-slate-400 text-slate-700"
                />

                {/* Progress Ring */}
                <div className="absolute bottom-3 right-3 w-5 h-5">
                    <svg className="transform -rotate-90 w-full h-full">
                        <circle cx="10" cy="10" r="8" stroke="#e2e8f0" strokeWidth="2" fill="transparent" />
                        <circle
                            cx="10" cy="10" r="8"
                            stroke={isOverLimit ? '#ef4444' : '#3b82f6'}
                            strokeWidth="2"
                            fill="transparent"
                            strokeDasharray={50} // 2*pi*8 ≈ 50
                            strokeDashoffset={50 - (50 * Math.min(progress, 100) / 100)}
                            className="transition-all duration-300"
                        />
                    </svg>
                </div>
            </div>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!text.trim() || isOverLimit}
                className={`
            mt-3 w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2
            transition-all duration-200 shadow-lg shadow-blue-500/20
            ${!text.trim()
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-blue-500/30'
                    }
        `}
            >
                <Plus size={16} /> Add Thought
            </motion.button>
        </motion.div>
    );
};

export default QuickCheckIn;
