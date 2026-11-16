const mysql = require('mysql2/promise');
const config = require('./env');
const logger = require('./logger');

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: config.db.connectionLimit,
  queueLimit: 0,
  charset: 'utf8mb4',
});

async function verifyDatabaseConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    logger.info({ database: config.db.database }, 'MySQL connection pool established');
  } finally {
    connection.release();
  }
}

async function closeDatabasePool() {
  await pool.end();
  logger.info('MySQL connection pool closed');
}

module.exports = {
  pool,
  verifyDatabaseConnection,
  closeDatabasePool,
};
