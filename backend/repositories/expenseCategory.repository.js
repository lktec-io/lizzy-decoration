import { pool } from '../config/db.js';

export async function findAllActive() {
  const [rows] = await pool.query('SELECT id, name FROM expense_categories WHERE deleted_at IS NULL ORDER BY name');
  return rows;
}

export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM expense_categories WHERE id = ? AND deleted_at IS NULL LIMIT 1', [id]);
  return rows[0] || null;
}

export async function findByName(name) {
  const [rows] = await pool.query('SELECT id FROM expense_categories WHERE name = ? AND deleted_at IS NULL LIMIT 1', [name]);
  return rows[0] || null;
}

export async function findAll({ page = 1, limit = 20, search }) {
  const conditions = ['deleted_at IS NULL'];
  const params = [];

  if (search) {
    conditions.push('name LIKE ?');
    params.push(`%${search}%`);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `SELECT * FROM expense_categories ${whereClause} ORDER BY name LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM expense_categories ${whereClause}`, params);

  return { rows, total: countRows[0].total };
}

export async function create({ name }) {
  const [result] = await pool.query('INSERT INTO expense_categories (name) VALUES (?)', [name]);
  return findById(result.insertId);
}

export async function update(id, { name }) {
  await pool.query('UPDATE expense_categories SET name = ? WHERE id = ?', [name, id]);
  return findById(id);
}

export async function softDelete(id) {
  await pool.query('UPDATE expense_categories SET deleted_at = NOW() WHERE id = ?', [id]);
}

export async function countExpenses(id) {
  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM expenses WHERE expense_category_id = ?', [id]);
  return rows[0].total;
}
