import React, { useState } from 'react';
import { Settings, Trash2 } from 'lucide-react';

const HabitTracker = ({ habits, completedIds, onToggle, onAdd, onDelete }) => {
    const [isManaging, setIsManaging] = useState(false);
    const [newHabitName, setNewHabitName] = useState('');
    const [newHabitIcon, setNewHabitIcon] = useState('⚡️');

    const handleAdd = () => {
        onAdd(newHabitName, newHabitIcon);
        setNewHabitName('');
        setNewHabitIcon('⚡️');
        setIsManaging(false);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 5, paddingBottom: '5px' }}>
                <h4 style={{ margin: 0, color: 'var(--contrast-text)', fontSize: '14px', fontWeight: '600' }}>Habit Tracker</h4>
                <Settings size={14} color="var(--muted-text)" style={{ cursor: 'pointer', opacity: 0.8 }} onClick={() => setIsManaging(!isManaging)} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {habits.map(h => {
                    const isDone = completedIds.includes(h.id);
                    return (
                        <div key={h.id} onClick={() => !isManaging && onToggle(h.id)}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px',
                                background: isDone ? 'var(--contrast-text)' : 'var(--bg-primary)',
                                border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s',
                                color: isDone ? 'var(--bg-primary)' : 'var(--contrast-text)',
                                borderRadius: 'var(--radius-md)', marginBottom: '8px',
                                boxShadow: 'var(--shadow-soft)'
                            }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isDone ? 'var(--nothing-red)' : 'var(--border-color)', boxShadow: isDone ? '0 0 5px var(--nothing-red)' : 'none' }}></div>
                                <span style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{h.name}</span>
                            </div>
                            <span style={{ fontSize: '16px', opacity: isDone ? 1 : 0.5 }}>{h.icon}</span>
                            {isManaging && (
                                <button onClick={(e) => { e.stopPropagation(); onDelete(h.id); }} style={{ border: 'none', background: 'transparent', color: 'var(--nothing-red)', cursor: 'pointer' }}>
                                    <Trash2 size={12} />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Inline Add Button */}
            {isManaging || habits.length === 0 ? (
                <div style={{ marginTop: '15px', border: '1px dashed var(--muted-text)', padding: '10px', background: 'var(--bg-primary)' }}>
                    <div style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                        <input placeholder="Name..." value={newHabitName} onChange={e => setNewHabitName(e.target.value)}
                            style={{ flex: 1, border: 'none', borderBottom: '1px solid var(--contrast-text)', background: 'transparent', color: 'var(--contrast-text)', outline: 'none', fontSize: '12px', fontFamily: 'var(--font-mono)', padding: '4px' }} />
                        <input placeholder="Icon" value={newHabitIcon} onChange={e => setNewHabitIcon(e.target.value)}
                            style={{ width: '30px', border: 'none', borderBottom: '1px solid var(--contrast-text)', background: 'transparent', color: 'var(--contrast-text)', outline: 'none', fontSize: '12px', textAlign: 'center' }} />
                    </div>
                    <button onClick={handleAdd} style={{ width: '100%', background: 'var(--contrast-text)', color: 'var(--bg-primary)', border: 'none', padding: '6px', fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
                        + ADD
                    </button>
                </div>
            ) : (
                <button onClick={() => setIsManaging(true)} style={{ marginTop: '15px', width: '100%', border: '1px dashed var(--muted-text)', background: 'transparent', padding: '8px', color: 'var(--muted-text)', fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
                    + ADD NEW
                </button>
            )}
        </div>
    );
};

export default HabitTracker;
