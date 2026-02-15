import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BookOpen, Calendar as CalIcon, Brain, Folder, Plus, Clock, Trash2, ChevronDown,
  Lock, Unlock, ChevronsLeft, ChevronsRight, Search, Menu, BarChart2, Sun, Moon, Download, LogOut
} from 'lucide-react';
import { GoogleOAuthProvider } from '@react-oauth/google';

import Login from './features/auth/Login';
import JournalView from './features/journal/JournalView';
import CalendarView from './features/calendar/CalendarView';
import InsightsView from './features/insights/InsightsView';
import { CommandMenu } from './components/CommandMenu';

// --- IP ADDRESS ---
const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

// --- AXIOS CONFIG ---
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    // Use Authorization: Bearer <token> for JWT
    config.headers['Authorization'] = `Bearer ${token}`;
    // Keep x-token for backward compatibility during migration
    config.headers['x-token'] = token;
  }
  return config;
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [view, setView] = useState('journal');
  const [entries, setEntries] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [folders, setFolders] = useState(['Journal', 'Work', 'Ideas']);

  // App State
  const [activeFolder, setActiveFolder] = useState('Journal');
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [isPrivate, setIsPrivate] = useState(true);
  const [reminderFilter, setReminderFilter] = useState('This Week');
  const [entryToEdit, setEntryToEdit] = useState(null);
  const [appBackground, setAppBackground] = useState('#F5F7F5'); // Legacy, will override with theme
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState(() => {
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  // Persist theme to localStorage
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const fetchData = async () => {
    try {
      const [eRes, rRes] = await Promise.all([
        axios.get(`${API_URL}/entries/?limit=100`),
        axios.get(`${API_URL}/reminders/`)
      ]);
      setEntries(eRes.data);
      setReminders(rRes.data);

      const uniqueFolders = [...new Set(eRes.data.map(e => e.folder))];
      setFolders(prev => [...new Set([...prev, ...uniqueFolders])]);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      }
    }
  };

  const handleExportData = async () => {
    try {
      const response = await axios.get(`${API_URL}/export/json`);
      const data = response.data;

      // Create JSON blob
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `life-os-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Reset authentication state (will redirect to login)
    setIsAuthenticated(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();

      // Connect to WebSocket
      /* DISABLED
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      let host = window.location.host; // Default to current host (production)

      // If API_URL is independent (local dev), use its host
      if (API_URL.startsWith('http')) {
        try {
          host = new URL(API_URL).host;
        } catch (e) {
          console.error("Invalid API_URL:", API_URL);
        }
      }

      const wsUrl = `${protocol}//${host}/ws/${Date.now()}`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => console.log("✅ WebSocket Connected");
      ws.onmessage = (event) => console.log("📩 Message from server:", event.data);
      ws.onclose = () => console.log("❌ WebSocket Disconnected");

      return () => ws.close();
      */
    }
  }, [isAuthenticated]);

  const loadEntry = (entry) => {
    setEntryToEdit(entry);
    setActiveFolder(entry.folder); // Sync folder
    setView('journal');
  };

  const handleDeleteEntry = async (e, entryId) => {
    e.stopPropagation();
    if (window.confirm("Delete this entry permanently?")) {
      await axios.delete(`${API_URL}/entries/${entryId}`);
      fetchData();
    }
  };

  const deleteReminder = async (remId) => {
    await axios.delete(`${API_URL}/reminders/${remId}`);
    fetchData();
  };

  const handleAddFolder = () => {
    if (newFolderName) {
      setFolders([...folders, newFolderName]);
      setActiveFolder(newFolderName);
      setNewFolderName('');
      setIsAddingFolder(false);
    }
  };

  const getFilteredReminders = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

  const navItemStyle = (isActive) => ({
    padding: '8px 12px', cursor: 'pointer', borderRadius: 'var(--radius-md)', display: 'flex', gap: '10px', alignItems: 'center',
    background: isActive ? 'var(--bg-primary)' : 'transparent',
    color: isActive ? 'var(--contrast-text)' : 'var(--muted-text)',
    fontWeight: isActive ? '600' : '500', marginBottom: '4px',
    fontSize: '14px', transition: 'all 0.2s ease',
    boxShadow: isActive ? 'var(--shadow-soft)' : 'none'
  });

  // Auth view rendering
  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div style={{
      display: 'flex', height: '100vh',
      fontFamily: 'var(--font-sans)', color: 'var(--contrast-text)',
      background: 'var(--bg-primary)', /* FIX: Apply variable here so it picks up data-theme */
      transition: 'background 0.3s ease'
    }} data-theme={theme}>
      {/* 1. LEFT SIDEBAR */}
      <div style={{
        width: isSidebarCollapsed ? '70px' : '250px',
        background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)', padding: '25px 20px',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden'
      }}>
        <h2 style={{ color: 'var(--accent-primary)', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start' }}>
          <BookOpen size={24} style={{ minWidth: '24px' }} />
          {!isSidebarCollapsed && <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: '1px', fontSize: '16px' }}>LIFE OS</span>}
        </h2>

        <div onClick={() => setView('journal')} style={{ ...navItemStyle(view === 'journal') }} className="sidebar-item">
          <BookOpen size={18} /> {!isSidebarCollapsed && "Journal"}
        </div>
        <div onClick={() => setView('calendar')} style={{ ...navItemStyle(view === 'calendar') }} className="sidebar-item">
          <CalIcon size={18} /> {!isSidebarCollapsed && "Calendar"}
        </div>
        <div onClick={() => setView('insights')} style={{ ...navItemStyle(view === 'insights') }} className="sidebar-item">
          <BarChart2 size={18} /> {!isSidebarCollapsed && "Insights"}
        </div>

        {/* FOLDERS */}
        {!isSidebarCollapsed && (
          <>
            <div style={{ marginTop: '24px', marginBottom: '8px', paddingLeft: '12px', fontSize: '13px', fontWeight: '600', color: 'var(--muted-text)' }}>Folders</div>
            {folders.filter(f => f !== 'Journal').map(folder => (
              <div key={folder} onClick={() => { setActiveFolder(folder); setView('journal'); }}
                style={{
                  padding: '8px 12px', cursor: 'pointer', borderRadius: 'var(--radius-md)', fontSize: '14px', fontWeight: '500',
                  color: activeFolder === folder ? 'var(--contrast-text)' : 'var(--muted-text)',
                  background: activeFolder === folder ? 'var(--bg-primary)' : 'transparent',
                  marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '10px',
                  boxShadow: activeFolder === folder ? 'var(--shadow-soft)' : 'none'
                }} className="sidebar-item">
                <Folder size={14} /> {folder}
              </div>
            ))}
            {isAddingFolder ? (
              <input autoFocus placeholder="Name..." value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddFolder()} onBlur={() => setIsAddingFolder(false)}
                style={{ width: '100%', padding: '8px', marginTop: '5px', background: 'transparent', border: '1px solid var(--muted-text)', color: 'var(--contrast-text)', fontFamily: 'var(--font-mono)', fontSize: '13px', outline: 'none' }} />
            ) : (
              <div onClick={() => setIsAddingFolder(true)} className="sidebar-item" style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--muted-text)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '8px', border: '1px dashed var(--border-color)', justifyContent: 'center' }}>
                <Plus size={14} /> New Folder
              </div>
            )}
          </>
        )}

        {/* EXPORT DATA, LOGOUT, THEME TOGGLE & COLLAPSE */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: isSidebarCollapsed ? 'center' : 'space-between', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
            <button onClick={handleExportData} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted-text)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Download size={18} />
              {!isSidebarCollapsed && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>EXPORT DATA</span>}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: isSidebarCollapsed ? 'center' : 'space-between' }}>
            <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted-text)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <LogOut size={18} />
              {!isSidebarCollapsed && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>LOGOUT</span>}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: isSidebarCollapsed ? 'center' : 'space-between', paddingTop: '10px' }}>
            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted-text)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              {!isSidebarCollapsed && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{theme === 'light' ? 'DARK MODE' : 'LIGHT MODE'}</span>}
            </button>

            {!isSidebarCollapsed && (
              <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted-text)' }}>
                <ChevronsLeft size={18} />
              </button>
            )}
          </div>
          {isSidebarCollapsed && (
            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted-text)', alignSelf: 'center' }}>
              <ChevronsRight size={18} />
            </button>
          )}
        </div>

        {/* RECENTS */}
        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #eee' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#a0aec0', marginBottom: '10px' }}>RECENT ENTRIES</div>
          {entries.slice(0, 5).map(e => (
            <div key={e.id} onClick={() => loadEntry(e)}
              style={{ marginBottom: '8px', fontSize: '13px', cursor: 'pointer', color: '#4a5568', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden' }}>
                <Clock size={12} color="#cbd5e0" />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>{e.title || 'Untitled'}</span>
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

      {/* 2. MAIN CONTENT - Transitions Background */}
      <div className="page-transition" style={{
        flex: 1, padding: '40px', overflowY: 'auto',
        background: appBackground, transition: 'background 0.8s ease'
      }}>
        {view === 'journal' && (
          <JournalView
            entries={entries}
            folders={folders}
            activeFolder={activeFolder}
            entryToEdit={entryToEdit}
            onRefresh={fetchData}
            isPrivate={isPrivate}
            setIsPrivate={setIsPrivate}
            setAppBackground={setAppBackground}
          />
        )}
        {view === 'calendar' && (
          <CalendarView
            entries={entries}
            reminders={reminders}
            onRefresh={fetchData}
          />
        )}
        {view === 'insights' && (
          <InsightsView entries={entries} />
        )}
      </div>

      <CommandMenu view={view} setView={setView} theme={theme} setTheme={setTheme} />
    </div>
  );
}

// Wrap entire app with Google OAuth Provider
const AppWithAuth = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    console.error('VITE_GOOGLE_CLIENT_ID not set!');
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', fontFamily: 'system-ui', color: '#e53e3e'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Configuration Error</h2>
          <p>VITE_GOOGLE_CLIENT_ID environment variable not set.</p>
          <p>Please add it to your .env file.</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  );
};

export default AppWithAuth;