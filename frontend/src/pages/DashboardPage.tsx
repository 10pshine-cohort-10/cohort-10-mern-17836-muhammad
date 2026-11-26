import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { CategoryFilter, NavSection, Note, NotePayload } from '../types/models';

const CATEGORIES: readonly CategoryFilter[] = ['All', 'Work', 'Personal', 'Ideas'];
const RECENT_NOTES_LIMIT = 6;

function matchesActiveFilters(
  note: Note,
  selectedTag: CategoryFilter,
  searchQuery: string,
  dateFilter: string
): boolean {
  if (selectedTag !== 'All' && note.tag !== selectedTag) {
    return false;
  }

  const trimmedSearch = searchQuery.trim().toLowerCase();
  if (trimmedSearch) {
    const titleMatch = note.title.toLowerCase().includes(trimmedSearch);
    const contentMatch = note.content.toLowerCase().includes(trimmedSearch);
    if (!titleMatch && !contentMatch) {
      return false;
    }
  }

  if (dateFilter && note.updatedAt) {
    const noteDate = new Date(note.updatedAt).toISOString().slice(0, 10);
    if (noteDate < dateFilter) {
      return false;
    }
  }

  return true;
}

function sortByUpdatedDesc(notes: Note[]): Note[] {
  return [...notes].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export default function DashboardPage(): React.ReactElement {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [activeNav, setActiveNav] = useState<NavSection>('all');
  const [selectedTag, setSelectedTag] = useState<CategoryFilter>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [showImport, setShowImport] = useState<boolean>(false);

  const latestRequestIdRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      latestRequestIdRef.current += 1;
    };
  }, []);

  const loadNotes = useCallback(async (): Promise<void> => {
    const requestId = ++latestRequestIdRef.current;
    setLoading(true);
    setError('');

    try {
      const data = await fetchNotes({
        search: searchQuery,
        tag: selectedTag,
        dateFrom: dateFilter,
      });

      if (!isMountedRef.current || requestId !== latestRequestIdRef.current) {
        return;
      }

      const fetched = data.notes || [];
      setNotes(activeNav === 'recent' ? fetched.slice(0, RECENT_NOTES_LIMIT) : fetched);
    } catch (err) {
      if (!isMountedRef.current || requestId !== latestRequestIdRef.current) {
        return;
      }

      const message = err instanceof Error ? err.message : 'Unable to load notes.';
      setError(message);
    } finally {
      if (isMountedRef.current && requestId === latestRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [searchQuery, selectedTag, dateFilter, activeNav]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    if (!token) return undefined;
    const socket = createNoteSocket(token);

    socket.on('note:created', (newNote: Note) => {
      if (!matchesActiveFilters(newNote, selectedTag, searchQuery, dateFilter)) {
        return;
      }
      setNotes((prev) => {
        if (prev.some((n) => n.id === newNote.id)) {
          return prev;
        }
        const ordered = sortByUpdatedDesc([newNote, ...prev]);
        return activeNav === 'recent' ? ordered.slice(0, RECENT_NOTES_LIMIT) : ordered;
      });
    });

    socket.on('note:updated', (updatedNote: Note) => {
      const matches = matchesActiveFilters(updatedNote, selectedTag, searchQuery, dateFilter);
      if (!matches) {
        setNotes((prev) => prev.filter((n) => n.id !== updatedNote.id));
        if (activeNav === 'recent') {
          void loadNotes();
        }
        return;
      }

      setNotes((prev) => {
        const exists = prev.some((n) => n.id === updatedNote.id);
        if (!exists) {
          void loadNotes();
          return prev;
        }
        const ordered = sortByUpdatedDesc(
          prev.map((n) => (n.id === updatedNote.id ? updatedNote : n))
        );
        return activeNav === 'recent' ? ordered.slice(0, RECENT_NOTES_LIMIT) : ordered;
      });
    });

    socket.on('note:deleted', ({ id }: { id: string }) => {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (activeNav === 'recent') {
        void loadNotes();
      }
    });

    socket.on('notes:imported', () => {
      void loadNotes();
    });

    return () => {
      socket.disconnect();
    };
  }, [token, loadNotes, selectedTag, searchQuery, dateFilter, activeNav]);

  const handleDeleteNote = async (noteId: string): Promise<void> => {
    try {
      await deleteNote(noteId);
      if (!isMountedRef.current) return;
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      if (activeNav === 'recent') {
        void loadNotes();
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      const message = err instanceof Error ? err.message : 'Failed to delete note.';
      setError(message);
    }
  };

  const handleImportNotes = async (parsedNotes: NotePayload[]): Promise<void> => {
    await importNotesBulk(parsedNotes);
    if (!isMountedRef.current) return;
    await loadNotes();
  };

  const handleLogout = async (): Promise<void> => {
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchQuery(e.target.value)
                  }
                />
              </div>

              <input
                type="date"
                className="date-filter-input"
                aria-label="Filter from date"
                value={dateFilter}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDateFilter(e.target.value)
                }
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
                  onEdit={(id: string) => navigate(`/notes/${id}`)}
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
