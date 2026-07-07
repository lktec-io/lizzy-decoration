import { pool } from '../config/db.js';

export async function findByName(name) {
  const [rows] = await pool.query('SELECT * FROM roles WHERE name = ? AND deleted_at IS NULL LIMIT 1', [name]);
  return rows[0] || null;
}

export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM roles WHERE id = ? AND deleted_at IS NULL LIMIT 1', [id]);
  return rows[0] || null;
}

export async function findAll() {
  const [rows] = await pool.query(
    'SELECT id, name, description, is_system FROM roles WHERE deleted_at IS NULL ORDER BY id',
  );
  return rows;
}

export async function create({ name, description, userId }) {
  const [result] = await pool.query(
    'INSERT INTO roles (name, description, is_system, created_by, updated_by) VALUES (?, ?, FALSE, ?, ?)',
    [name, description || null, userId, userId],
  );
  return findById(result.insertId);
}

export async function update(id, { name, description, userId }) {
  await pool.query(
    'UPDATE roles SET name = ?, description = ?, updated_by = ? WHERE id = ?',
    [name, description || null, userId, id],
  );
  return findById(id);
}

export async function softDelete(id, userId) {
  await pool.query('UPDATE roles SET deleted_at = NOW(), updated_by = ? WHERE id = ?', [userId, id]);
}

export async function countUsersWithRole(id) {
  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM users WHERE role_id = ? AND deleted_at IS NULL', [id]);
  return rows[0].total;
}
