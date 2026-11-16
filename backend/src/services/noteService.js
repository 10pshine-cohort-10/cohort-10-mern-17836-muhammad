const { v4: uuidv4 } = require('uuid');
const AppError = require('../utils/AppError');
const { sanitizePlainText, sanitizeRichText } = require('../utils/sanitizer');
const logger = require('../config/logger');

const ALLOWED_TAGS = new Set(['Work', 'Personal', 'Ideas']);
const ALLOWED_COLORS = new Set([
  '#FFFFFF',
  '#D1F3E0',
  '#FDEFB8',
  '#EDE9FE',
  '#FCE7F3',
  '#E0F2FE',
]);

class NoteService {
  constructor(noteRepository, socketEmitter = null) {
    this.noteRepository = noteRepository;
    this.socketEmitter = socketEmitter;
  }

  setSocketEmitter(emitter) {
    this.socketEmitter = emitter;
  }

  emitRealtimeEvent(userId, eventName, payload) {
    if (this.socketEmitter && typeof this.socketEmitter === 'function') {
      this.socketEmitter(userId, eventName, payload);
    }
  }

  normalizeNotePayload({ title, content, tag, color }) {
    const cleanTitle = sanitizePlainText(title) || 'Untitled note';
    const cleanContent = sanitizeRichText(content);
    const cleanTag = ALLOWED_TAGS.has(tag) ? tag : 'Personal';
    const upperColor = typeof color === 'string' ? color.toUpperCase() : '#FFFFFF';
    const cleanColor = ALLOWED_COLORS.has(upperColor) ? upperColor : '#FFFFFF';

    return {
      title: cleanTitle,
      content: cleanContent,
      tag: cleanTag,
      color: cleanColor,
    };
  }

  formatNote(row) {
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

  async listNotes(userId, filters) {
    const rows = await this.noteRepository.findAllByUser(userId, filters);
    return rows.map((row) => this.formatNote(row));
  }

  async getNoteById(noteId, userId) {
    const row = await this.noteRepository.findByIdAndUser(noteId, userId);
    if (!row) {
      throw new AppError('Note not found', 404, 'NOTE_NOT_FOUND');
    }
    return this.formatNote(row);
  }

  async createNote(userId, payload) {
    const normalized = this.normalizeNotePayload(payload);
    const created = await this.noteRepository.createNote({
      id: uuidv4(),
      userId,
      ...normalized,
    });

    const formatted = this.formatNote(created);
    logger.info({ userId, noteId: formatted.id }, 'Note created');
    this.emitRealtimeEvent(userId, 'note:created', formatted);
    return formatted;
  }

  async updateNote(noteId, userId, payload) {
    const existing = await this.noteRepository.findByIdAndUser(noteId, userId);
    if (!existing) {
      throw new AppError('Note not found or access denied', 404, 'NOTE_NOT_FOUND');
    }

    const normalized = this.normalizeNotePayload({
      title: payload.title !== undefined ? payload.title : existing.title,
      content: payload.content !== undefined ? payload.content : existing.content,
      tag: payload.tag !== undefined ? payload.tag : existing.tag,
      color: payload.color !== undefined ? payload.color : existing.color,
    });

    const updated = await this.noteRepository.updateNote(noteId, userId, normalized);
    const formatted = this.formatNote(updated);
    logger.info({ userId, noteId }, 'Note updated');
    this.emitRealtimeEvent(userId, 'note:updated', formatted);
    return formatted;
  }

  async deleteNote(noteId, userId) {
    const deleted = await this.noteRepository.deleteNote(noteId, userId);
    if (!deleted) {
      throw new AppError('Note not found or access denied', 404, 'NOTE_NOT_FOUND');
    }

    logger.info({ userId, noteId }, 'Note deleted');
    this.emitRealtimeEvent(userId, 'note:deleted', { id: noteId });
    return { id: noteId };
  }

  async importNotes(userId, rawNotes) {
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

module.exports = NoteService;
