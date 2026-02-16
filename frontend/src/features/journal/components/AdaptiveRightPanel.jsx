import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJournal } from '../context/JournalContext';
import QuickCheckIn from './QuickCheckIn';
import HabitTracker from './HabitTracker';
import InsightsSummary from './InsightsSummary';
import CalendarPanel from './CalendarPanel';
import axios from 'axios';

const AdaptiveRightPanel = ({ optimisticDeletedIds }) => {
    const {
        isCreating,
        isEditing,
        isBrowsing,
        entries,
        allHabits,
        completedHabitIds,
        selectedDate,
        setSelectedDate,
        toggleHabit,
        handleAddHabit,
        handleDeleteHabit,
        currentFolder,
        onRefresh
    } = useJournal();

    const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

    // Quick add handler for QuickCheckIn
    const handleQuickAdd = async (text) => {
        try {
            await axios.post(`${API_URL}/entries/`, {
                title: 'Quick Note',
                content: text,
                folder: currentFolder || 'Journal',
                mood: '😐'
            });
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Failed to add quick note:', error);
        }
    };

    // Determine panel mode based on user context
    const panelMode = isCreating ? 'quick' : isEditing ? 'habits' : 'insights';

    const filteredEntries = entries.filter(e => !optimisticDeletedIds.includes(e.id));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <AnimatePresence mode="wait">
                {panelMode === 'quick' && (
                    <motion.div
                        key="quick"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        style={{ flex: '0 0 auto', maxHeight: '60%', overflowY: 'auto', paddingRight: '5px' }}
                    >
                        <div style={{ marginBottom: '20px', paddingTop: '10px' }}>
                            <QuickCheckIn
                                onAddEntry={handleQuickAdd}
                                isManagingHabits={false}
                                onToggleManage={() => {}}
                            />
                        </div>
                    </motion.div>
                )}

                {panelMode === 'habits' && (
                    <motion.div
                        key="habits"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        style={{ flex: '0 0 auto', maxHeight: '60%', overflowY: 'auto', paddingRight: '5px' }}
                    >
                        <div style={{ marginBottom: '20px', paddingTop: '10px' }}>
                            <HabitTracker
                                habits={allHabits}
                                completedIds={completedHabitIds}
                                onToggle={toggleHabit}
                                onAdd={handleAddHabit}
                                onDelete={handleDeleteHabit}
                            />
                        </div>
                    </motion.div>
                )}

                {panelMode === 'insights' && (
                    <motion.div
                        key="insights"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <InsightsSummary entries={filteredEntries} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Calendar always visible at bottom */}
            <div style={{ marginTop: 'auto', paddingTop: '20px', paddingBottom: '20px', width: '100%' }}>
                <CalendarPanel
                    entries={filteredEntries}
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                />
            </div>
        </div>
    );
};

export default AdaptiveRightPanel;
