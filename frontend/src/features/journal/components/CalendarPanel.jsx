import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CalendarDay = ({ date, hasEntry, isToday, isSelected, moodColor, onClick }) => {
    let baseClasses = "relative w-full aspect-square flex flex-col items-center justify-center font-mono text-xs rounded-lg transition-all duration-200";
    let stateClasses = "";

    if (isSelected) {
        stateClasses = "bg-[hsl(var(--primary))] text-white shadow-lg ring-2 ring-[hsl(var(--primary)/0.3)] shadow-[hsl(var(--primary)/0.3)] opacity-100";
    } else if (isToday) {
        stateClasses = "bg-[hsl(var(--primary))] text-white font-bold shadow-md shadow-[hsl(var(--primary)/0.3)] opacity-100";
    } else if (hasEntry) {
        stateClasses = "text-gray-800 font-medium opacity-100";
    } else {
        stateClasses = "text-gray-400 opacity-60 hover:opacity-100 hover:bg-gray-100";
    }

    return (
        <motion.button
            whileHover={{ scale: 1.15, zIndex: 10 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`${baseClasses} ${stateClasses}`}
            style={{ backgroundColor: hasEntry && !isSelected && !isToday ? moodColor : undefined }}
        >
            <span>{date}</span>

            {/* Entry Indicator Dot */}
            {(hasEntry || isToday) && !isSelected && !isToday && (
                <div className={`absolute -bottom-1 w-1 h-1 rounded-full ${hasEntry ? 'bg-primary/80' : 'bg-gray-400/50'}`} />
            )}
        </motion.button>
    );
};

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
        <div className="pt-6 pb-6 bg-slate-50 border border-slate-200 rounded-[32px] p-6 shadow-sm mt-auto">
            <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="text-sm font-bold tracking-wide uppercase" style={{ color: 'var(--accent-primary)' }}>{monthName}</h3>
                <span className="text-sm font-medium opacity-80" style={{ color: 'var(--accent-primary)' }}>{currentYear}</span>
            </div>

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
