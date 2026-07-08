import { pool } from '../config/db.js';

export async function findAllActive() {
  const [rows] = await pool.query("SELECT id, name, price FROM carwash_services WHERE status = 'active' ORDER BY name");
  return rows;
}

export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM carwash_services WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}
