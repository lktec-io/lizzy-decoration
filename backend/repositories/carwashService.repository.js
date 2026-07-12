import { pool } from '../config/db.js';

export async function findAllActive() {
  const [rows] = await pool.query("SELECT id, name, price FROM carwash_services WHERE status = 'active' ORDER BY name");
  return rows;
}

export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM carwash_services WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

export async function findByName(name) {
  const [rows] = await pool.query('SELECT id FROM carwash_services WHERE name = ? LIMIT 1', [name]);
  return rows[0] || null;
}

export async function findAll({ page = 1, limit = 20, search }) {
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('name LIKE ?');
    params.push(`%${search}%`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `SELECT * FROM carwash_services ${whereClause} ORDER BY name LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM carwash_services ${whereClause}`, params);

  return { rows, total: countRows[0].total };
}

export async function create({ name, price }) {
  const [result] = await pool.query('INSERT INTO carwash_services (name, price) VALUES (?, ?)', [name, price]);
  return findById(result.insertId);
}

export async function update(id, { name, price, status }) {
  await pool.query('UPDATE carwash_services SET name = ?, price = ?, status = ? WHERE id = ?', [name, price, status, id]);
  return findById(id);
}

// No deleted_at column on this table — status is the soft-delete mechanism,
// same convention as products/categories/brands use for their own
// active/inactive toggle, just without a separate timestamp column.
export async function setStatus(id, status) {
  await pool.query('UPDATE carwash_services SET status = ? WHERE id = ?', [status, id]);
  return findById(id);
}

export async function countTransactions(id) {
  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM carwash_transactions WHERE service_id = ?', [id]);
  return rows[0].total;
}
