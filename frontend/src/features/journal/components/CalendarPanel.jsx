import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CalendarDay = ({ date, hasEntry, isToday, isSelected, moodColor, onClick }) => (
    <motion.button
        whileHover={{ scale: 1.15, zIndex: 10 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`
      relative w-full aspect-square flex flex-col items-center justify-center font-mono text-xs rounded-lg
      transition-all duration-200
      ${isSelected
                ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-200 shadow-blue-500/30'
                : hasEntry
                    ? 'text-gray-800 font-medium'
                    : 'text-gray-400 opacity-60 hover:opacity-100 hover:bg-gray-100'
            }
      ${isToday && !isSelected ? 'ring-1 ring-blue-500/30 font-bold text-blue-600 bg-blue-50/50' : ''}
    `}
        style={{ backgroundColor: hasEntry && !isSelected ? moodColor : undefined }}
    >
        <span>{date}</span>

        {/* Entry Indicator Dot */}
        {(hasEntry || isToday) && !isSelected && (
            <div className={`absolute -bottom-1 w-1 h-1 rounded-full ${isToday ? 'bg-blue-500' : 'bg-gray-400/50'}`} />
        )}
    </motion.button>
);

const CalendarPanel = ({ entries, selectedDate, onDateSelect }) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthIndex = today.getMonth();

    const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonthIndex, 1).getDay(); // 0 = Sunday

    const monthName = today.toLocaleString('default', { month: 'long' }).toUpperCase();

    // Generate calendar grid
    const days = [];
    // Padding for start/end
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(currentYear, currentMonthIndex, i);
        const dateString = date.toISOString().split('T')[0];
        const dayEntries = entries.filter(e => e.date === dateString);
        const hasEntry = dayEntries.length > 0;

        // Simple mood color mapping (can be prop)
        const moodThemes = {
            '😄': '#FFF9C4', '🙂': '#DCEDC8', '😐': '#F5F7F5', '😞': '#E1F5FE', '😡': '#FFEBEE',
        };
        const mood = hasEntry ? dayEntries[dayEntries.length - 1].mood : null;

        days.push({
            dateNum: i,
            fullDate: dateString,
            hasEntry,
            isToday: date.toDateString() === today.toDateString(),
            moodColor: mood ? moodThemes[mood] : 'transparent'
        });
    }

    return (
        <div className="pt-6 border-t border-gray-200/60 pb-8 backdrop-blur-sm bg-white/10 rounded-xl p-4 shadow-sm ring-1 ring-gray-900/5 mt-auto">
            <h4 className="mb-4 font-mono text-[10px] font-bold tracking-widest text-gray-400 uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                {monthName}
            </h4>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i} className="text-[9px] font-mono text-gray-300 text-center select-none py-1">
                        {d}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {days.map((day, i) => {
                    if (!day) return <div key={`pad-${i}`} />;
                    return (
                        <CalendarDay
                            key={i}
                            date={day.dateNum}
                            hasEntry={day.hasEntry}
                            isToday={day.isToday}
                            isSelected={selectedDate === day.fullDate}
                            moodColor={day.moodColor}
                            onClick={() => onDateSelect(selectedDate === day.fullDate ? null : day.fullDate)}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarPanel;
