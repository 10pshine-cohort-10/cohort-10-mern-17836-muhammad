import { apiRequest } from './apiClient';

export function fetchNotes(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.tag && filters.tag !== 'All') params.set('tag', filters.tag);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);

  const queryString = params.toString();
  const path = queryString ? `/notes?${queryString}` : '/notes';
  return apiRequest(path, { method: 'GET' });
}

export function fetchNoteById(noteId) {
  return apiRequest(`/notes/${noteId}`, { method: 'GET' });
}

export function createNote(noteData) {
  return apiRequest('/notes', {
    method: 'POST',
    body: JSON.stringify(noteData),
  });
}

export function updateNote(noteId, noteData) {
  return apiRequest(`/notes/${noteId}`, {
    method: 'PUT',
    body: JSON.stringify(noteData),
  });
}

export function deleteNote(noteId) {
  return apiRequest(`/notes/${noteId}`, {
    method: 'DELETE',
  });
}

export function importNotesBulk(notes) {
  return apiRequest('/notes/import', {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
}
