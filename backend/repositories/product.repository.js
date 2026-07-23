import { pool } from '../config/db.js';

// brands is a LEFT JOIN — brand is optional per-product (see the 013
// migration), and an INNER JOIN here would silently drop any product with
// no brand from every list/detail query the moment brand_id went NULL.
const BASE_SELECT = `
  SELECT p.*, c.name AS category_name, b.name AS brand_name
  FROM products p
  JOIN categories c ON c.id = p.category_id
  LEFT JOIN brands b ON b.id = p.brand_id
`;

export async function findById(id) {
  const [rows] = await pool.query(`${BASE_SELECT} WHERE p.id = ? AND p.deleted_at IS NULL LIMIT 1`, [id]);
  if (!rows[0]) return null;

  const [images] = await pool.query(
    'SELECT id, image_path, is_primary, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order',
    [id],
  );
  return { ...rows[0], images };
}

export async function findByCode(code) {
  const [rows] = await pool.query('SELECT id, code FROM products WHERE code = ? AND deleted_at IS NULL LIMIT 1', [code]);
  return rows[0] || null;
}

// Purpose-built read for the POS product grid: active products joined with
// their stock at one specific branch. Kept separate from findAll() (which
// backs the Products admin list and has a different shape/purpose) and from
// inventory.repository's findAll() (which backs the Inventory admin list).
export async function findSellable({ branchId, search, categoryId, limit = 60 }) {
  const conditions = ["p.deleted_at IS NULL", "p.status = 'active'"];
  const params = [];

  if (search) {
    conditions.push('(p.name LIKE ? OR p.code LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term);
  }
  if (categoryId) {
    conditions.push('p.category_id = ?');
    params.push(categoryId);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const [rows] = await pool.query(
    `SELECT p.id, p.name, p.code, p.selling_price, p.category_id, c.name AS category_name,
            p.brand_id, b.name AS brand_name,
            COALESCE(i.quantity - i.reserved_quantity, 0) AS available_quantity
     FROM products p
     JOIN categories c ON c.id = p.category_id
     LEFT JOIN brands b ON b.id = p.brand_id
     LEFT JOIN inventory i ON i.product_id = p.id AND i.branch_id = ?
     ${whereClause}
     ORDER BY p.name
     LIMIT ?`,
    [branchId, ...params, limit],
  );
  return rows;
}

// Barcode-scan lookup — a genuinely different query from findSellable()'s
// `search`, which does a fuzzy `LIKE '%...%'` across both name and code and
// was never meant to resolve a single scanned value with certainty. This is
// an exact match on the one column that actually serves as this app's
// barcode (see the sale.repository.js / handleScan comments — there is no
// separate `barcode` column anywhere in the schema). products.code has a
// UNIQUE index and the table's collation (utf8mb4_unicode_ci) is already
// case-insensitive, so a plain `p.code = ?` on a trimmed input stays index-
// backed — wrapping the column itself in TRIM()/LOWER() would defeat that
// index and turn every scan into a full table scan as the catalog grows.
export async function findSellableByCode({ code, branchId }) {
  const [rows] = await pool.query(
    `SELECT p.id, p.name, p.code, p.selling_price, p.category_id, c.name AS category_name,
            p.brand_id, b.name AS brand_name,
            COALESCE(i.quantity - i.reserved_quantity, 0) AS available_quantity
     FROM products p
     JOIN categories c ON c.id = p.category_id
     LEFT JOIN brands b ON b.id = p.brand_id
     LEFT JOIN inventory i ON i.product_id = p.id AND i.branch_id = ?
     WHERE p.deleted_at IS NULL AND p.status = 'active' AND p.code = ?
     LIMIT 1`,
    [branchId, code],
  );
  return rows[0] || null;
}

export async function findAll({ page = 1, limit = 20, search, categoryId, brandId, status }) {
  const conditions = ['p.deleted_at IS NULL'];
  const params = [];

  if (search) {
    conditions.push('(p.name LIKE ? OR p.code LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term);
  }
  if (categoryId) {
    conditions.push('p.category_id = ?');
    params.push(categoryId);
  }
  if (brandId) {
    conditions.push('p.brand_id = ?');
    params.push(brandId);
  }
  if (status) {
    conditions.push('p.status = ?');
    params.push(status);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `${BASE_SELECT} ${whereClause} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM products p ${whereClause}`, params);

  return { rows, total: countRows[0].total };
}

// The Archived Products page's list — the mirror image of findAll()'s
// "deleted_at IS NULL": everything currently archived, newest-archived
// first so a Super Admin cleaning up sees their own recent actions on top.
export async function findAllArchived({ page = 1, limit = 20, search }) {
  const conditions = ['p.deleted_at IS NOT NULL'];
  const params = [];

  if (search) {
    conditions.push('(p.name LIKE ? OR p.code LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `${BASE_SELECT} ${whereClause} ORDER BY p.deleted_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM products p ${whereClause}`, params);

  return { rows, total: countRows[0].total };
}

export async function findArchivedById(id) {
  const [rows] = await pool.query(`${BASE_SELECT} WHERE p.id = ? AND p.deleted_at IS NOT NULL LIMIT 1`, [id]);
  if (!rows[0]) return null;

  const [images] = await pool.query(
    'SELECT id, image_path, is_primary, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order',
    [id],
  );
  return { ...rows[0], images };
}

export async function restore(id, userId) {
  await pool.query('UPDATE products SET deleted_at = NULL, updated_by = ? WHERE id = ?', [userId, id]);
  return findById(id);
}

// Real removal — only ever called after the caller has confirmed
// hasTransactionHistory() is false. product_images/qr_codes cascade
// automatically (ON DELETE CASCADE); every other referencing table
// (sale_items, purchase_items, stock_transfer_items, inventory,
// inventory_movements, inventory_adjustments) is ON DELETE RESTRICT, so
// this throws ER_ROW_IS_REFERENCED_2 if that pre-check was somehow stale —
// the service layer converts that into a friendly message rather than
// letting the raw DB error reach the client.
export async function hardDelete(id) {
  await pool.query('DELETE FROM products WHERE id = ?', [id]);
}

export async function create(data) {
  const [result] = await pool.query(
    `INSERT INTO products (name, code, category_id, brand_id, description, buying_price, selling_price, min_stock, status, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name, data.code, data.categoryId, data.brandId || null, data.description || null,
      data.buyingPrice, data.sellingPrice, data.minStock || 0, data.status || 'active',
      data.userId, data.userId,
    ],
  );
  return findById(result.insertId);
}

export async function update(id, data) {
  await pool.query(
    `UPDATE products SET name = ?, category_id = ?, brand_id = ?, description = ?,
       buying_price = ?, selling_price = ?, min_stock = ?, status = ?, updated_by = ? WHERE id = ?`,
    [
      data.name, data.categoryId, data.brandId || null, data.description || null,
      data.buyingPrice, data.sellingPrice, data.minStock || 0, data.status, data.userId, id,
    ],
  );
  return findById(id);
}

export async function bulkUpdateStatus(ids, status, userId) {
  await pool.query('UPDATE products SET status = ?, updated_by = ? WHERE id IN (?)', [status, userId, ids]);
}

export async function softDelete(id, userId) {
  await pool.query('UPDATE products SET deleted_at = NOW(), updated_by = ? WHERE id = ?', [userId, id]);
}

// Every table below is ON DELETE RESTRICT against products (see the 004/005/
// 006/007 migrations) — any row in any of them would make a hard DELETE fail
// with a raw FK error. Checked up front so "delete" can decide whether to
// archive instead of ever attempting (and failing) the real delete.
// inventory/inventory_movements/inventory_adjustments matter even for a
// product with zero sales or purchases — a manual stock adjustment
// ("initial_count", a correction) creates those rows independently.
export async function hasTransactionHistory(id) {
  const [[saleItems]] = await pool.query('SELECT COUNT(*) AS total FROM sale_items WHERE product_id = ?', [id]);
  const [[purchaseItems]] = await pool.query('SELECT COUNT(*) AS total FROM purchase_items WHERE product_id = ?', [id]);
  const [[transferItems]] = await pool.query('SELECT COUNT(*) AS total FROM stock_transfer_items WHERE product_id = ?', [id]);
  const [[inventoryRows]] = await pool.query('SELECT COUNT(*) AS total FROM inventory WHERE product_id = ?', [id]);
  const [[movements]] = await pool.query('SELECT COUNT(*) AS total FROM inventory_movements WHERE product_id = ?', [id]);
  const [[adjustments]] = await pool.query('SELECT COUNT(*) AS total FROM inventory_adjustments WHERE product_id = ?', [id]);
  return [saleItems, purchaseItems, transferItems, inventoryRows, movements, adjustments].some((row) => row.total > 0);
}

export async function addImage(productId, imagePath, isPrimary) {
  if (isPrimary) {
    await pool.query('UPDATE product_images SET is_primary = FALSE WHERE product_id = ?', [productId]);
  }
  const [[{ maxOrder }]] = await pool.query(
    'SELECT COALESCE(MAX(sort_order), -1) + 1 AS maxOrder FROM product_images WHERE product_id = ?',
    [productId],
  );
  const [result] = await pool.query(
    'INSERT INTO product_images (product_id, image_path, is_primary, sort_order) VALUES (?, ?, ?, ?)',
    [productId, imagePath, isPrimary, maxOrder],
  );
  return result.insertId;
}

export async function removeImage(imageId, productId) {
  await pool.query('DELETE FROM product_images WHERE id = ? AND product_id = ?', [imageId, productId]);
}

export async function findImageById(imageId) {
  const [rows] = await pool.query('SELECT * FROM product_images WHERE id = ? LIMIT 1', [imageId]);
  return rows[0] || null;
}
