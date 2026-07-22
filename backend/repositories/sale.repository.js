import { pool } from '../config/db.js';

// Looked up BEFORE opening a checkout transaction — a client-resubmitted
// (double-click, retried network request) checkout carrying the same key
// as one that already succeeded returns the existing sale id instead of
// creating a second one.
export async function findByIdempotencyKey(key) {
  if (!key) return null;
  const [rows] = await pool.query('SELECT id FROM sales WHERE idempotency_key = ? LIMIT 1', [key]);
  return rows[0]?.id || null;
}

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

  // p.buying_price is CURRENT cost, not a snapshot at sale time — same
  // convention report.repository.js's profitReport() already uses for
  // COGS, kept consistent here rather than introducing a second, divergent
  // way of costing a sale. sale.service.js strips this field back out of
  // the response unless the caller has permission to see profit figures.
  const [items] = await pool.query(
    `SELECT si.*, p.name AS product_name, p.code AS product_code, p.buying_price
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
    // Returns' "search by Receipt Number OR Barcode OR Product Name" needs
    // a sale search that matches on more than sale_number — this system
    // has no separate barcode column (products.code IS the barcode/SKU,
    // the same field the QR scanner already matches against), so Barcode
    // and Product Name both resolve to this one EXISTS check against that
    // sale's line items.
    conditions.push(`(s.sale_number LIKE ? OR EXISTS (
      SELECT 1 FROM sale_items si JOIN products p ON p.id = si.product_id
      WHERE si.sale_id = s.id AND (p.name LIKE ? OR p.code LIKE ?)
    ))`);
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
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
  { saleNumber, idempotencyKey, branchId, customerId, cashierId, subtotal, discountAmount, taxAmount, totalAmount, notes },
  connection,
) {
  const [result] = await connection.query(
    `INSERT INTO sales (sale_number, idempotency_key, branch_id, customer_id, cashier_id, subtotal, discount_amount, tax_amount, total_amount, notes, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')`,
    [saleNumber, idempotencyKey || null, branchId, customerId || null, cashierId, subtotal, discountAmount, taxAmount, totalAmount, notes || null],
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
