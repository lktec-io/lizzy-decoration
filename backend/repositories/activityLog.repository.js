import { pool } from '../config/db.js';

export async function create({ userId, branchId, description, referenceType, referenceId }) {
  await pool.query(
    `INSERT INTO activity_logs (user_id, branch_id, description, reference_type, reference_id)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, branchId || null, description, referenceType || null, referenceId || null],
  );
}

export async function findRecent(limit = 20) {
  const [rows] = await pool.query(
    `SELECT a.id, a.description, a.reference_type, a.reference_id, a.created_at,
            u.first_name, u.last_name, a.branch_id
     FROM activity_logs a
     JOIN users u ON u.id = a.user_id
     ORDER BY a.created_at DESC
     LIMIT ?`,
    [limit],
  );
  return rows;
}
