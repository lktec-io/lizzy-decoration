import { pool } from '../config/db.js';

const BASE_SELECT = `
  SELECT b.*, m.first_name AS manager_first_name, m.last_name AS manager_last_name
  FROM branches b
  LEFT JOIN users m ON m.id = b.manager_id
`;

export async function findAllActive() {
  const [rows] = await pool.query(
    "SELECT id, name, code FROM branches WHERE status = 'active' AND deleted_at IS NULL ORDER BY name",
  );
  return rows;
}

export async function findById(id) {
  const [rows] = await pool.query(`${BASE_SELECT} WHERE b.id = ? AND b.deleted_at IS NULL LIMIT 1`, [id]);
  return rows[0] || null;
}

export async function findByCode(code) {
  const [rows] = await pool.query('SELECT id, code FROM branches WHERE code = ? AND deleted_at IS NULL LIMIT 1', [code]);
  return rows[0] || null;
}

export async function findAll({ page = 1, limit = 20, search, status }) {
  const conditions = ['b.deleted_at IS NULL'];
  const params = [];

  if (search) {
    conditions.push('(b.name LIKE ? OR b.code LIKE ? OR b.region LIKE ? OR b.district LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }
  if (status) {
    conditions.push('b.status = ?');
    params.push(status);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `${BASE_SELECT} ${whereClause} ORDER BY b.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM branches b ${whereClause}`, params);

  return { rows, total: countRows[0].total };
}

export async function create(data) {
  const [result] = await pool.query(
    `INSERT INTO branches (name, code, manager_id, phone, email, address, region, district, opening_date, status, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name, data.code, data.managerId || null, data.phone || null, data.email || null,
      data.address || null, data.region || null, data.district || null, data.openingDate || null,
      data.status || 'active', data.userId, data.userId,
    ],
  );
  return findById(result.insertId);
}

export async function update(id, data) {
  await pool.query(
    `UPDATE branches SET name = ?, code = ?, manager_id = ?, phone = ?, email = ?, address = ?,
       region = ?, district = ?, opening_date = ?, updated_by = ? WHERE id = ?`,
    [
      data.name, data.code, data.managerId || null, data.phone || null, data.email || null,
      data.address || null, data.region || null, data.district || null, data.openingDate || null,
      data.userId, id,
    ],
  );
  return findById(id);
}

export async function updateStatus(id, status, userId) {
  await pool.query('UPDATE branches SET status = ?, updated_by = ? WHERE id = ?', [status, userId, id]);
  return findById(id);
}

export async function countUsersAssigned(id) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS total FROM users WHERE branch_id = ? AND deleted_at IS NULL',
    [id],
  );
  return rows[0].total;
}
