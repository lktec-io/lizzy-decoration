import { pool } from '../config/db.js';

export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM customers WHERE id = ? AND deleted_at IS NULL LIMIT 1', [id]);
  return rows[0] || null;
}

export async function findAllActive() {
  const [rows] = await pool.query(
    `SELECT id, customer_code, first_name, last_name, business_name, phone, customer_type
     FROM customers WHERE status = 'active' AND deleted_at IS NULL ORDER BY first_name, last_name`,
  );
  return rows;
}

export async function findAll({ page = 1, limit = 20, search, customerType, status }) {
  const conditions = ['deleted_at IS NULL'];
  const params = [];

  if (search) {
    conditions.push('(first_name LIKE ? OR last_name LIKE ? OR business_name LIKE ? OR phone LIKE ? OR customer_code LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term, term, term);
  }
  if (customerType) {
    conditions.push('customer_type = ?');
    params.push(customerType);
  }
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `SELECT * FROM customers ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM customers ${whereClause}`, params);

  return { rows, total: countRows[0].total };
}

export async function create({
  customerCode, firstName, lastName, businessName, phone, altPhone, email,
  address, region, district, tinNumber, customerType, status, userId,
}) {
  const [result] = await pool.query(
    `INSERT INTO customers
       (customer_code, first_name, last_name, business_name, phone, alt_phone, email,
        address, region, district, tin_number, customer_type, status, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      customerCode, firstName, lastName, businessName || null, phone, altPhone || null, email || null,
      address || null, region || null, district || null, tinNumber || null,
      customerType || 'walk_in', status || 'active', userId, userId,
    ],
  );
  return findById(result.insertId);
}

export async function update(id, {
  firstName, lastName, businessName, phone, altPhone, email,
  address, region, district, tinNumber, customerType, status, userId,
}) {
  await pool.query(
    `UPDATE customers SET
       first_name = ?, last_name = ?, business_name = ?, phone = ?, alt_phone = ?, email = ?,
       address = ?, region = ?, district = ?, tin_number = ?, customer_type = ?, status = ?, updated_by = ?
     WHERE id = ?`,
    [
      firstName, lastName, businessName || null, phone, altPhone || null, email || null,
      address || null, region || null, district || null, tinNumber || null,
      customerType, status, userId, id,
    ],
  );
  return findById(id);
}

export async function updateStatus(id, status, userId) {
  await pool.query('UPDATE customers SET status = ?, updated_by = ? WHERE id = ?', [status, userId, id]);
  return findById(id);
}

// A real DELETE, not a status/deleted_at change — sales.customer_id and
// returns.customer_id are both ON DELETE SET NULL (see
// 006_create_sales_pos.sql), so this always succeeds even for a customer
// with transaction history; those rows just lose the customer link instead
// of blocking the delete.
export async function hardDelete(id) {
  const [result] = await pool.query('DELETE FROM customers WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

export async function findPurchaseHistory(customerId, { page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;
  const [rows] = await pool.query(
    `SELECT id, sale_number, branch_id, total_amount, status, created_at
     FROM sales WHERE customer_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [customerId, limit, offset],
  );
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM sales WHERE customer_id = ?', [customerId]);
  return { rows, total };
}

export async function findReturnHistory(customerId, { page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;
  const [rows] = await pool.query(
    `SELECT id, return_number, sale_id, reason, status, refund_amount, refund_status, created_at
     FROM returns WHERE customer_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [customerId, limit, offset],
  );
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM returns WHERE customer_id = ?', [customerId]);
  return { rows, total };
}

export async function getStatistics(customerId) {
  const [[sales]] = await pool.query(
    `SELECT COUNT(*) AS totalOrders, COALESCE(SUM(total_amount), 0) AS totalSpent
     FROM sales WHERE customer_id = ? AND status != 'voided'`,
    [customerId],
  );
  const [[returns]] = await pool.query('SELECT COUNT(*) AS totalReturns FROM returns WHERE customer_id = ?', [customerId]);

  return {
    totalOrders: Number(sales.totalOrders),
    totalSpent: Number(sales.totalSpent),
    totalReturns: Number(returns.totalReturns),
  };
}
