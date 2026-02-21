import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Circle, Trash2, ChevronDown, ChevronUp, Eraser, Plus } from 'lucide-react';

const COLORS = {
    green: { hex: '#10b981', label: 'Low Priority' },
    yellow: { hex: '#f59e0b', label: 'Medium Priority' },
    red: { hex: '#ef4444', label: 'High Priority' }
};

const TaskWidget = ({ tasks = [], onToggle, onDelete, onAdd, onUpdateColor }) => {

    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [newTaskText, setNewTaskText] = useState('');
    const [selectedColor, setSelectedColor] = useState('green');

    // Filter tasks
    const activeTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);

    const handleAddTask = () => {
        if (newTaskText.trim()) {
            onAdd({
                text: newTaskText.trim(),
                color: selectedColor,
                completed: false,
                createdAt: new Date().toISOString()
            });
            setNewTaskText('');
            setSelectedColor('green');
        }
    };

    const handleClearTasks = (e) => {
        e.stopPropagation();
        if (tasks.length > 0) {
            setShowClearConfirm(true);
        }
    };

    const confirmClear = () => {
        tasks.forEach(task => onDelete(task.id));
        setShowClearConfirm(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleAddTask();
        }
    };

    return (
        <div className="task-widget expanded relative">
            {/* Header */}
            <div className="task-widget-header">
                <div className="task-widget-title">
                    <span style={{ fontSize: '16px' }}>✅</span>
                    <span>Tasks</span>
                    <span className="task-count-badge">{activeTasks.length}</span>
                </div>

                <div className="task-header-actions">
                    <button
                        className="task-header-btn"
                        onClick={handleClearTasks}
                        title="Clear all tasks"
                        disabled={showClearConfirm || tasks.length === 0}
                    >
                        <Eraser size={15} />
                    </button>
                </div>
            </div>

            {/* Body or Confirmation */}
            <AnimatePresence mode="wait">
                {showClearConfirm ? (
                    <motion.div
                        key="confirm"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-8 text-center bg-white/50 backdrop-blur-sm"
                    >
                        <div className="flex flex-col items-center justify-center gap-4">
                            <div className="p-4 bg-red-100/80 text-red-500 rounded-full shadow-inner">
                                <Trash2 size={28} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-800 text-lg mb-1">Clear all tasks?</h4>
                                <p className="text-sm text-slate-500">This cannot be undone.</p>
                            </div>
                            <div className="flex gap-3 w-full max-w-[240px] mt-2">
                                <button
                                    onClick={() => setShowClearConfirm(false)}
                                    className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmClear}
                                    className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div style={{ overflow: 'hidden' }}>
                            <div className="task-widget-body">
                                {/* Active Tasks */}
                                {activeTasks.length > 0 && (
                                    <div>
                                        {activeTasks.map(task => (
                                            <TaskItem
                                                key={task.id}
                                                task={task}
                                                onToggle={() => onToggle(task.id)}
                                                onDelete={() => onDelete(task.id)}
                                                onColorChange={(color) => onUpdateColor(task.id, color)}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Completed Tasks */}
                                {completedTasks.length > 0 && (
                                    <>
                                        <div className="task-divider" />
                                        <div className="task-section-label">
                                            Completed ({completedTasks.length})
                                        </div>
                                        {completedTasks.map(task => (
                                            <TaskItem
                                                key={task.id}
                                                task={task}
                                                onToggle={() => onToggle(task.id)}
                                                onDelete={() => onDelete(task.id)}
                                                isCompleted
                                            />
                                        ))}
                                    </>
                                )}

                                {/* Add Task */}
                                <div className="task-add-row">
                                    <div className="task-color-picker">
                                        {Object.keys(COLORS).map(color => (
                                            <button
                                                key={color}
                                                className={`task-color-option ${selectedColor === color ? 'selected' : ''}`}
                                                onClick={() => setSelectedColor(color)}
                                                style={{ background: COLORS[color].hex }}
                                                title={COLORS[color].label}
                                            />
                                        ))}
                                    </div>

                                    <input
                                        className="task-add-input"
                                        type="text"
                                        placeholder="New task..."
                                        value={newTaskText}
                                        onChange={(e) => setNewTaskText(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                    />

                                    <button
                                        className="task-add-btn"
                                        onClick={handleAddTask}
                                        disabled={!newTaskText.trim()}
                                    >
                                        <Plus size={14} />
                                        Add
                                    </button>
                                </div>

                                {/* Empty state */}
                                {activeTasks.length === 0 && completedTasks.length === 0 && (
                                    <div className="task-empty">
                                        No tasks yet — add one below! ✨
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Individual Task Item ───────────────────────────────────────
const TaskItem = ({ task, onToggle, onDelete, onColorChange, isCompleted }) => {
    const colorKeys = Object.keys(COLORS);

    const cycleColor = () => {
        if (!onColorChange) return;
        const currentIndex = colorKeys.indexOf(task.color);
        const nextColor = colorKeys[(currentIndex + 1) % colorKeys.length];
        onColorChange(nextColor);
    };

    return (
        <div className="task-item">
            {/* Checkbox */}
            <button
                className={`task-checkbox ${task.completed ? 'checked' : ''}`}
                onClick={onToggle}
            >
                {task.completed ? (
                    <CheckCircle size={18} fill="currentColor" />
                ) : (
                    <Circle size={18} />
                )}
            </button>

            {/* Priority dot */}
            {!isCompleted && onColorChange && (
                <button
                    className={`task-priority-dot ${task.color || 'green'}`}
                    onClick={cycleColor}
                    title={`Priority: ${COLORS[task.color]?.label || 'Low'} (click to change)`}
                />
            )}

            {/* Text */}
            <span className={`task-text ${task.completed ? 'completed' : ''}`}>
                {task.text}
            </span>

            {/* Delete */}
            <button className="task-delete-btn" onClick={onDelete}>
                <Trash2 size={14} />
            </button>
        </div>
    );
};

export default TaskWidget;
