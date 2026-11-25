import { Pool } from 'mysql2/promise';
import { pool } from '../config/db';
import { CreateUserRecord, PublicUserRow, UserRow } from '../types/models';

export type UserDatabasePool = Pick<Pool, 'execute'>;

export default class UserRepository {
  private readonly db: UserDatabasePool;

  constructor(dbPool: UserDatabasePool = pool) {
    this.db = dbPool;
  }

  async findByEmail(email: string): Promise<UserRow | null> {
    const sql = `
      SELECT id, full_name, email, password_hash, created_at, updated_at
      FROM users
      WHERE email = ?
      LIMIT 1
    `;
    const [rows] = await this.db.execute<UserRow[]>(sql, [email]);
    return rows[0] || null;
  }

  async findById(id: string): Promise<PublicUserRow | null> {
    const sql = `
      SELECT id, full_name, email, created_at, updated_at
      FROM users
      WHERE id = ?
      LIMIT 1
    `;
    const [rows] = await this.db.execute<PublicUserRow[]>(sql, [id]);
    return rows[0] || null;
  }

  async createUser({ id, fullName, email, passwordHash }: CreateUserRecord): Promise<PublicUserRow | null> {
    const sql = `
      INSERT INTO users (id, full_name, email, password_hash)
      VALUES (?, ?, ?, ?)
    `;
    await this.db.execute(sql, [id, fullName, email, passwordHash]);
    return this.findById(id);
  }
}
