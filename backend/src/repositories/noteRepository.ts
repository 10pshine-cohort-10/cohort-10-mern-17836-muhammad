import { Pool, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../config/db';
import {
  CreateNoteRecord,
  NormalizedPartialNotePayload,
  NoteFilters,
  NoteRow,
} from '../types/models';

export type NoteQueryExecutor = Pick<Pool, 'execute'>;
export type NoteDatabasePool = NoteQueryExecutor & Partial<Pick<Pool, 'getConnection'>>;

export default class NoteRepository {
  private readonly db: NoteDatabasePool;

  constructor(dbPool: NoteDatabasePool = pool) {
    this.db = dbPool;
  }

  async findAllByUser(
    userId: string,
    { search = '', tag = '', dateFrom = '', dateTo = '' }: NoteFilters = {},
    executor: NoteQueryExecutor = this.db
  ): Promise<NoteRow[]> {
    const conditions: string[] = ['user_id = ?'];
    const params: string[] = [userId];

    if (tag && tag !== 'All') {
      conditions.push('tag = ?');
      params.push(tag);
    }

    if (search) {
      conditions.push('(title LIKE ? OR content LIKE ?)');
      const wildcard = `%${search}%`;
      params.push(wildcard, wildcard);
    }

    if (dateFrom) {
      conditions.push('DATE(updated_at) >= ?');
      params.push(dateFrom);
    }

    if (dateTo) {
      conditions.push('DATE(updated_at) <= ?');
      params.push(dateTo);
    }

    const sql = `
      SELECT id, user_id, title, content, tag, color, created_at, updated_at
      FROM notes
      WHERE ${conditions.join(' AND ')}
      ORDER BY updated_at DESC
    `;

    const [rows] = await executor.execute<NoteRow[]>(sql, params);
    return rows;
  }

  async findByIdAndUser(noteId: string, userId: string): Promise<NoteRow | null> {
    const sql = `
      SELECT id, user_id, title, content, tag, color, created_at, updated_at
      FROM notes
      WHERE id = ? AND user_id = ?
      LIMIT 1
    `;
    const [rows] = await this.db.execute<NoteRow[]>(sql, [noteId, userId]);
    return rows[0] || null;
  }

  async createNote({ id, userId, title, content, tag, color }: CreateNoteRecord): Promise<NoteRow | null> {
    const sql = `
      INSERT INTO notes (id, user_id, title, content, tag, color)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await this.db.execute(sql, [id, userId, title, content, tag, color]);
    return this.findByIdAndUser(id, userId);
  }

  async updateNote(
    noteId: string,
    userId: string,
    updates: NormalizedPartialNotePayload = {}
  ): Promise<NoteRow | null> {
    const allowedColumns: ReadonlyArray<keyof NormalizedPartialNotePayload> = [
      'title',
      'content',
      'tag',
      'color',
    ];
    const setClauses: string[] = [];
    const params: string[] = [];

    for (const column of allowedColumns) {
      const value = updates[column];
      if (Object.prototype.hasOwnProperty.call(updates, column) && value !== undefined) {
        setClauses.push(`${column} = ?`);
        params.push(value);
      }
    }

    if (setClauses.length === 0) {
      return this.findByIdAndUser(noteId, userId);
    }

    const sql = `
      UPDATE notes
      SET ${setClauses.join(', ')}
      WHERE id = ? AND user_id = ?
    `;
    params.push(noteId, userId);

    const [result] = await this.db.execute<ResultSetHeader>(sql, params);
    if (result.affectedRows === 0) {
      return null;
    }
    return this.findByIdAndUser(noteId, userId);
  }

  async deleteNote(noteId: string, userId: string): Promise<boolean> {
    const sql = `
      DELETE FROM notes
      WHERE id = ? AND user_id = ?
    `;
    const [result] = await this.db.execute<ResultSetHeader>(sql, [noteId, userId]);
    return result.affectedRows > 0;
  }

  async bulkInsertNotes(
    userId: string,
    notesList: Array<Omit<CreateNoteRecord, 'userId'>>
  ): Promise<NoteRow[]> {
    if (!Array.isArray(notesList) || notesList.length === 0) {
      return [];
    }
    if (!this.db.getConnection) {
      throw new Error('Database pool does not support transactional connections');
    }
    const connection = await this.db.getConnection();
    try {
      await connection.beginTransaction();
      const insertSql = `
        INSERT INTO notes (id, user_id, title, content, tag, color)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      for (const note of notesList) {
        await connection.execute(insertSql, [
          note.id,
          userId,
          note.title,
          note.content,
          note.tag,
          note.color,
        ]);
      }
      const rows = await this.findAllByUser(userId, {}, connection);
      await connection.commit();
      return rows;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
