import { pool } from '../config/db.js';

export async function create({ userId, tokenHash, expiresAt }) {
  const [result] = await pool.query(
    'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [userId, tokenHash, expiresAt],
  );
  return result.insertId;
}

export async function findValidByHash(tokenHash) {
  const [rows] = await pool.query(
    'SELECT * FROM password_resets WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1',
    [tokenHash],
  );
  return rows[0] || null;
}

export async function markUsed(id) {
  await pool.query('UPDATE password_resets SET used_at = NOW() WHERE id = ?', [id]);
}
