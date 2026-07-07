import { pool } from '../config/db.js';

export async function getCodesForRole(roleId) {
  const [rows] = await pool.query(
    `SELECT p.code FROM role_permissions rp
     JOIN permissions p ON p.id = rp.permission_id
     WHERE rp.role_id = ?`,
    [roleId],
  );
  return rows.map((row) => row.code);
}

export async function findAll() {
  const [rows] = await pool.query('SELECT * FROM permissions ORDER BY module, action');
  return rows;
}
