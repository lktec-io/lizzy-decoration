import { pool } from '../config/db.js';

export async function findAllActive() {
  const [rows] = await pool.query(
    "SELECT id, name, code FROM branches WHERE status = 'active' AND deleted_at IS NULL ORDER BY name",
  );
  return rows;
}

export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM branches WHERE id = ? AND deleted_at IS NULL LIMIT 1', [id]);
  return rows[0] || null;
}
