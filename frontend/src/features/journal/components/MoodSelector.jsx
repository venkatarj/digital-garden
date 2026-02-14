import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Sun, Meh, Moon, Frown } from 'lucide-react';

const MoodButton = ({ mood, icon: Icon, color, selected, onClick, label }) => (
    <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`
      relative group p-4 rounded-2xl transition-all duration-300
      ${selected
                ? `bg-gradient-to-br ${color} shadow-lg ring-2 ring-offset-2 ring-offset-white ring-${color.split(' ')[1].replace('to-', '')}`
                : 'bg-white/40 hover:bg-white/60 backdrop-blur-sm border border-white/20'
            }
    `}
    >
        <div className="relative z-10">
            <Icon
                size={24}
                className={`transition-colors duration-300 ${selected ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`}
                strokeWidth={selected ? 2.5 : 2}
            />
        </div>

        {/* Ripple effect on click (simulated/framer) */}
        <AnimatePresence>
            {selected && (
                <motion.div
                    className="absolute inset-0 rounded-2xl bg-white/20"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                />
            )}
        </AnimatePresence>

        {/* Tooltip */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 
                    px-3 py-1 bg-gray-900 text-white text-xs rounded-lg
                    opacity-0 group-hover:opacity-100 transition-opacity duration-200
                    pointer-events-none whitespace-nowrap shadow-xl z-20">
            {label}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
    </motion.button>
);

const MoodSelector = ({ selectedMood, onSelectMood, onPreview }) => {
    const moods = [
        { icon: Smile, value: '😄', label: 'Happy', color: 'from-amber-400 to-orange-500' }, // increased contrast
        { icon: Sun, value: '🙂', label: 'Good', color: 'from-yellow-300 to-amber-400' },
        { icon: Meh, value: '😐', label: 'Neutral', color: 'from-gray-300 to-gray-400' },
        { icon: Moon, value: '😞', label: 'Sad', color: 'from-blue-300 to-blue-400' },
        { icon: Frown, value: '😡', label: 'Angry', color: 'from-red-400 to-rose-500' },
    ];

    return (
        <div className="flex justify-center gap-4 py-6">
            <div className="flex gap-3 p-2 bg-white/30 backdrop-blur-md rounded-3xl border border-white/40 shadow-sm">
                {moods.map((m) => (
                    <div
                        key={m.value}
                        onMouseEnter={() => onPreview && onPreview(m.value)}
                        onMouseLeave={() => onPreview && onPreview(null)}
                    >
                        <MoodButton
                            mood={m.value}
                            icon={m.icon}
                            color={m.color}
                            label={m.label}
                            selected={selectedMood === m.value}
                            onClick={() => {
                                onSelectMood(m.value);
                                if (onPreview) onPreview(null);
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MoodSelector;
