import { pool } from '../config/db.js';

export async function create({ userId, sessionId, tokenHash, expiresAt }) {
  const [result] = await pool.query(
    'INSERT INTO refresh_tokens (user_id, session_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
    [userId, sessionId, tokenHash, expiresAt],
  );
  return result.insertId;
}

export async function findValidByHash(tokenHash) {
  const [rows] = await pool.query(
    'SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > NOW() LIMIT 1',
    [tokenHash],
  );
  return rows[0] || null;
}

export async function revoke(id) {
  await pool.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = ?', [id]);
}

export async function revokeAllForUser(userId) {
  await pool.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL', [userId]);
}

export async function revokeAllForSession(sessionId) {
  await pool.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE session_id = ? AND revoked_at IS NULL', [sessionId]);
}
