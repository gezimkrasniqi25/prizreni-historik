import { query } from '../config/db.js';

/** Records an entry in the user's personal activity history. Never throws. */
export async function logActivity(userId, action, monumentId = null) {
  try {
    await query('INSERT INTO user_activity (user_id, action, monument_id) VALUES (?, ?, ?)', [userId, action, monumentId]);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[activity] failed to log', err.message);
  }
}
