import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { ChevronLeft } from 'lucide-react';
import { fetchNoteById, createNote, updateNote } from '../services/notesApi';
import RichTextToolbar from '../components/RichTextToolbar';
import { NoteColor, NotePayload, NoteTag } from '../types/models';

interface ColorOption {
  label: string;
  value: NoteColor;
}

const NOTE_COLORS: readonly ColorOption[] = [
  { label: 'White', value: '#FFFFFF' },
  { label: 'Mint', value: '#D1F3E0' },
  { label: 'Butter', value: '#FDEFB8' },
  { label: 'Lavender', value: '#EDE9FE' },
  { label: 'Rose', value: '#FCE7F3' },
  { label: 'Sky', value: '#E0F2FE' },
];

const TAG_OPTIONS: readonly NoteTag[] = ['Work', 'Personal', 'Ideas'];

export default function NoteEditorPage(): React.ReactElement {
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const editorRef = useRef<HTMLDivElement | null>(null);

  const [title, setTitle] = useState<string>('');
  const [tag, setTag] = useState<NoteTag>('Work');
  const [color, setColor] = useState<string>('#FFFFFF');
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let active = true;
    async function loadExistingNote(): Promise<void> {
      if (!isEditing || !id) return;
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
        if (active) {
          const message = err instanceof Error ? err.message : 'Failed to load note.';
          setError(message);
        }
      }
    }
    void loadExistingNote();
    return () => {
      active = false;
    };
  }, [id, isEditing]);

  const handleExecCommand = (command: string, value?: string): void => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
    }
  };

  const handleSave = async (): Promise<void> => {
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
      const payload: NotePayload = {
        title: trimmedTitle,
        content: cleanHtml,
        tag,
        color,
      };
      if (isEditing && id) {
        await updateNote(id, payload);
      } else {
        await createNote(payload);
      }
      navigate('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save note.';
      setError(message);
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
            onClick={() => void handleSave()}
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
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
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setTag(e.target.value as NoteTag)
              }
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
