/**
 * Creates the database and all tables from database/schema.sql.
 * WARNING: drops and recreates the tables (use only for first setup / reset).
 */
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { env, SERVER_ROOT } from '../src/config/env.js';

const sql = fs.readFileSync(path.join(SERVER_ROOT, 'database', 'schema.sql'), 'utf8').replace(/`prizren_heritage`/g, `\`${env.db.database}\``);

const conn = await mysql.createConnection({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  multipleStatements: true,
});

try {
  await conn.query(sql);
  console.log(`Database "${env.db.database}" is ready (schema applied).`);
} catch (err) {
  console.error('Failed to apply schema:', err.message);
  process.exitCode = 1;
} finally {
  await conn.end();
}
