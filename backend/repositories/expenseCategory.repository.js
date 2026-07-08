import { pool } from '../config/db.js';

// Fixed list per spec (Rent, Electricity, Water, Fuel, Salary, Maintenance,
// Transport, Office Supplies, Other) — seeded once in Phase 0. No CRUD UI
// for this phase since the spec's Expenses feature list doesn't call for
// managing categories, only picking from them.
export async function findAllActive() {
  const [rows] = await pool.query('SELECT id, name FROM expense_categories WHERE deleted_at IS NULL ORDER BY name');
  return rows;
}

export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM expense_categories WHERE id = ? AND deleted_at IS NULL LIMIT 1', [id]);
  return rows[0] || null;
}
