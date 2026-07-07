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
  const [rows] = await pool.query('SELECT id, name, description FROM roles WHERE deleted_at IS NULL ORDER BY id');
  return rows;
}
