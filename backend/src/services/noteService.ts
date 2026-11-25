import { v4 as uuidv4 } from 'uuid';
import AppError from '../utils/AppError';
import { sanitizePlainText, sanitizeRichText } from '../utils/sanitizer';
import logger from '../config/logger';
import {
  CreateNoteInput,
  CreateNoteRecord,
  NormalizedNotePayload,
  NormalizedPartialNotePayload,
  NoteColor,
  NoteFilters,
  NoteResponse,
  NoteRow,
  NoteTag,
  SocketEmitter,
  UpdateNoteInput,
} from '../types/models';

const ALLOWED_TAGS = new Set<NoteTag>(['Work', 'Personal', 'Ideas']);
const ALLOWED_COLORS = new Set<NoteColor>([
  '#FFFFFF',
  '#D1F3E0',
  '#FDEFB8',
  '#EDE9FE',
  '#FCE7F3',
  '#E0F2FE',
]);

export interface NoteRepositoryContract {
  findAllByUser(userId: string, filters?: NoteFilters): Promise<NoteRow[]>;
  findByIdAndUser(noteId: string, userId: string): Promise<NoteRow | null>;
  createNote(record: CreateNoteRecord): Promise<NoteRow | null>;
  updateNote(
    noteId: string,
    userId: string,
    updates: NormalizedPartialNotePayload
  ): Promise<NoteRow | null>;
  deleteNote(noteId: string, userId: string): Promise<boolean>;
  bulkInsertNotes(
    userId: string,
    notesList: Array<Omit<CreateNoteRecord, 'userId'>>
  ): Promise<NoteRow[]>;
}

export default class NoteService {
  private readonly noteRepository: NoteRepositoryContract;
  private socketEmitter: SocketEmitter | null;

  constructor(noteRepository: NoteRepositoryContract, socketEmitter: SocketEmitter | null = null) {
    this.noteRepository = noteRepository;
    this.socketEmitter = socketEmitter;
  }

  setSocketEmitter(emitter: SocketEmitter | null): void {
    this.socketEmitter = emitter;
  }

  emitRealtimeEvent(userId: string, eventName: string, payload: unknown): void {
    if (this.socketEmitter && typeof this.socketEmitter === 'function') {
      this.socketEmitter(userId, eventName, payload);
    }
  }

  normalizeNotePayload({ title, content, tag, color }: CreateNoteInput): NormalizedNotePayload {
    const cleanTitle = sanitizePlainText(title) || 'Untitled note';
    const cleanContent = sanitizeRichText(content);
    const cleanTag: NoteTag =
      typeof tag === 'string' && ALLOWED_TAGS.has(tag as NoteTag) ? (tag as NoteTag) : 'Personal';
    const upperColor = typeof color === 'string' ? color.toUpperCase() : '#FFFFFF';
    const cleanColor: NoteColor = ALLOWED_COLORS.has(upperColor as NoteColor)
      ? (upperColor as NoteColor)
      : '#FFFFFF';

    return {
      title: cleanTitle,
      content: cleanContent,
      tag: cleanTag,
      color: cleanColor,
    };
  }

  normalizePartialNotePayload(payload: UpdateNoteInput = {}): NormalizedPartialNotePayload {
    const normalized: NormalizedPartialNotePayload = {};

    if (payload.title !== undefined) {
      normalized.title = sanitizePlainText(payload.title) || 'Untitled note';
    }
    if (payload.content !== undefined) {
      normalized.content = sanitizeRichText(payload.content);
    }
    if (payload.tag !== undefined) {
      normalized.tag = ALLOWED_TAGS.has(payload.tag as NoteTag)
        ? (payload.tag as NoteTag)
        : 'Personal';
    }
    if (payload.color !== undefined) {
      const upperColor = typeof payload.color === 'string' ? payload.color.toUpperCase() : '#FFFFFF';
      normalized.color = ALLOWED_COLORS.has(upperColor as NoteColor)
        ? (upperColor as NoteColor)
        : '#FFFFFF';
    }

    return normalized;
  }

  formatNote(row: NoteRow): NoteResponse {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      content: row.content,
      tag: row.tag,
      color: row.color,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async listNotes(userId: string, filters?: NoteFilters): Promise<NoteResponse[]> {
    const rows = await this.noteRepository.findAllByUser(userId, filters);
    return rows.map((row) => this.formatNote(row));
  }

  async getNoteById(noteId: string, userId: string): Promise<NoteResponse> {
    const row = await this.noteRepository.findByIdAndUser(noteId, userId);
    if (!row) {
      throw new AppError('Note not found', 404, 'NOTE_NOT_FOUND');
    }
    return this.formatNote(row);
  }

  async createNote(userId: string, payload: CreateNoteInput): Promise<NoteResponse> {
    const normalized = this.normalizeNotePayload(payload);
    const created = await this.noteRepository.createNote({
      id: uuidv4(),
      userId,
      ...normalized,
    });

    if (!created) {
      throw new AppError('Failed to create note', 500, 'NOTE_CREATION_FAILED');
    }

    const formatted = this.formatNote(created);
    logger.info({ userId, noteId: formatted.id }, 'Note created');
    this.emitRealtimeEvent(userId, 'note:created', formatted);
    return formatted;
  }

  async updateNote(noteId: string, userId: string, payload: UpdateNoteInput = {}): Promise<NoteResponse> {
    const normalizedUpdates = this.normalizePartialNotePayload(payload);
    const updated =
      Object.keys(normalizedUpdates).length > 0
        ? await this.noteRepository.updateNote(noteId, userId, normalizedUpdates)
        : await this.noteRepository.findByIdAndUser(noteId, userId);

    if (!updated) {
      throw new AppError('Note not found or access denied', 404, 'NOTE_NOT_FOUND');
    }

    const formatted = this.formatNote(updated);
    logger.info({ userId, noteId }, 'Note updated');
    this.emitRealtimeEvent(userId, 'note:updated', formatted);
    return formatted;
  }

  async deleteNote(noteId: string, userId: string): Promise<{ id: string }> {
    const deleted = await this.noteRepository.deleteNote(noteId, userId);
    if (!deleted) {
      throw new AppError('Note not found or access denied', 404, 'NOTE_NOT_FOUND');
    }

    logger.info({ userId, noteId }, 'Note deleted');
    this.emitRealtimeEvent(userId, 'note:deleted', { id: noteId });
    return { id: noteId };
  }

  async importNotes(userId: string, rawNotes: CreateNoteInput[]): Promise<NoteResponse[]> {
    const sanitizedItems = rawNotes.map((item) => ({
      id: uuidv4(),
      ...this.normalizeNotePayload(item),
    }));

    const allRows = await this.noteRepository.bulkInsertNotes(userId, sanitizedItems);
    const formatted = allRows.map((row) => this.formatNote(row));
    logger.info({ userId, importedCount: sanitizedItems.length }, 'Notes imported');
    this.emitRealtimeEvent(userId, 'notes:imported', { count: sanitizedItems.length });
    return formatted;
  }
}
