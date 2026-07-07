import { pool } from '../config/db.js';

export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM brands WHERE id = ? AND deleted_at IS NULL LIMIT 1', [id]);
  return rows[0] || null;
}

export async function findByName(name) {
  const [rows] = await pool.query('SELECT id, name FROM brands WHERE name = ? AND deleted_at IS NULL LIMIT 1', [name]);
  return rows[0] || null;
}

export async function findByCode(code) {
  const [rows] = await pool.query('SELECT id, code FROM brands WHERE code = ? AND deleted_at IS NULL LIMIT 1', [code]);
  return rows[0] || null;
}

export async function findAllActive() {
  const [rows] = await pool.query(
    "SELECT id, name, code FROM brands WHERE status = 'active' AND deleted_at IS NULL ORDER BY name",
  );
  return rows;
}

export async function findAll({ page = 1, limit = 20, search, status }) {
  const conditions = ['deleted_at IS NULL'];
  const params = [];

  if (search) {
    conditions.push('(name LIKE ? OR code LIKE ? OR country LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `SELECT * FROM brands ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM brands ${whereClause}`, params);

  return { rows, total: countRows[0].total };
}

export async function create({ name, code, description, country, status, userId }) {
  const [result] = await pool.query(
    'INSERT INTO brands (name, code, description, country, status, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, code, description || null, country || null, status || 'active', userId, userId],
  );
  return findById(result.insertId);
}

export async function update(id, { name, code, description, country, status, userId }) {
  await pool.query(
    'UPDATE brands SET name = ?, code = ?, description = ?, country = ?, status = ?, updated_by = ? WHERE id = ?',
    [name, code, description || null, country || null, status, userId, id],
  );
  return findById(id);
}

export async function softDelete(id, userId) {
  await pool.query('UPDATE brands SET deleted_at = NOW(), updated_by = ? WHERE id = ?', [userId, id]);
}

export async function countProducts(id) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS total FROM products WHERE brand_id = ? AND deleted_at IS NULL',
    [id],
  );
  return rows[0].total;
}
