const { pool } = require('../config/db');

class NoteRepository {
  constructor(dbPool = pool) {
    this.db = dbPool;
  }

  async findAllByUser(userId, { search = '', tag = '', dateFrom = '', dateTo = '' } = {}) {
    const conditions = ['user_id = ?'];
    const params = [userId];

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

    const [rows] = await this.db.execute(sql, params);
    return rows;
  }

  async findByIdAndUser(noteId, userId) {
    const sql = `
      SELECT id, user_id, title, content, tag, color, created_at, updated_at
      FROM notes
      WHERE id = ? AND user_id = ?
      LIMIT 1
    `;
    const [rows] = await this.db.execute(sql, [noteId, userId]);
    return rows[0] || null;
  }

  async createNote({ id, userId, title, content, tag, color }) {
    const sql = `
      INSERT INTO notes (id, user_id, title, content, tag, color)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await this.db.execute(sql, [id, userId, title, content, tag, color]);
    return this.findByIdAndUser(id, userId);
  }

  async updateNote(noteId, userId, { title, content, tag, color }) {
    const sql = `
      UPDATE notes
      SET title = ?, content = ?, tag = ?, color = ?
      WHERE id = ? AND user_id = ?
    `;
    const [result] = await this.db.execute(sql, [title, content, tag, color, noteId, userId]);
    if (result.affectedRows === 0) {
      return null;
    }
    return this.findByIdAndUser(noteId, userId);
  }

  async deleteNote(noteId, userId) {
    const sql = `
      DELETE FROM notes
      WHERE id = ? AND user_id = ?
    `;
    const [result] = await this.db.execute(sql, [noteId, userId]);
    return result.affectedRows > 0;
  }

  async bulkInsertNotes(userId, notesList) {
    if (!Array.isArray(notesList) || notesList.length === 0) {
      return [];
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
      await connection.commit();
      return this.findAllByUser(userId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = NoteRepository;
