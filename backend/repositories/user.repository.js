import { pool } from '../config/db.js';

const BASE_SELECT = `
  SELECT u.id, u.first_name, u.last_name, u.gender, u.phone, u.email, u.username,
         u.password_hash, u.role_id, u.branch_id, u.avatar_path, u.status,
         u.failed_login_attempts, u.locked_until, u.last_login_at,
         u.created_at, u.updated_at, u.deleted_at,
         r.name AS role_name,
         b.name AS branch_name
  FROM users u
  JOIN roles r ON r.id = u.role_id
  LEFT JOIN branches b ON b.id = u.branch_id
`;

export async function findByEmailOrUsername(identifier) {
  const [rows] = await pool.query(
    `${BASE_SELECT} WHERE (u.email = ? OR u.username = ?) AND u.deleted_at IS NULL LIMIT 1`,
    [identifier, identifier],
  );
  return rows[0] || null;
}

export async function findById(id) {
  const [rows] = await pool.query(`${BASE_SELECT} WHERE u.id = ? AND u.deleted_at IS NULL LIMIT 1`, [id]);
  return rows[0] || null;
}

export async function create({ firstName, lastName, gender, phone, email, username, passwordHash, roleId, branchId }) {
  const [result] = await pool.query(
    `INSERT INTO users (first_name, last_name, gender, phone, email, username, password_hash, role_id, branch_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [firstName, lastName, gender || null, phone, email, username, passwordHash, roleId, branchId || null],
  );
  return findById(result.insertId);
}

export async function incrementFailedAttemptsAndMaybeLock(id, maxAttempts, lockMinutes) {
  await pool.query(
    `UPDATE users
     SET failed_login_attempts = failed_login_attempts + 1,
         locked_until = IF(failed_login_attempts + 1 >= ?, DATE_ADD(NOW(), INTERVAL ? MINUTE), locked_until)
     WHERE id = ?`,
    [maxAttempts, lockMinutes, id],
  );
}

export async function resetFailedAttempts(id) {
  await pool.query('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?', [id]);
}

export async function updateLastLogin(id) {
  await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [id]);
}

export async function updatePasswordHash(id, passwordHash) {
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);
}
