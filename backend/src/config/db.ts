import mysql, { Pool, PoolOptions } from 'mysql2/promise';
import config from './env';
import logger from './logger';

const poolOptions: PoolOptions = {
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: config.db.connectionLimit,
  queueLimit: 0,
  charset: 'utf8mb4',
};

export const pool: Pool = mysql.createPool(poolOptions);

export async function verifyDatabaseConnection(): Promise<void> {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    logger.info({ database: config.db.database }, 'MySQL connection pool established');
  } finally {
    connection.release();
  }
}

export async function closeDatabasePool(): Promise<void> {
  await pool.end();
  logger.info('MySQL connection pool closed');
}
