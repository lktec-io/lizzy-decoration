import { pool } from '../config/db.js';

export async function create({ filePath, sizeBytes, triggerType, status, triggeredBy }) {
  const [result] = await pool.query(
    'INSERT INTO system_backups (file_path, size_bytes, trigger_type, status, triggered_by) VALUES (?, ?, ?, ?, ?)',
    [filePath, sizeBytes, triggerType, status, triggeredBy],
  );
  return result.insertId;
}

export async function findById(id) {
  const [rows] = await pool.query(
    `SELECT sb.*, u.first_name, u.last_name FROM system_backups sb LEFT JOIN users u ON u.id = sb.triggered_by WHERE sb.id = ? LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}

export async function findAll({ page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;
  const [rows] = await pool.query(
    `SELECT sb.*, u.first_name, u.last_name
     FROM system_backups sb LEFT JOIN users u ON u.id = sb.triggered_by
     ORDER BY sb.created_at DESC LIMIT ? OFFSET ?`,
    [limit, offset],
  );
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM system_backups');
  return { rows, total };
}
