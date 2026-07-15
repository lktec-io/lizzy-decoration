import { pool } from '../config/db.js';

export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM suppliers WHERE id = ? AND deleted_at IS NULL LIMIT 1', [id]);
  return rows[0] || null;
}

export async function findAllActive() {
  const [rows] = await pool.query(
    "SELECT id, name FROM suppliers WHERE status = 'active' AND deleted_at IS NULL ORDER BY name",
  );
  return rows;
}

export async function findAll({ page = 1, limit = 20, search, status }) {
  const conditions = ['deleted_at IS NULL'];
  const params = [];

  if (search) {
    conditions.push('(name LIKE ? OR phone LIKE ? OR email LIKE ?)');
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
    `SELECT * FROM suppliers ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM suppliers ${whereClause}`, params);

  return { rows, total: countRows[0].total };
}

export async function create({ name, phone, email, address, notes, tinNumber, status, userId }) {
  const [result] = await pool.query(
    'INSERT INTO suppliers (name, phone, email, address, notes, tin_number, status, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name, phone || null, email || null, address || null, notes || null, tinNumber || null, status || 'active', userId, userId],
  );
  return findById(result.insertId);
}

// status is NOT NULL with a DB default, but this UPDATE (unlike create())
// has no fallback — the simplified supplier form no longer sends status at
// all. COALESCE(?, status) preserves the existing value instead of writing
// NULL into a NOT NULL column.
export async function update(id, { name, phone, email, address, notes, tinNumber, status, userId }) {
  await pool.query(
    'UPDATE suppliers SET name = ?, phone = ?, email = ?, address = ?, notes = ?, tin_number = ?, status = COALESCE(?, status), updated_by = ? WHERE id = ?',
    [name, phone || null, email || null, address || null, notes || null, tinNumber || null, status || null, userId, id],
  );
  return findById(id);
}

export async function updateStatus(id, status, userId) {
  await pool.query('UPDATE suppliers SET status = ?, updated_by = ? WHERE id = ?', [status, userId, id]);
  return findById(id);
}

// A real DELETE. Unlike customers, purchase_orders.supplier_id and
// supplier_payments.supplier_id are both ON DELETE RESTRICT (see
// 005_create_purchases_suppliers.sql) — deleting a supplier with any
// purchase history throws ER_ROW_IS_REFERENCED_2, which the service layer
// converts into a clear 409 instead of a raw SQL error.
export async function hardDelete(id) {
  const [result] = await pool.query('DELETE FROM suppliers WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

export async function findPurchaseHistory(supplierId, { page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;
  const [rows] = await pool.query(
    `SELECT id, purchase_number, branch_id, total_amount, status, created_at
     FROM purchase_orders WHERE supplier_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [supplierId, limit, offset],
  );
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM purchase_orders WHERE supplier_id = ?', [supplierId]);
  return { rows, total };
}

export async function getBalance(supplierId) {
  const [[{ totalPurchased }]] = await pool.query(
    "SELECT COALESCE(SUM(total_amount), 0) AS totalPurchased FROM purchase_orders WHERE supplier_id = ? AND status != 'cancelled'",
    [supplierId],
  );
  const [[{ totalPaid }]] = await pool.query(
    'SELECT COALESCE(SUM(amount), 0) AS totalPaid FROM supplier_payments WHERE supplier_id = ?',
    [supplierId],
  );
  return {
    totalPurchased: Number(totalPurchased),
    totalPaid: Number(totalPaid),
    outstandingBalance: Number(totalPurchased) - Number(totalPaid),
  };
}
