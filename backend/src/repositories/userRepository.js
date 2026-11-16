const { pool } = require('../config/db');

class UserRepository {
  constructor(dbPool = pool) {
    this.db = dbPool;
  }

  async findByEmail(email) {
    const sql = `
      SELECT id, full_name, email, password_hash, created_at, updated_at
      FROM users
      WHERE email = ?
      LIMIT 1
    `;
    const [rows] = await this.db.execute(sql, [email]);
    return rows[0] || null;
  }

  async findById(id) {
    const sql = `
      SELECT id, full_name, email, created_at, updated_at
      FROM users
      WHERE id = ?
      LIMIT 1
    `;
    const [rows] = await this.db.execute(sql, [id]);
    return rows[0] || null;
  }

  async createUser({ id, fullName, email, passwordHash }) {
    const sql = `
      INSERT INTO users (id, full_name, email, password_hash)
      VALUES (?, ?, ?, ?)
    `;
    await this.db.execute(sql, [id, fullName, email, passwordHash]);
    return this.findById(id);
  }
}

module.exports = UserRepository;
