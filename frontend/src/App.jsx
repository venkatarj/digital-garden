import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { GoogleOAuthProvider } from '@react-oauth/google';

import Login from './features/auth/Login';
import JournalView from './features/journal/JournalView';
import CalendarView from './features/calendar/CalendarView';
import InsightsView from './features/insights/InsightsView';
import { CommandMenu } from './components/CommandMenu';
import UnifiedSidebar from './components/UnifiedSidebar';
import { UIProvider, useUI } from './context/UIContext';
import { ThemeProvider } from './context/ThemeContext';
import DeleteConfirmModal from './features/journal/components/DeleteConfirmModal';
import ToastNotification from './features/journal/components/ToastNotification';

// --- IP ADDRESS ---
const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

// --- AXIOS CONFIG ---
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Separate component that uses UI context
function AppContent() {
  const ui = useUI(); // Access centralized UI state
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [entries, setEntries] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [folders, setFolders] = useState(['Journal', 'Work', 'Ideas']);

  // App State (non-UI)
  const [isPrivate, setIsPrivate] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState(null); // { folderName, count }
  const [entryDeleteModal, setEntryDeleteModal] = useState({ isOpen: false, entryId: null, entryTitle: '' });
  const [isDeletingEntry, setIsDeletingEntry] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success', undoData: null });

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

  // Load custom folders from localStorage on mount
  useEffect(() => {
    const savedFolders = localStorage.getItem('customFolders');
    if (savedFolders) {
      try {
        const customFolders = JSON.parse(savedFolders);
        setFolders(prev => [...new Set([...prev, ...customFolders])]);
      } catch (e) {
        console.error('Failed to load custom folders:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const loadEntry = (entry) => {
    if (!entry) {
      ui.setSelectedEntryId(null);
      return;
    }
    ui.setSelectedEntryId(entry.id);
    ui.setActiveFolder(entry.folder);
    ui.setView('journal');
  };

  const handleDeleteEntry = (e, entryId) => {
    if (e) e.stopPropagation();
    const entry = entries.find(e => e.id === entryId);
    setEntryDeleteModal({
      isOpen: true,
      entryId,
      title: 'Delete Entry?',
      message: <>Are you sure you want to delete <span style={{ fontWeight: '600', color: 'var(--contrast-text)' }}>"{entry ? entry.title : 'Untitled Entry'}"</span>? This action cannot be undone.</>
    });
  };

  const confirmDeleteEntry = async () => {
    const idToDelete = entryDeleteModal.entryId;
    if (!idToDelete) return;

    setIsDeletingEntry(true);
    const deletedEntry = entries.find(e => e.id === idToDelete);

    try {
      await axios.delete(`${API_URL}/entries/${idToDelete}`);

      // Store undo data (excluding generated fields if necessary, but here we just need the payload)
      setToast({
        isVisible: true,
        message: 'Entry deleted successfully',
        type: 'success',
        undoData: deletedEntry
      });

      fetchData();
      if (ui.selectedEntryId === idToDelete) {
        ui.setSelectedEntryId(null);
      }
    } catch (error) {
      console.error("Delete failed:", error);
      setToast({ isVisible: true, message: 'Failed to delete entry', type: 'error', undoData: null });
    } finally {
      setIsDeletingEntry(false);
      setEntryDeleteModal({ isOpen: false, entryId: null, entryTitle: '' });
    }
  };

  const handleUndoDelete = async () => {
    if (!toast.undoData) return;

    try {
      const { title, content, folder, mood, completed_habit_ids } = toast.undoData;
      const res = await axios.post(`${API_URL}/entries/`, {
        title, content, folder, mood, completed_habit_ids: completed_habit_ids || []
      });

      setToast({ isVisible: true, message: 'Entry restored!', type: 'success', undoData: null });
      fetchData();
      ui.setSelectedEntryId(res.data.id);
    } catch (error) {
      console.error("Undo failed:", error);
      setToast({ isVisible: true, message: 'Failed to restore entry', type: 'error', undoData: null });
    }
  };

  const handleAddFolder = (folderName) => {
    if (!folderName || !folderName.trim()) return;

    const trimmedName = folderName.trim();
    if (folders.includes(trimmedName)) {
      alert('Folder already exists!');
      return;
    }

    const updatedFolders = [...folders, trimmedName];
    setFolders(updatedFolders);
    ui.setActiveFolder(trimmedName);

    // Persist to localStorage
    localStorage.setItem('customFolders', JSON.stringify(updatedFolders));
  };

  const handleDeleteFolder = (folderName) => {
    const entriesInFolder = entries.filter(e => e.folder === folderName);
    setDeleteConfirmation({ folderName, count: entriesInFolder.length });
  };

  const confirmDeleteFolder = async () => {
    if (!deleteConfirmation) return;
    setIsDeletingEntry(true);
    const { folderName, count } = deleteConfirmation;

    try {
      const entriesInFolder = entries.filter(e => e.folder === folderName);
      // Delete entries in parallel
      if (count > 0) {
        await Promise.all(entriesInFolder.map(e => axios.delete(`${API_URL}/entries/${e.id}`)));
      }

      // Update state
      setEntries(prev => prev.filter(e => e.folder !== folderName));
      setFolders(prev => prev.filter(f => f !== folderName));

      // Update LocalStorage
      const savedFolders = localStorage.getItem('customFolders');
      if (savedFolders) {
        const customFolders = JSON.parse(savedFolders);
        const newCustomFolders = customFolders.filter(f => f !== folderName);
        localStorage.setItem('customFolders', JSON.stringify(newCustomFolders));
      }

      // Reset UI if needed
      if (ui.activeFolder === folderName) {
        ui.setActiveFolder(null);
      }

      // Refresh data
      fetchData();
    } finally {
      setIsDeletingEntry(false);
      setDeleteConfirmation(null);
    }
  };

  // Auth view rendering
  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  // Find selected entry object
  const selectedEntry = entries.find(e => e.id === ui.selectedEntryId);

  const closeMobileSidebar = useCallback(() => setIsMobileSidebarOpen(false), []);

  return (
    <div style={{
      display: 'flex', height: '100dvh',
      fontFamily: 'var(--font-sans)', color: 'var(--contrast-text)',
      background: 'var(--bg-primary)',
      transition: 'background 0.3s ease',
      overflow: 'hidden'
    }} data-theme={theme}>
      {/* Mobile overlay backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={closeMobileSidebar}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            zIndex: 199, backdropFilter: 'blur(2px)'
          }}
        />
      )}

      {/* UNIFIED LEFT SIDEBAR - Only show if not fullscreen */}
      {!ui.isFullscreen && (
        <UnifiedSidebar
          folders={folders}
          entries={entries}
          onEntryClick={(entry) => { loadEntry(entry); closeMobileSidebar(); }}
          onDeleteEntry={handleDeleteEntry}
          onAddFolder={handleAddFolder}
          onDeleteFolder={handleDeleteFolder}
          onExportData={handleExportData}
          onLogout={handleLogout}
          isDarkMode={theme === 'dark'}
          toggleDarkMode={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          isMobileOpen={isMobileSidebarOpen}
        />
      )}

      {/* MAIN CONTENT AREA - Mutually exclusive views */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Mobile header bar */}
        {!ui.isFullscreen && (
          <div className="mobile-header" style={{
            display: 'none',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            alignItems: 'center',
            gap: '12px',
            flexShrink: 0
          }}>
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--contrast-text)', display: 'flex', alignItems: 'center', padding: '4px' }}
              aria-label="Open menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <span style={{ fontWeight: '700', fontSize: '16px', color: 'var(--accent-primary)' }}>delulu</span>
          </div>
        )}

        {ui.view === 'journal' && (
          <JournalView
            entries={entries}
            folders={folders}
            selectedEntry={selectedEntry}
            activeFolder={ui.activeFolder}
            onRefresh={fetchData}
            onDelete={handleDeleteEntry}
            isPrivate={isPrivate}
            setIsPrivate={setIsPrivate}
          />
        )}
        {ui.view === 'calendar' && (
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: 'var(--bg-primary)' }}>
            <CalendarView
              entries={entries}
              reminders={reminders}
              onRefresh={fetchData}
            />
          </div>
        )}
        {ui.view === 'insights' && (
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: 'var(--bg-primary)' }}>
            <InsightsView entries={entries} />
          </div>
        )}
      </div>

      <CommandMenu view={ui.view} setView={ui.setView} theme={theme} setTheme={setTheme} />

      {/* Shared Delete Modal (Used for Entries and Folders) */}
      <DeleteConfirmModal
        isOpen={entryDeleteModal.isOpen || !!deleteConfirmation}
        onClose={() => {
          setEntryDeleteModal(prev => ({ ...prev, isOpen: false }));
          setDeleteConfirmation(null);
        }}
        onConfirm={entryDeleteModal.isOpen ? confirmDeleteEntry : confirmDeleteFolder}
        title={entryDeleteModal.isOpen ? entryDeleteModal.title : 'Delete Folder?'}
        message={entryDeleteModal.isOpen ? entryDeleteModal.message : (
          deleteConfirmation ? (
            <>
              Are you sure you want to delete <strong>{deleteConfirmation.folderName}</strong>?
              {deleteConfirmation.count > 0 && (
                <span style={{ display: 'block', marginTop: '8px', color: '#ef4444' }}>
                  ⚠️ This will permanently delete {deleteConfirmation.count} entries inside.
                </span>
              )}
            </>
          ) : ''
        )}
        isDeleting={isDeletingEntry}
      />

      {/* Global Toast with Undo */}
      <ToastNotification
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onUndo={toast.undoData ? handleUndoDelete : null}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}

// Wrap entire app with providers
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
      <ThemeProvider>
        <UIProvider>
          <AppContent />
        </UIProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
};

export default AppWithAuth;