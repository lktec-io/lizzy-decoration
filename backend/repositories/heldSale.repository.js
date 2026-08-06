import { pool } from '../config/db.js';

const BASE_SELECT = `
  SELECT hs.*, CONCAT(u.first_name, ' ', u.last_name) AS held_by_name,
         CONCAT(c.first_name, ' ', c.last_name) AS customer_name
  FROM held_sales hs
  JOIN users u ON u.id = hs.held_by
  LEFT JOIN customers c ON c.id = hs.customer_id
`;

export async function create({ branchId, customerId, heldBy, cartData, itemsCount, totalAmount, notes }) {
  const [result] = await pool.query(
    `INSERT INTO held_sales (branch_id, customer_id, held_by, cart_data, items_count, total_amount, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [branchId, customerId || null, heldBy, JSON.stringify(cartData), itemsCount, totalAmount, notes || null],
  );
  return findById(result.insertId);
}

export async function findById(id) {
  const [rows] = await pool.query(`${BASE_SELECT} WHERE hs.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

function branchFilter(branchIds) {
  if (!branchIds) return { clause: '', params: [] };
  if (branchIds.length === 0) return { clause: 'AND 1 = 0', params: [] };
  return { clause: 'AND hs.branch_id IN (?)', params: [branchIds] };
}

export async function findAll({ branchId, branchIds }) {
  const conditions = ['1 = 1'];
  const params = [];

  if (branchId) {
    conditions.push('hs.branch_id = ?');
    params.push(branchId);
  }

  const scope = branchFilter(branchIds);
  const [rows] = await pool.query(
    `${BASE_SELECT} WHERE ${conditions.join(' AND ')} ${scope.clause} ORDER BY hs.created_at DESC`,
    [...params, ...scope.params],
  );
  return rows;
}

export async function remove(id) {
  await pool.query('DELETE FROM held_sales WHERE id = ?', [id]);
}
