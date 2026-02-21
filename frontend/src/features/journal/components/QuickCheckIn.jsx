import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Eraser, Smile } from 'lucide-react';

const QuickCheckIn = () => {
    const [text, setText] = useState(() => {
        return localStorage.getItem('scratchpad_content') || '';
    });
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    useEffect(() => {
        localStorage.setItem('scratchpad_content', text);
    }, [text]);

    const handleClear = () => {
        setText('');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-50 border border-slate-200 rounded-[32px] p-6 shadow-sm relative overflow-hidden group"
        >
            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={handleClear}
                    className="p-1.5 rounded-full hover:bg-slate-100/50 text-slate-400 hover:text-red-500 transition-colors"
                    title="Instant Clear"
                >
                    <Eraser size={14} />
                </button>
            </div>

            <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] rounded-lg">
                    <Zap size={16} fill="currentColor" />
                </div>
                <h3 className="font-display font-semibold text-slate-700 text-sm">Scratchpad</h3>
            </div>

            <div className="relative">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type your thoughts here... they will stay here."
                    rows={6}
                    className="w-full px-4 py-3 bg-white/50 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 resize-none transition-all placeholder:text-slate-400 text-slate-700"
                    style={{ minHeight: '120px' }}
                />
                <div className="absolute bottom-2 right-3 flex items-center gap-2">
                    <div className="relative">
                        <button
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-[hsl(var(--primary))] transition-all active:scale-95"
                            title="Add Emoji"
                        >
                            <Smile size={14} />
                        </button>

                        <AnimatePresence>
                            {showEmojiPicker && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                    className="absolute bottom-full right-0 mb-2 p-3 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl z-50 w-[210px]"
                                >
                                    <div className="grid grid-cols-6 gap-1">
                                        {['❤️', '✨', '🔥', '✅', '🚀', '⭐', '💡', '📅', '📝', '💭', '🌈', '🍀', '🎯', '📍', '📌', '⏰', '🎉', '🎈', '🎨', '🎬', '🎧', '📷', '🌍', '🏠'].map(emoji => (
                                            <button
                                                key={emoji}
                                                onClick={() => {
                                                    setText(prev => prev + emoji);
                                                    setShowEmojiPicker(false);
                                                }}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100/80 transition-colors text-base"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default QuickCheckIn;
