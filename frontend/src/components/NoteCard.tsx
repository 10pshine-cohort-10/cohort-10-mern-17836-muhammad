import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { formatRelativeDate } from '../utils/dateFormatter';
import { stripHtmlToText } from '../utils/noteFileUtils';
import { Note } from '../types/models';

export interface NoteCardProps {
  note: Note;
  onEdit: (noteId: string) => void;
  onDelete: (noteId: string) => void | Promise<void>;
}

export default function NoteCard({
  note,
  onEdit,
  onDelete,
}: NoteCardProps): React.ReactElement {
  const previewText = stripHtmlToText(note.content);

  const handleDeleteClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    void onDelete(note.id);
  };

  const handleEditClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    onEdit(note.id);
  };

  return (
    <article
      className="note-card"
      style={{ backgroundColor: note.color || '#FFFFFF' }}
      onClick={() => onEdit(note.id)}
      data-testid={`note-card-${note.id}`}
    >
      <div>
        <div className="note-card-top">
          <span className={`tag-badge tag-${note.tag}`}>{note.tag}</span>
          <div className="note-card-actions">
            <button
              type="button"
              className="icon-btn"
              aria-label={`Edit ${note.title}`}
              onClick={handleEditClick}
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              className="icon-btn danger"
              aria-label={`Delete ${note.title}`}
              onClick={handleDeleteClick}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <h3 className="note-card-title">{note.title}</h3>
        <p className="note-card-preview">{previewText || 'No additional text'}</p>
      </div>

      <span className="note-card-date">{formatRelativeDate(note.updatedAt)}</span>
    </article>
  );
}
