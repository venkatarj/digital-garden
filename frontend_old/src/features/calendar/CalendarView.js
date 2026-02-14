import React, { useState } from 'react';
import axios from 'axios';
import { X, Trash2 } from 'lucide-react';

const CalendarView = ({ entries, reminders, onRefresh }) => {
    const [selectedDate, setSelectedDate] = useState(null);
    const [newReminderText, setNewReminderText] = useState('');

    // IP ADDRESS (in real app, this should be in a config file)
    const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:8000`;

    const handleAddReminder = async () => {
        if (!newReminderText || !selectedDate) return;
        await axios.post(`${API_URL}/reminders/`, { text: newReminderText, date: selectedDate });
        setNewReminderText('');
        onRefresh();
    };

    const deleteReminder = async (remId) => {
        await axios.delete(`${API_URL}/reminders/${remId}`);
        onRefresh();
    };

    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const monthName = today.toLocaleString('default', { month: 'long' });

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '30px', color: '#2d3748' }}>{monthName} {today.getFullYear()}</h2>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '15px' }}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} style={{ textAlign: 'center', fontWeight: 'bold', color: '#aaa', marginBottom: '10px' }}>{d}</div>)}

                {days.map(day => {
                    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const dayReminders = reminders.filter(r => r.date === dateStr);
                    const dayEntries = entries.filter(e => e.date === dateStr);
                    const isToday = day === today.getDate();

                    return (
                        <div key={day} onClick={() => setSelectedDate(dateStr)}
                            style={{
                                height: '100px', background: 'white', borderRadius: '12px',
                                border: isToday ? '2px solid #7C9A86' : '1px solid transparent',
                                padding: '10px', cursor: 'pointer', position: 'relative', overflow: 'hidden',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.05)', transition: 'transform 0.1s'
                            }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '14px', color: isToday ? '#7C9A86' : '#333' }}>{day}</span>
                                {dayEntries.length > 0 && <span style={{ fontSize: '12px' }}>{dayEntries[0].mood}</span>}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                                {dayReminders.slice(0, 3).map(r => (
                                    <div key={r.id} style={{ fontSize: '10px', background: '#ffebee', color: '#c53030', padding: '2px 4px', borderRadius: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {r.text}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* MODAL */}
            {selectedDate && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '25px', borderRadius: '16px', width: '350px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: '#2d3748' }}>Add Task</h3>
                            <button onClick={() => setSelectedDate(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <p style={{ color: '#888', marginBottom: '15px', fontSize: '14px' }}>For {selectedDate}</p>
                        <input autoFocus placeholder="e.g., Call Mom..." value={newReminderText} onChange={e => setNewReminderText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddReminder()} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '15px', outline: 'none' }} />
                        <button onClick={handleAddReminder} style={{ width: '100%', padding: '12px', background: '#7C9A86', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Add Task</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarView;
