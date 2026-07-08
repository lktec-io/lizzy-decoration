import { pool } from '../config/db.js';

export async function findById(id) {
  const [rows] = await pool.query(
    `SELECT s.*, b.name AS branch_name,
            c.first_name AS customer_first_name, c.last_name AS customer_last_name, c.customer_code,
            u.first_name AS cashier_first_name, u.last_name AS cashier_last_name
     FROM sales s
     JOIN branches b ON b.id = s.branch_id
     LEFT JOIN customers c ON c.id = s.customer_id
     JOIN users u ON u.id = s.cashier_id
     WHERE s.id = ? LIMIT 1`,
    [id],
  );
  if (!rows[0]) return null;

  const [items] = await pool.query(
    `SELECT si.*, p.name AS product_name, p.code AS product_code
     FROM sale_items si JOIN products p ON p.id = si.product_id
     WHERE si.sale_id = ?`,
    [id],
  );
  const [payments] = await pool.query('SELECT * FROM sale_payments WHERE sale_id = ?', [id]);

  return { ...rows[0], items, payments };
}

function branchFilter(branchIds) {
  if (!branchIds) return { clause: '', params: [] };
  if (branchIds.length === 0) return { clause: 'AND 1 = 0', params: [] };
  return { clause: 'AND s.branch_id IN (?)', params: [branchIds] };
}

export async function findAll({ page = 1, limit = 20, search, branchId, customerId, status, branchIds }) {
  const conditions = ['1 = 1'];
  const params = [];

  if (search) {
    conditions.push('s.sale_number LIKE ?');
    params.push(`%${search}%`);
  }
  if (branchId) {
    conditions.push('s.branch_id = ?');
    params.push(branchId);
  }
  if (customerId) {
    conditions.push('s.customer_id = ?');
    params.push(customerId);
  }
  if (status) {
    conditions.push('s.status = ?');
    params.push(status);
  }

  const scope = branchFilter(branchIds);
  const whereClause = `WHERE ${conditions.join(' AND ')} ${scope.clause}`;
  const offset = (page - 1) * limit;
  const allParams = [...params, ...scope.params];

  const [rows] = await pool.query(
    `SELECT s.*, b.name AS branch_name,
            c.first_name AS customer_first_name, c.last_name AS customer_last_name,
            u.first_name AS cashier_first_name, u.last_name AS cashier_last_name
     FROM sales s
     JOIN branches b ON b.id = s.branch_id
     LEFT JOIN customers c ON c.id = s.customer_id
     JOIN users u ON u.id = s.cashier_id
     ${whereClause}
     ORDER BY s.created_at DESC LIMIT ? OFFSET ?`,
    [...allParams, limit, offset],
  );

  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM sales s ${whereClause}`, allParams);

  return { rows, total: countRows[0].total };
}

export async function createSale(
  { saleNumber, branchId, customerId, cashierId, subtotal, discountAmount, taxAmount, totalAmount, notes },
  connection,
) {
  const [result] = await connection.query(
    `INSERT INTO sales (sale_number, branch_id, customer_id, cashier_id, subtotal, discount_amount, tax_amount, total_amount, notes, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')`,
    [saleNumber, branchId, customerId || null, cashierId, subtotal, discountAmount, taxAmount, totalAmount, notes || null],
  );
  return result.insertId;
}

export async function createItem({ saleId, productId, quantity, unitPrice, discountAmount, lineTotal }, connection) {
  await connection.query(
    'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, discount_amount, line_total) VALUES (?, ?, ?, ?, ?, ?)',
    [saleId, productId, quantity, unitPrice, discountAmount, lineTotal],
  );
}

export async function createPayment({ saleId, method, amount, referenceNumber }, connection) {
  await connection.query(
    'INSERT INTO sale_payments (sale_id, payment_method, amount, reference_number) VALUES (?, ?, ?, ?)',
    [saleId, method, amount, referenceNumber || null],
  );
}
