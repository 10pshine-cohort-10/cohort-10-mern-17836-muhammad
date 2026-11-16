import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { ChevronLeft } from 'lucide-react';
import { fetchNoteById, createNote, updateNote } from '../services/notesApi';
import RichTextToolbar from '../components/RichTextToolbar';

const NOTE_COLORS = [
  { label: 'White', value: '#FFFFFF' },
  { label: 'Mint', value: '#D1F3E0' },
  { label: 'Butter', value: '#FDEFB8' },
  { label: 'Lavender', value: '#EDE9FE' },
  { label: 'Rose', value: '#FCE7F3' },
  { label: 'Sky', value: '#E0F2FE' },
];

const TAG_OPTIONS = ['Work', 'Personal', 'Ideas'];

export default function NoteEditorPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const editorRef = useRef(null);

  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('Work');
  const [color, setColor] = useState('#FFFFFF');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadExistingNote() {
      if (!isEditing) return;
      try {
        const data = await fetchNoteById(id);
        if (!active) return;
        setTitle(data.note.title);
        setTag(data.note.tag);
        setColor(data.note.color || '#FFFFFF');
        if (editorRef.current) {
          editorRef.current.innerHTML = DOMPurify.sanitize(data.note.content || '');
        }
      } catch (err) {
        if (active) setError(err.message || 'Failed to load note.');
      }
    }
    void loadExistingNote();
    return () => {
      active = false;
    };
  }, [id, isEditing]);

  const handleExecCommand = (command, value = null) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
    }
  };

  const handleSave = async () => {
    setError('');
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Please enter a note title before saving.');
      return;
    }

    const rawHtml = editorRef.current ? editorRef.current.innerHTML : '';
    const cleanHtml = DOMPurify.sanitize(rawHtml);

    try {
      setSaving(true);
      const payload = {
        title: trimmedTitle,
        content: cleanHtml,
        tag,
        color,
      };
      if (isEditing) {
        await updateNote(id, payload);
      } else {
        await createNote(payload);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Could not save note.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="editor-page" style={{ backgroundColor: color }}>
      <header className="editor-topbar" style={{ backgroundColor: '#FFFFFF' }}>
        <button
          type="button"
          className="back-link"
          onClick={() => navigate('/dashboard')}
        >
          <ChevronLeft size={18} />
          <span>Dashboard</span>
        </button>

        <div className="editor-actions">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => navigate('/dashboard')}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save note'}
          </button>
        </div>
      </header>

      <div className="editor-body">
        <div>
          {error && <div className="error-banner">{error}</div>}

          <input
            type="text"
            className="editor-title-input"
            placeholder="Note title..."
            aria-label="Note title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <RichTextToolbar onCommand={handleExecCommand} />

          <div
            ref={editorRef}
            className="rich-content-area"
            contentEditable
            role="textbox"
            aria-multiline="true"
            aria-label="Note content"
            data-placeholder="Start writing your thoughts..."
          />
        </div>

        <aside className="editor-sidebar-panel">
          <div className="editor-meta-section">
            <span className="editor-meta-label">Note colour</span>
            <div className="color-swatches">
              {NOTE_COLORS.map((swatch) => (
                <button
                  key={swatch.value}
                  type="button"
                  aria-label={`Select ${swatch.label} colour`}
                  className={`color-swatch-btn ${color === swatch.value ? 'selected' : ''}`}
                  style={{ backgroundColor: swatch.value }}
                  onClick={() => setColor(swatch.value)}
                />
              ))}
            </div>
          </div>

          <div className="editor-meta-section">
            <label className="editor-meta-label" htmlFor="note-tag-select">
              Tag
            </label>
            <select
              id="note-tag-select"
              className="form-input"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
            >
              {TAG_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </aside>
      </div>
    </div>
  );
}
