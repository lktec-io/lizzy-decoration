import * as auditLogRepository from '../repositories/auditLog.repository.js';
import * as userRepository from '../repositories/user.repository.js';
import * as branchRepository from '../repositories/branch.repository.js';
import { getAccessibleBranchIds } from '../utils/branchScope.js';
import { logger } from '../config/logger.js';

// The one entry point every other service calls to append an audit
// record. Accepts either a full `user` (req.user-shaped: {id, role,
// branchId}) to auto-resolve display name/branch name, or pre-resolved
// userName/roleName/branchName when the caller already has them on hand
// (e.g. auth.service.js's login flow already has the full user row) to
// skip the extra lookups.
//
// Deliberately swallows its own errors: recording an audit entry must
// never fail — or roll back — the business action it's describing (e.g. a
// sale completing successfully must not become a 500 because the audit
// insert hit a transient DB hiccup). Failures are logged instead.
export async function recordAudit({
  user, userId, userName, roleName,
  action, module, tableName, recordId, description,
  oldValue, newValue, ipAddress, userAgent,
  branchId, branchName, status = 'success',
}) {
  try {
    let resolvedUserId = userId ?? user?.id ?? null;
    let resolvedUserName = userName ?? null;
    let resolvedRoleName = roleName ?? user?.role ?? null;
    let resolvedBranchId = branchId ?? user?.branchId ?? null;
    let resolvedBranchName = branchName ?? null;

    if (resolvedUserId && !resolvedUserName) {
      const actor = await userRepository.findById(resolvedUserId);
      if (actor) resolvedUserName = `${actor.first_name} ${actor.last_name}`;
    }

    if (resolvedBranchId && !resolvedBranchName) {
      const branch = await branchRepository.findById(resolvedBranchId);
      if (branch) resolvedBranchName = branch.name;
    }

    await auditLogRepository.create({
      userId: resolvedUserId,
      userName: resolvedUserName,
      roleName: resolvedRoleName,
      action,
      module,
      tableName,
      recordId,
      description,
      oldValue,
      newValue,
      ipAddress,
      userAgent,
      branchId: resolvedBranchId,
      branchName: resolvedBranchName,
      status,
    });
  } catch (err) {
    logger.error('Failed to record audit log entry', { error: err.message, action, module });
  }
}

export async function listAuditLogs(query, user) {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);
  const branchIds = await getAccessibleBranchIds(user);

  const { rows, total } = await auditLogRepository.findAll({
    page,
    limit,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    branchId: query.branchId ? Number(query.branchId) : undefined,
    module: query.module || undefined,
    userId: query.userId ? Number(query.userId) : undefined,
    action: query.action || undefined,
    search: query.search || undefined,
    branchIds,
  });

  return { items: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getFilterOptions(user) {
  const branchIds = await getAccessibleBranchIds(user);
  return auditLogRepository.getFilterOptions(branchIds);
}

export async function getLogsForExport(query, user) {
  const branchIds = await getAccessibleBranchIds(user);
  return auditLogRepository.findAllForExport({
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    branchId: query.branchId ? Number(query.branchId) : undefined,
    module: query.module || undefined,
    userId: query.userId ? Number(query.userId) : undefined,
    action: query.action || undefined,
    search: query.search || undefined,
    branchIds,
  });
}
