import { apiRequest } from './apiClient';
import {
  DeleteNoteResponseData,
  NoteFilters,
  NotePayload,
  NoteSingleResponseData,
  NotesListResponseData,
  PartialNotePayload,
} from '../types/models';

export function fetchNotes(filters: NoteFilters = {}): Promise<NotesListResponseData> {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.tag && filters.tag !== 'All') params.set('tag', filters.tag);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);

  const queryString = params.toString();
  const path = queryString ? `/notes?${queryString}` : '/notes';
  return apiRequest<NotesListResponseData>(path, { method: 'GET' });
}

export function fetchNoteById(noteId: string): Promise<NoteSingleResponseData> {
  return apiRequest<NoteSingleResponseData>(`/notes/${noteId}`, { method: 'GET' });
}

export function createNote(noteData: NotePayload): Promise<NoteSingleResponseData> {
  return apiRequest<NoteSingleResponseData>('/notes', {
    method: 'POST',
    body: JSON.stringify(noteData),
  });
}

export function updateNote(
  noteId: string,
  noteData: PartialNotePayload
): Promise<NoteSingleResponseData> {
  return apiRequest<NoteSingleResponseData>(`/notes/${noteId}`, {
    method: 'PUT',
    body: JSON.stringify(noteData),
  });
}

export function deleteNote(noteId: string): Promise<DeleteNoteResponseData> {
  return apiRequest<DeleteNoteResponseData>(`/notes/${noteId}`, {
    method: 'DELETE',
  });
}

export function importNotesBulk(notes: NotePayload[]): Promise<NotesListResponseData> {
  return apiRequest<NotesListResponseData>('/notes/import', {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
}
