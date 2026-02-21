import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Zap, CheckSquare, BarChart3 } from 'lucide-react';
import { useJournal } from '../context/JournalContext';
import QuickCheckIn from './QuickCheckIn';
import TaskWidget from './TaskWidget';
import InsightsSummary from './InsightsSummary';
import CalendarPanel from './CalendarPanel';

const TABS = [
    { key: 'quick', label: 'Quick', icon: Zap },
    { key: 'tasks', label: 'Tasks', icon: CheckSquare },
    { key: 'insights', label: 'Insights', icon: BarChart3 },
];

const AdaptiveRightPanel = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const {
        isCreating,
        isEditing,
        entries,
        tasks,
        addTask,
        toggleTask,
        deleteTask,
        updateTaskColor,
        selectedDate,
        setSelectedDate,
    } = useJournal();

    // Context-suggested panel mode
    const suggestedMode = isCreating ? 'quick' : isEditing ? 'tasks' : 'insights';

    // Active tab: user-overridable, defaults to context-suggested
    const [activeTab, setActiveTab] = useState(suggestedMode);
    const [manualOverride, setManualOverride] = useState(false);
    const prevSuggestedRef = useRef(suggestedMode);

    // When context-suggested mode changes, follow it UNLESS user has manually overridden
    useEffect(() => {
        if (prevSuggestedRef.current !== suggestedMode) {
            prevSuggestedRef.current = suggestedMode;
            if (!manualOverride) {
                setActiveTab(suggestedMode);
            }
        }
    }, [suggestedMode, manualOverride]);

    const handleTabClick = (tabKey) => {
        setActiveTab(tabKey);
        // If user selects the same tab that context suggests, clear the override
        if (tabKey === suggestedMode) {
            setManualOverride(false);
        } else {
            setManualOverride(true);
        }
    };

    // Collapsed view
    if (isCollapsed) {
        return (
            <div style={{
                width: '50px',
                background: 'var(--bg-secondary)',
                borderLeft: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '20px 10px'
            }}>
                <button
                    onClick={() => setIsCollapsed(false)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--muted-text)',
                        padding: '8px'
                    }}
                >
                    <ChevronLeft size={20} />
                </button>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
            {/* Tab Bar */}
            <div className="right-panel-tab-bar">
                <div className="right-panel-tabs">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        const taskCount = tab.key === 'tasks' ? tasks.filter(t => !t.completed).length : 0;
                        return (
                            <button
                                key={tab.key}
                                className={`right-panel-tab ${isActive ? 'active' : ''}`}
                                onClick={() => handleTabClick(tab.key)}
                                title={tab.label}
                            >
                                <Icon size={14} />
                                <span>{tab.label}</span>
                                {tab.key === 'tasks' && taskCount > 0 && (
                                    <span className="right-panel-tab-badge">{taskCount}</span>
                                )}
                            </button>
                        );
                    })}
                </div>

            </div>

            {/* Panel Content */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
                <AnimatePresence mode="wait">
                    {activeTab === 'quick' && (
                        <motion.div
                            key="quick"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div style={{ marginBottom: '20px', paddingTop: '10px' }}>
                                <QuickCheckIn
                                    isManagingHabits={false}
                                    onToggleManage={() => { }}
                                />
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'tasks' && (
                        <motion.div
                            key="tasks"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div style={{ marginBottom: '20px', paddingTop: '10px' }}>
                                <TaskWidget
                                    tasks={tasks}
                                    onToggle={toggleTask}
                                    onDelete={deleteTask}
                                    onAdd={addTask}
                                    onUpdateColor={updateTaskColor}
                                />
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'insights' && (
                        <motion.div
                            key="insights"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <InsightsSummary entries={entries} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Calendar always visible at bottom */}
            <div style={{ marginTop: 'auto', paddingTop: '20px', paddingBottom: '20px', width: '100%' }}>
                <CalendarPanel
                    entries={entries}
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                />
            </div>
        </div>
    );
};

export default AdaptiveRightPanel;
