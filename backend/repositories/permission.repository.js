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

export async function getIdsForRole(roleId) {
  const [rows] = await pool.query('SELECT permission_id FROM role_permissions WHERE role_id = ?', [roleId]);
  return rows.map((row) => row.permission_id);
}

// Replace the full permission set for a role in one transaction (delete + bulk insert).
export async function replaceForRole(roleId, permissionIds) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
    if (permissionIds.length > 0) {
      const values = permissionIds.map((permissionId) => [roleId, permissionId]);
      await connection.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [values]);
    }
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}
