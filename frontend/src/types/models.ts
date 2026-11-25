export type NoteTag = 'Work' | 'Personal' | 'Ideas';

export type CategoryFilter = 'All' | NoteTag;

export type NavSection = 'all' | 'recent';

export type NoteColor =
  | '#FFFFFF'
  | '#D1F3E0'
  | '#FDEFB8'
  | '#EDE9FE'
  | '#FCE7F3'
  | '#E0F2FE';

export interface User {
  id: string;
  fullName: string;
  email: string;
  createdAt?: string;
}

export interface Note {
  id: string;
  userId?: string;
  title: string;
  content: string;
  tag: NoteTag;
  color: string;
  createdAt?: string;
  updatedAt: string;
}

export interface NotePayload {
  title: string;
  content: string;
  tag: NoteTag;
  color: string;
}

export type PartialNotePayload = Partial<NotePayload>;

export interface NoteFilters {
  search?: string;
  tag?: CategoryFilter | string;
  dateFrom?: string;
  dateTo?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthResponseData {
  user: User;
  token: string;
}

export interface CurrentUserResponseData {
  user: User;
}

export interface NotesListResponseData {
  notes: Note[];
}

export interface NoteSingleResponseData {
  note: Note;
}

export interface DeleteNoteResponseData {
  id: string;
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: {
    code?: string;
    message?: string;
    details?: ApiErrorDetail[];
  };
}

export interface ApiRequestError extends Error {
  status?: number;
  code?: string;
}
