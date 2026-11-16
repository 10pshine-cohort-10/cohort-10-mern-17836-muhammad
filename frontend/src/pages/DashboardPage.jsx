import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchNotes, deleteNote, importNotesBulk } from '../services/notesApi';
import { createNoteSocket } from '../services/socketClient';
import { getGreetingByTime, getInitials } from '../utils/dateFormatter';
import { exportNotesAsJson, exportNotesAsMarkdown } from '../utils/noteFileUtils';
import Sidebar from '../components/Sidebar';
import NoteCard from '../components/NoteCard';
import ProfileModal from '../components/ProfileModal';
import ImportNotesModal from '../components/ImportNotesModal';

const CATEGORIES = ['All', 'Work', 'Personal', 'Ideas'];

export default function DashboardPage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeNav, setActiveNav] = useState('all');
  const [selectedTag, setSelectedTag] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const loadNotes = useCallback(async () => {
    try {
      setError('');
      const data = await fetchNotes({
        search: searchQuery,
        tag: selectedTag,
        dateFrom: dateFilter,
      });
      const fetched = data.notes || [];
      setNotes(activeNav === 'recent' ? fetched.slice(0, 6) : fetched);
    } catch (err) {
      setError(err.message || 'Unable to load notes.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedTag, dateFilter, activeNav]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    if (!token) return undefined;
    const socket = createNoteSocket(token);

    socket.on('note:created', (newNote) => {
      setNotes((prev) =>
        prev.some((n) => n.id === newNote.id) ? prev : [newNote, ...prev]
      );
    });

    socket.on('note:updated', (updatedNote) => {
      setNotes((prev) => prev.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
    });

    socket.on('note:deleted', ({ id }) => {
      setNotes((prev) => prev.filter((n) => n.id !== id));
    });

    socket.on('notes:imported', () => {
      loadNotes();
    });

    return () => {
      socket.disconnect();
    };
  }, [token, loadNotes]);

  const handleDeleteNote = async (noteId) => {
    try {
      await deleteNote(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err) {
      setError(err.message || 'Failed to delete note.');
    }
  };

  const handleImportNotes = async (parsedNotes) => {
    const data = await importNotesBulk(parsedNotes);
    setNotes(data.notes || []);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth', { replace: true });
  };

  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'there';

  return (
    <div className="app-shell">
      <Sidebar
        user={user}
        activeNav={activeNav}
        onSelectNav={setActiveNav}
        onExportJson={() => exportNotesAsJson(notes)}
        onExportMarkdown={() => exportNotesAsMarkdown(notes)}
        onOpenImport={() => setShowImport(true)}
        onOpenProfile={() => setShowProfile(true)}
      />

      <div style={{ flex: 1 }}>
        <header className="mobile-topbar">
          <div className="brand-logo">
            <span className="brand-icon">
              <FileText size={16} />
            </span>
            <span>Noted</span>
          </div>
          <button
            type="button"
            className="avatar-circle"
            style={{ border: 'none', cursor: 'pointer' }}
            onClick={() => setShowProfile(true)}
            aria-label="Open profile"
          >
            {getInitials(user?.fullName)}
          </button>
        </header>

        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>
                {getGreetingByTime()}, {firstName}
              </h1>
              <p>Here are your latest notes.</p>
            </div>

            <button
              type="button"
              className="btn-primary desktop-new-btn"
              onClick={() => navigate('/notes/new')}
            >
              <Plus size={16} />
              <span>New note</span>
            </button>
          </div>

          <div className="dashboard-toolbar">
            <div className="search-filter-group">
              <div className="search-box">
                <Search size={16} />
                <input
                  type="search"
                  placeholder="Search notes"
                  aria-label="Search notes"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <input
                type="date"
                className="date-filter-input"
                aria-label="Filter from date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            <div className="category-tabs" role="tablist" aria-label="Filter notes by category">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={selectedTag === category}
                  className={`category-tab ${selectedTag === category ? 'active' : ''}`}
                  onClick={() => setSelectedTag(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="error-banner">{error}</div>}

          {loading ? (
            <p style={{ color: '#6B7280' }}>Loading your notes...</p>
          ) : notes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 16px', color: '#6B7280' }}>
              <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                No notes found
              </p>
              <p style={{ fontSize: '14px', marginBottom: '18px' }}>
                Create a new note or clear your active search filters.
              </p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => navigate('/notes/new')}
              >
                <Plus size={16} />
                <span>Create note</span>
              </button>
            </div>
          ) : (
            <section className="notes-grid" aria-label="Notes list">
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={(id) => navigate(`/notes/${id}`)}
                  onDelete={handleDeleteNote}
                />
              ))}
            </section>
          )}
        </main>
      </div>

      <button
        type="button"
        className="btn-primary mobile-fab"
        onClick={() => navigate('/notes/new')}
      >
        <Plus size={16} />
        <span>New note</span>
      </button>

      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onLogout={handleLogout}
        />
      )}

      {showImport && (
        <ImportNotesModal
          onClose={() => setShowImport(false)}
          onImport={handleImportNotes}
        />
      )}
    </div>
  );
}
