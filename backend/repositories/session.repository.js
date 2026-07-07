import { pool } from '../config/db.js';

export async function create({ userId, refreshTokenHash, ipAddress, userAgent, deviceLabel, expiresAt }) {
  const [result] = await pool.query(
    `INSERT INTO sessions (user_id, refresh_token_hash, ip_address, user_agent, device_label, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, refreshTokenHash, ipAddress || null, userAgent || null, deviceLabel || null, expiresAt],
  );
  return result.insertId;
}

export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM sessions WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

export async function findActiveByUser(userId) {
  const [rows] = await pool.query(
    'SELECT * FROM sessions WHERE user_id = ? AND revoked_at IS NULL AND expires_at > NOW() ORDER BY created_at DESC',
    [userId],
  );
  return rows;
}

export async function updateRefreshTokenHash(id, refreshTokenHash, expiresAt) {
  await pool.query('UPDATE sessions SET refresh_token_hash = ?, expires_at = ? WHERE id = ?', [refreshTokenHash, expiresAt, id]);
}

export async function revoke(id) {
  await pool.query('UPDATE sessions SET revoked_at = NOW() WHERE id = ?', [id]);
}

export async function revokeAllForUser(userId) {
  await pool.query('UPDATE sessions SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL', [userId]);
}
