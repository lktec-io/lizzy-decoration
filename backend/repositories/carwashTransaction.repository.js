import { pool } from '../config/db.js';

const BASE_SELECT = `
  SELECT ct.*, v.plate_number, v.customer_name, v.phone,
         cs.name AS service_name, b.name AS branch_name,
         u.first_name AS served_by_first_name, u.last_name AS served_by_last_name
  FROM carwash_transactions ct
  JOIN vehicles v ON v.id = ct.vehicle_id
  JOIN carwash_services cs ON cs.id = ct.service_id
  JOIN branches b ON b.id = ct.branch_id
  JOIN users u ON u.id = ct.served_by
`;

export async function findById(id) {
  const [rows] = await pool.query(`${BASE_SELECT} WHERE ct.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

function branchFilter(branchIds) {
  if (!branchIds) return { clause: '', params: [] };
  if (branchIds.length === 0) return { clause: 'AND 1 = 0', params: [] };
  return { clause: 'AND ct.branch_id IN (?)', params: [branchIds] };
}

export async function findAll({ page = 1, limit = 20, search, serviceId, branchId, dateFrom, dateTo, branchIds }) {
  const conditions = ['1 = 1'];
  const params = [];

  if (search) {
    conditions.push('(v.plate_number LIKE ? OR v.customer_name LIKE ? OR v.phone LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  if (serviceId) {
    conditions.push('ct.service_id = ?');
    params.push(serviceId);
  }
  if (branchId) {
    conditions.push('ct.branch_id = ?');
    params.push(branchId);
  }
  if (dateFrom) {
    conditions.push('DATE(ct.created_at) >= ?');
    params.push(dateFrom);
  }
  if (dateTo) {
    conditions.push('DATE(ct.created_at) <= ?');
    params.push(dateTo);
  }

  const scope = branchFilter(branchIds);
  const whereClause = `WHERE ${conditions.join(' AND ')} ${scope.clause}`;
  const offset = (page - 1) * limit;
  const allParams = [...params, ...scope.params];

  const [rows] = await pool.query(
    `${BASE_SELECT} ${whereClause} ORDER BY ct.created_at DESC LIMIT ? OFFSET ?`,
    [...allParams, limit, offset],
  );
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM carwash_transactions ct JOIN vehicles v ON v.id = ct.vehicle_id ${whereClause}`, allParams);
  const [[{ totalAmount }]] = await pool.query(
    `SELECT COALESCE(SUM(ct.amount), 0) AS totalAmount FROM carwash_transactions ct JOIN vehicles v ON v.id = ct.vehicle_id ${whereClause}`,
    allParams,
  );

  return { rows, total: countRows[0].total, totalAmount: Number(totalAmount) };
}

export async function create({ vehicleId, serviceId, branchId, amount, paymentMethod, servedBy }) {
  const [result] = await pool.query(
    `INSERT INTO carwash_transactions (vehicle_id, service_id, branch_id, amount, payment_method, served_by, status)
     VALUES (?, ?, ?, ?, ?, ?, 'completed')`,
    [vehicleId, serviceId, branchId, amount, paymentMethod, servedBy],
  );
  return findById(result.insertId);
}

export async function update(id, { vehicleId, serviceId, branchId, amount, paymentMethod }) {
  await pool.query(
    `UPDATE carwash_transactions
     SET vehicle_id = ?, service_id = ?, branch_id = ?, amount = ?, payment_method = ?
     WHERE id = ?`,
    [vehicleId, serviceId, branchId, amount, paymentMethod, id],
  );
  return findById(id);
}

// A real DELETE, not a status flag — carwash_transactions has no
// deleted_at column and no downstream table references it (see
// 009_create_carwash.sql), so this is unconditionally safe with no FK
// violation case to catch, unlike suppliers' hard delete.
export async function hardDelete(id) {
  const [result] = await pool.query('DELETE FROM carwash_transactions WHERE id = ?', [id]);
  return result.affectedRows > 0;
}
