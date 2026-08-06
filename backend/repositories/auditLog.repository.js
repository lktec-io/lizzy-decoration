import { pool } from '../config/db.js';

export async function create({
  userId, userName, roleName, action, module, tableName, recordId,
  description, oldValue, newValue, ipAddress, userAgent, branchId, branchName, status,
}) {
  await pool.query(
    `INSERT INTO audit_logs
       (user_id, user_name, role_name, action, module, table_name, record_id,
        description, old_value, new_value, ip_address, user_agent, branch_id, branch_name, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId || null, userName || null, roleName || null, action, module,
      tableName || null, recordId || null, description || null,
      oldValue ? JSON.stringify(oldValue) : null, newValue ? JSON.stringify(newValue) : null,
      ipAddress || null, userAgent || null, branchId || null, branchName || null, status || 'success',
    ],
  );
}

function branchFilter(branchIds) {
  if (!branchIds) return { clause: '', params: [] };
  if (branchIds.length === 0) return { clause: 'AND 1 = 0', params: [] };
  return { clause: 'AND al.branch_id IN (?)', params: [branchIds] };
}

function buildWhere({ dateFrom, dateTo, branchId, module, userId, action, search, branchIds }) {
  const conditions = ['1 = 1'];
  const params = [];

  if (dateFrom) {
    conditions.push('al.created_at >= ?');
    params.push(`${dateFrom} 00:00:00`);
  }
  if (dateTo) {
    conditions.push('al.created_at <= ?');
    params.push(`${dateTo} 23:59:59`);
  }
  if (branchId) {
    conditions.push('al.branch_id = ?');
    params.push(branchId);
  }
  if (module) {
    conditions.push('al.module = ?');
    params.push(module);
  }
  if (userId) {
    conditions.push('al.user_id = ?');
    params.push(userId);
  }
  if (action) {
    conditions.push('al.action = ?');
    params.push(action);
  }
  if (search) {
    conditions.push('(al.description LIKE ? OR al.user_name LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  const scope = branchFilter(branchIds);
  return { clause: `WHERE ${conditions.join(' AND ')} ${scope.clause}`, params: [...params, ...scope.params] };
}

export async function findAll({ page = 1, limit = 20, ...filters }) {
  const { clause, params } = buildWhere(filters);
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `SELECT al.* FROM audit_logs al ${clause} ORDER BY al.created_at DESC, al.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM audit_logs al ${clause}`, params);

  return { rows, total: countRows[0].total };
}

// Used by exports — same filters as findAll but uncapped (up to a sane hard
// ceiling), since an export must contain every matching row, not one page.
export async function findAllForExport(filters, hardLimit = 10000) {
  const { clause, params } = buildWhere(filters);
  const [rows] = await pool.query(
    `SELECT al.* FROM audit_logs al ${clause} ORDER BY al.created_at DESC, al.id DESC LIMIT ?`,
    [...params, hardLimit],
  );
  return rows;
}

// Distinct values actually present in the log — a filter dropdown should
// only ever offer choices that return results, and this avoids depending on
// the full users/branches tables just to populate a filter.
export async function getFilterOptions(branchIds) {
  const scope = branchFilter(branchIds);
  const baseWhere = `WHERE 1 = 1 ${scope.clause}`;

  const [modules] = await pool.query(`SELECT DISTINCT module FROM audit_logs al ${baseWhere} ORDER BY module`, scope.params);
  const [actions] = await pool.query(`SELECT DISTINCT action FROM audit_logs al ${baseWhere} ORDER BY action`, scope.params);
  const [users] = await pool.query(
    `SELECT DISTINCT al.user_id AS id, al.user_name AS name FROM audit_logs al ${baseWhere} AND al.user_id IS NOT NULL ORDER BY al.user_name`,
    scope.params,
  );
  const [branches] = await pool.query(
    `SELECT DISTINCT al.branch_id AS id, al.branch_name AS name FROM audit_logs al ${baseWhere} AND al.branch_id IS NOT NULL ORDER BY al.branch_name`,
    scope.params,
  );

  return {
    modules: modules.map((r) => r.module),
    actions: actions.map((r) => r.action),
    users,
    branches,
  };
}
