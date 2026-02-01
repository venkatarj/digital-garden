import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BookOpen, Calendar as CalIcon, Bell, 
  CheckCircle, Circle, Trash2, X, Save, Plus,
  Smile, Sun, Meh, Moon, Frown, Folder, Clock,
  ChevronDown, Sparkles, Lock, Unlock, Tag, Brain
} from 'lucide-react';

const API_URL = 'http://35.238.11.242:8000';

// --- THEMES & CONFIG ---
const moodThemes = {
  '😄': '#FFF9C4', '🙂': '#DCEDC8', '😐': '#F5F7F5', '😞': '#E1F5FE', '😡': '#FFEBEE', 
};
const moods = [
  { icon: <Smile size={24} />, value: '😄', label: 'Happy' },
  { icon: <Sun size={24} />, value: '🙂', label: 'Good' },
  { icon: <Meh size={24} />, value: '😐', label: 'Neutral' },
  { icon: <Moon size={24} />, value: '😞', label: 'Sad' },
  { icon: <Frown size={24} />, value: '😡', label: 'Angry' },
];

const prompts = {
  reflect: ["What went well?", "What drained you?", "One thing to improve:"],
  vent: ["Why do I feel this way?", "Is this fact or feeling?", "Let it all out:"],
  gratitude: ["1. ", "2. ", "3. "],
};

function App() {
  const [view, setView] = useState('journal'); 
  const [entries, setEntries] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [folders, setFolders] = useState(['Journal', 'Work', 'Ideas']); 
  
  // UI State
  const [activeFolder, setActiveFolder] = useState('Journal');
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showTags, setShowTags] = useState(false);
  const [isPrivate, setIsPrivate] = useState(true);
  const [reminderFilter, setReminderFilter] = useState('This Week');

  // Editor State
  const [id, setId] = useState(null); 
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState('😐');
  const [tags, setTags] = useState('');
  
  // Modal State
  const [selectedDate, setSelectedDate] = useState(null);
  const [newReminderText, setNewReminderText] = useState('');

  const currentBg = moodThemes[selectedMood] || '#F5F7F5';

  const fetchData = async () => {
    try {
      const [eRes, rRes] = await Promise.all([
        axios.get(`${API_URL}/entries/`),
        axios.get(`${API_URL}/reminders/`)
      ]);
      setEntries(eRes.data);
      setReminders(rRes.data);
      
      const uniqueFolders = [...new Set(eRes.data.map(e => e.folder))];
      setFolders(prev => [...new Set([...prev, ...uniqueFolders])]);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchData(); }, []);

  // --- LOGIC ---
  const getFilteredReminders = () => {
    const today = new Date();
    today.setHours(0,0,0,0);

    return reminders.filter(r => {
        const [y, m, d] = r.date.split('-').map(Number);
        const rDate = new Date(y, m - 1, d);
        const diffTime = rDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (reminderFilter === 'Today') return diffDays === 0;
        if (reminderFilter === 'This Week') return diffDays >= 0 && diffDays <= 7;
        if (reminderFilter === 'Next 2 Weeks') return diffDays >= 0 && diffDays <= 14;
        if (reminderFilter === 'This Month') return rDate.getMonth() === today.getMonth();
        return true;
    });
  };

  const insertPrompt = (type) => {
    const lines = prompts[type].join('\n\n');
    setContent(prev => prev + (prev ? '\n\n' : '') + lines);
  };

  const handleAutoTitle = () => {
    if (!content) return;
    const words = content.split(' ').slice(0, 5).join(' ');
    setTitle(words + '...');
  };

  // --- ACTIONS ---

  const handleSaveEntry = async () => {
    if (!content) return;
    const finalContent = tags ? `${content}\n\n[Tags: ${tags}]` : content;
    
    await axios.post(`${API_URL}/entries/`, { 
      title: title || 'Untitled', content: finalContent, folder: activeFolder, mood: selectedMood,
      habit_exercise: false, habit_meditate: false, habit_read: false
    });
    setTitle(''); setContent(''); setId(null); setTags('');
    fetchData();
  };

  const loadEntry = (entry) => {
    setTitle(entry.title); setContent(entry.content);
    setSelectedMood(entry.mood); setActiveFolder(entry.folder);
    setId(entry.id); setView('journal');
  };

  const handleDeleteEntry = async (e, entryId) => {
    e.stopPropagation();
    if (window.confirm("Delete this entry permanently?")) {
        await axios.delete(`${API_URL}/entries/${entryId}`);
        fetchData();
    }
  };

  const handleAddFolder = () => {
    if (newFolderName) {
        setFolders([...folders, newFolderName]);
        setActiveFolder(newFolderName);
        setNewFolderName('');
        setIsAddingFolder(false);
    }
  };

  const handleAddReminder = async () => {
    if (!newReminderText || !selectedDate) return;
    await axios.post(`${API_URL}/reminders/`, { text: newReminderText, date: selectedDate });
    setNewReminderText(''); fetchData();
  };

  const deleteReminder = async (remId) => {
    await axios.delete(`${API_URL}/reminders/${remId}`);
    fetchData();
  };

  // --- VIEWS ---

  const renderJournal = () => (
    <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', color: '#8898aa', fontSize: '13px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Folder size={14} /> <span>{activeFolder}</span> 
            {id && <span style={{background:'#e2e8f0', padding:'2px 8px', borderRadius:'4px'}}>Editing ID: {id}</span>}
        </div>
        <div style={{ cursor: 'pointer', display: 'flex', gap: '5px', alignItems: 'center' }} onClick={() => setIsPrivate(!isPrivate)}>
            {isPrivate ? <Lock size={14}/> : <Unlock size={14}/>}
            {isPrivate ? 'Private' : 'Shareable'}
        </div>
      </div>

      {/* Mood Selector */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', gap: '10px', background: 'rgba(255,255,255,0.5)', padding: '10px 20px', borderRadius: '30px', backdropFilter: 'blur(10px)' }}>
            {moods.map(m => (
            <button key={m.value} onClick={() => setSelectedMood(m.value)} title={m.label}
                style={{ 
                    padding: '8px', borderRadius: '50%', border: 'none', background: 'transparent',
                    cursor: 'pointer', transform: selectedMood === m.value ? 'scale(1.3)' : 'scale(1)',
                    transition: 'all 0.2s ease', opacity: selectedMood === m.value ? 1 : 0.6
                }}>
                {m.icon}
            </button>
            ))}
        </div>
      </div>

      {/* Writing Helpers */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', justifyContent: 'center' }}>
        <button onClick={() => insertPrompt('reflect')} style={helperStyle}>🤔 Reflect</button>
        <button onClick={() => insertPrompt('vent')} style={helperStyle}>😤 Vent</button>
        <button onClick={() => insertPrompt('gratitude')} style={helperStyle}>🙏 Gratitude</button>
        <button onClick={() => setContent('')} style={{...helperStyle, color: '#e53e3e'}}>Clear</button>
      </div>

      {/* Editor */}
      <div style={{ position: 'relative', marginBottom: '15px' }}>
        <input placeholder="Title..." value={title} onChange={e => setTitle(e.target.value)} 
            style={{ fontSize: '28px', fontWeight: 'bold', border: 'none', background: 'transparent', width: '100%', outline: 'none', color: '#2d3748' }} />
        {content.length > 10 && !title && (
            <button onClick={handleAutoTitle} style={{ position: 'absolute', right: 0, top: '5px', background: 'none', border: 'none', cursor: 'pointer', color: '#7C9A86' }}>
                <Sparkles size={20} />
            </button>
        )}
      </div>

      <textarea placeholder="Start writing..." value={content} onChange={e => setContent(e.target.value)} 
        style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '18px', lineHeight: '1.6', outline: 'none', resize: 'none', color: '#4a5568', fontFamily: 'inherit' }} />

      {/* Delight Button */}
      {content.length > 50 && (
          <div style={{ margin: '10px 0', textAlign: 'center' }}>
              <button onClick={() => setContent(content + '\n\n✨ Today I learned: ')} 
                style={{ background: 'white', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', color: '#7C9A86', fontSize: '13px' }}>
                ✨ Add a small win
              </button>
          </div>
      )}

      {/* Bottom Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '20px' }}>
         <div style={{ display: 'flex', alignItems: 'center' }}>
            {!showTags ? (
                <button onClick={() => setShowTags(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096', display: 'flex', alignItems: 'center', gap: '5px', fontSize:'13px' }}>
                    <Tag size={14} /> + Tags
                </button>
            ) : (
                <input autoFocus placeholder="work, health..." value={tags} onChange={e => setTags(e.target.value)} onBlur={() => !tags && setShowTags(false)}
                    style={{ background: 'white', border: '1px solid #e2e8f0', padding: '5px 10px', borderRadius: '15px', fontSize: '13px', outline: 'none' }} />
            )}
        </div>
        <button onClick={handleSaveEntry} style={{ background: '#7C9A86', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(124, 154, 134, 0.4)' }}>
              <Save size={18} /> Save Entry
        </button>
      </div>
    </div>
  );

  const renderCalendar = () => {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const monthName = today.toLocaleString('default', { month: 'long' });

    return (
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '30px', color: '#2d3748' }}>{monthName} {today.getFullYear()}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '15px' }}>
          {['S','M','T','W','T','F','S'].map(d => <div key={d} style={{ textAlign: 'center', fontWeight: 'bold', color: '#aaa', marginBottom:'10px' }}>{d}</div>)}
          
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
                <div style={{ display:'flex', justifyContent:'space-between'}}>
                    <span style={{ fontWeight: 'bold', fontSize: '14px', color: isToday ? '#7C9A86' : '#333' }}>{day}</span>
                    {dayEntries.length > 0 && <span style={{fontSize:'12px'}}>{dayEntries[0].mood}</span>}
                </div>
                
                <div style={{ display: 'flex', flexDirection:'column', gap: '4px', marginTop: '8px' }}>
                  {dayReminders.slice(0,3).map(r => (
                    <div key={r.id} style={{ fontSize: '10px', background: '#ffebee', color: '#c53030', padding: '2px 4px', borderRadius: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.text}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Segoe UI, sans-serif' }}>
      
      {/* 1. LEFT SIDEBAR */}
      <div style={{ width: '250px', background: 'white', borderRight: '1px solid #eee', padding: '25px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ color: '#7C9A86', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={24}/> Life OS
        </h2>
        
        <div onClick={() => setView('journal')} style={navItemStyle(view === 'journal')}>Journal</div>
        <div onClick={() => setView('calendar')} style={navItemStyle(view === 'calendar')}><CalIcon size={18}/> Calendar</div>
        
        {/* FOLDERS */}
        <div style={{ marginTop: '30px', marginBottom: '10px', fontSize: '12px', fontWeight: 'bold', color: '#a0aec0', letterSpacing: '1px' }}>FOLDERS</div>
        {folders.map(folder => (
            <div key={folder} onClick={() => { setActiveFolder(folder); setView('journal'); }}
                style={{ padding: '8px 10px', cursor: 'pointer', borderRadius: '6px', fontSize: '14px', color: activeFolder === folder ? '#2d3748' : '#718096', background: activeFolder === folder ? '#edf2f7' : 'transparent', marginBottom: '4px', display:'flex', alignItems:'center', gap:'8px' }}>
                <Folder size={14}/> {folder}
            </div>
        ))}
        {isAddingFolder ? (
            <input autoFocus placeholder="Name..." value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddFolder()} onBlur={() => setIsAddingFolder(false)}
                style={{ width: '100%', padding: '5px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }} />
        ) : (
            <div onClick={() => setIsAddingFolder(true)} style={{ padding: '8px 10px', cursor: 'pointer', color: '#7C9A86', fontSize: '13px', display:'flex', alignItems:'center', gap:'5px' }}><Plus size={14}/> Add Folder</div>
        )}

        {/* RECENTS */}
        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #eee' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#a0aec0', marginBottom: '10px' }}>RECENT ENTRIES</div>
            {entries.slice(0, 5).map(e => (
                <div key={e.id} onClick={() => loadEntry(e)}
                    style={{ marginBottom: '8px', fontSize: '13px', cursor: 'pointer', color: '#4a5568', display:'flex', alignItems:'center', justifyContent: 'space-between', paddingRight: '5px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'5px', overflow: 'hidden' }}>
                        <Clock size={12} color="#cbd5e0"/> 
                        <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px'}}>{e.title || 'Untitled'}</span>
                    </div>
                    <Trash2 size={14} color="#e53e3e" style={{ opacity: 0.5, cursor: 'pointer' }} 
                        onClick={(event) => handleDeleteEntry(event, e.id)} 
                        onMouseOver={(e) => e.target.style.opacity = 1}
                        onMouseOut={(e) => e.target.style.opacity = 0.5}
                    />
                </div>
            ))}
        </div>
      </div>

      {/* 2. MAIN CONTENT */}
      <div style={{ 
          flex: 1, padding: '40px', overflowY: 'auto', 
          background: currentBg, transition: 'background 0.8s ease'
      }}>
        {view === 'journal' ? renderJournal() : renderCalendar()}
      </div>

      {/* 3. RIGHT PANEL Toggle */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', cursor: 'pointer', color: '#718096' }} onClick={() => setShowRightPanel(!showRightPanel)}>
        <Brain size={24} />
      </div>

      {/* 4. RIGHT PANEL Content */}
      {showRightPanel && (
        <div style={{ width: '300px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', borderLeft: '1px solid rgba(0,0,0,0.05)', padding: '25px', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ marginBottom: '40px' }}>
                <h3 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#a0aec0', letterSpacing: '1px', marginBottom: '15px' }}>Quick Check-in</h3>
                <label style={{ display: 'flex', alignItems:'center', gap:'10px', marginBottom: '10px', fontSize: '14px', color: '#4a5568', cursor: 'pointer', background:'white', padding:'10px', borderRadius:'8px' }}>
                    <input type="checkbox" /> 💧 Drank water
                </label>
                <label style={{ display: 'flex', alignItems:'center', gap:'10px', marginBottom: '10px', fontSize: '14px', color: '#4a5568', cursor: 'pointer', background:'white', padding:'10px', borderRadius:'8px' }}>
                    <input type="checkbox" /> 🧘 Meditated
                </label>
            </div>

            <div style={{ flex: 1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '15px' }}>
                    <select 
                        value={reminderFilter} 
                        onChange={(e) => setReminderFilter(e.target.value)}
                        style={{ border: 'none', background: 'transparent', fontWeight: 'bold', color: '#a0aec0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', cursor:'pointer', outline:'none' }}
                    >
                        <option value="Today">Today</option>
                        <option value="This Week">This Week</option>
                        <option value="Next 2 Weeks">Next 2 Weeks</option>
                        <option value="This Month">This Month</option>
                    </select>
                    <ChevronDown size={14} color="#a0aec0"/>
                </div>

                {getFilteredReminders().length === 0 && <div style={{ fontSize: '13px', color: '#cbd5e0', fontStyle: 'italic' }}>No tasks for {reminderFilter}.</div>}
                
                {getFilteredReminders().map(r => (
                    <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', background: 'white', padding: '10px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div>
                            <div style={{ fontSize: '14px', color: '#2d3748' }}>{r.text}</div>
                            <div style={{ fontSize: '11px', color: '#e53e3e' }}>{r.date}</div>
                        </div>
                        <button onClick={() => deleteReminder(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e0' }}><Trash2 size={14} /></button>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* MODAL */}
      {selectedDate && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '25px', borderRadius: '16px', width: '350px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#2d3748' }}>Add Task</h3>
              <button onClick={() => setSelectedDate(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <p style={{ color: '#888', marginBottom: '15px', fontSize:'14px' }}>For {selectedDate}</p>
            <input autoFocus placeholder="e.g., Call Mom..." value={newReminderText} onChange={e => setNewReminderText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddReminder()} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '15px', outline:'none' }} />
            <button onClick={handleAddReminder} style={{ width: '100%', padding: '12px', background: '#7C9A86', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight:'bold' }}>Add Task</button>
          </div>
        </div>
      )}
    </div>
  );
}

const navItemStyle = (isActive) => ({
  padding: '10px', cursor: 'pointer', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'center',
  background: isActive ? '#f0fdf4' : 'transparent', color: isActive ? '#7C9A86' : '#718096', fontWeight: isActive ? 'bold' : 'normal', marginBottom: '5px'
});

const helperStyle = {
    background: 'white', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '15px', 
    cursor: 'pointer', fontSize: '12px', color: '#4a5568', transition: 'all 0.2s'
};

export default App;