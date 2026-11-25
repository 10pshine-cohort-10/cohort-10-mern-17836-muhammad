import { RowDataPacket } from 'mysql2/promise';

export type NoteTag = 'Work' | 'Personal' | 'Ideas';

export type NoteColor =
  | '#FFFFFF'
  | '#D1F3E0'
  | '#FDEFB8'
  | '#EDE9FE'
  | '#FCE7F3'
  | '#E0F2FE';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
}

export interface JwtUserClaims {
  sub: string;
  email: string;
  fullName: string;
  iat?: number;
  exp?: number;
}

export interface UserRow extends RowDataPacket {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface PublicUserRow extends RowDataPacket {
  id: string;
  full_name: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export interface PublicUserResponse {
  id: string;
  fullName: string;
  email: string;
  createdAt: Date;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CreateUserRecord {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
}

export interface AuthResult {
  user: PublicUserResponse;
  token: string;
}

export interface NoteRow extends RowDataPacket {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tag: NoteTag;
  color: string;
  created_at: Date;
  updated_at: Date;
}

export interface NoteResponse {
  id: string;
  userId: string;
  title: string;
  content: string;
  tag: NoteTag;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteFilters {
  search?: string;
  tag?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateNoteInput {
  title: string;
  content?: string;
  tag?: string;
  color?: string;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  tag?: string;
  color?: string;
}

export interface NormalizedNotePayload {
  title: string;
  content: string;
  tag: NoteTag;
  color: NoteColor;
}

export type NormalizedPartialNotePayload = Partial<NormalizedNotePayload>;

export interface CreateNoteRecord extends NormalizedNotePayload {
  id: string;
  userId: string;
}

export type SocketEmitter = (userId: string, eventName: string, payload: unknown) => void;

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export interface ErrorResponsePayload {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ValidationErrorDetail[];
  };
}
