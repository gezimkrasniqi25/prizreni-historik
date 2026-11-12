import mysql from 'mysql2/promise';
import { env } from './env.js';

/**
 * Single shared pool. Every query in the project uses placeholders (`?`),
 * so user input is never concatenated into SQL (SQL-injection protection).
 */
export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  timezone: 'Z',
  dateStrings: false,
  decimalNumbers: true,
});

// Keep NOW()/CURRENT_TIMESTAMP in UTC so they agree with the dates produced by Node.
pool.pool.on('connection', (conn) => {
  conn.query("SET time_zone = '+00:00'");
});

export const query = async (sql, params = []) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

export const queryOne = async (sql, params = []) => (await query(sql, params))[0] || null;

export async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
