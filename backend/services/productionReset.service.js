import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { pool } from '../config/db.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../config/logger.js';
import { recordAudit } from './auditLog.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');

// Directories cleared entirely — generated/derived files that are always
// safe to lose because the reset itself deletes every DB row that could
// regenerate them (product photos, product QR images). uploads/logo,
// uploads/avatars, and uploads/backups are deliberately excluded: company
// branding, user profile photos, and system backups are explicitly on the
// "never delete" list.
const CLEARED_UPLOAD_DIRS = ['products', 'labels', 'receipts'];

// Tables wiped in full, in an order that satisfies every FK in the schema
// without ever needing to disable constraint checking. Children (or
// CASCADE-linked rows) are always cleared before the parent they'd
// otherwise block:
//   - returns first (CASCADEs return_items, which RESTRICTs sale_items)
//   - sales next (CASCADEs sale_items + sale_payments)
//   - stock_transfer_requests (CASCADEs stock_transfer_items)
//   - inventory_adjustments -> inventory_movements -> inventory, all of
//     which RESTRICT product deletion
//   - purchase_orders (CASCADEs purchase_items) + supplier_payments
//     before products/suppliers
//   - products last among catalog tables (CASCADEs qr_codes/product_images)
//   - carwash_transactions before vehicles (RESTRICT)
// categories, brands, expense_categories, and carwash_services are
// deliberately NOT included — they're reference/configuration data with
// no reliable "demo vs real" flag to distinguish them by, and the spec
// explicitly says not to touch configuration data.
const WIPE_ORDER = [
  'returns',
  'sales',
  'held_sales',
  'stock_transfer_requests',
  'inventory_adjustments',
  'inventory_movements',
  'inventory',
  'purchase_orders',
  'supplier_payments',
  'products',
  'carwash_transactions',
  'vehicles',
  'expenses',
  'customers',
  'suppliers',
  'notifications',
];

async function collectFilesToRemove(connection) {
  const [qrRows] = await connection.query('SELECT qr_path FROM qr_codes WHERE qr_path IS NOT NULL');
  const [imageRows] = await connection.query('SELECT image_path FROM product_images WHERE image_path IS NOT NULL');
  return [...qrRows.map((r) => r.qr_path), ...imageRows.map((r) => r.image_path)].filter((p) => p && p.startsWith('/uploads/'));
}

async function removeFiles(relativePaths) {
  let removed = 0;
  await Promise.all(relativePaths.map(async (relativePath) => {
    try {
      await fs.unlink(path.join(UPLOADS_ROOT, relativePath.replace('/uploads/', '')));
      removed += 1;
    } catch {
      // Already gone or inaccessible — not fatal, this is best-effort cleanup.
    }
  }));
  return removed;
}

async function clearUploadDir(dirName) {
  const dirPath = path.join(UPLOADS_ROOT, dirName);
  let removed = 0;
  try {
    const entries = await fs.readdir(dirPath);
    await Promise.all(entries.map(async (entry) => {
      try {
        await fs.unlink(path.join(dirPath, entry));
        removed += 1;
      } catch {
        // A subdirectory or an already-gone file — skip rather than fail the whole reset.
      }
    }));
  } catch {
    // Directory doesn't exist — nothing to clear.
  }
  return removed;
}

async function countRows(connection, table) {
  const [[{ count }]] = await connection.query(`SELECT COUNT(*) AS count FROM ${table}`);
  return count;
}

// The entire wipe (all DELETEs, the user soft-deactivation, and the
// document_sequences reset) runs as ONE transaction — either the whole
// reset lands, or none of it does. Never disables foreign_key_checks;
// every DELETE relies on the schema's real ON DELETE CASCADE/RESTRICT
// behavior and WIPE_ORDER's dependency-respecting sequence instead.
export async function performProductionReset({ includeActivityLogs = false } = {}, actorId, actorUser) {
  if (actorUser?.role !== 'Super Administrator') {
    // Defense in depth: the route is already gated by the system.reset
    // permission (granted only to Super Administrator), but this is the
    // single most destructive action in the app — a second, explicit
    // role check here costs nothing and never trusts permission wiring
    // alone for an operation this irreversible.
    throw new ApiError(403, 'Only a Super Administrator may perform a Production Reset');
  }

  const connection = await pool.getConnection();
  const tableCounts = {};

  try {
    await connection.beginTransaction();

    const filesToRemove = await collectFilesToRemove(connection);

    for (const table of WIPE_ORDER) {
      tableCounts[table] = await countRows(connection, table);
      await connection.query(`DELETE FROM ${table}`);
    }

    if (includeActivityLogs) {
      tableCounts.activity_logs = await countRows(connection, 'activity_logs');
      await connection.query('DELETE FROM activity_logs');
    }

    // "Keep only Super Administrator" is implemented as a soft-delete
    // (existing users.deleted_at mechanism, already used by every other
    // user-removal path in this app), NOT a hard DELETE. audit_logs.user_id
    // is an intentional ON DELETE RESTRICT — hard-deleting a user who has
    // historical audit entries would violate that constraint (or force
    // disabling FK checks, which this reset must never do) and would also
    // erase the meaning of "who did what" from the compliance trail this
    // sprint's own Audit Trail feature exists to preserve. Soft-deleted
    // users can no longer log in (auth.service.js's login query already
    // filters deleted_at IS NULL) — functionally equivalent to "removed"
    // without touching a single foreign key.
    const [usersToRemove] = await connection.query(
      `SELECT u.id FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.deleted_at IS NULL AND r.name <> 'Super Administrator'`,
    );
    const userIdsToRemove = usersToRemove.map((row) => row.id);

    if (userIdsToRemove.length > 0) {
      await connection.query(
        'UPDATE users SET deleted_at = NOW(), updated_by = ? WHERE id IN (?)',
        [actorId, userIdsToRemove],
      );
      await connection.query(
        'UPDATE sessions SET revoked_at = NOW() WHERE user_id IN (?) AND revoked_at IS NULL',
        [userIdsToRemove],
      );
      await connection.query('DELETE FROM refresh_tokens WHERE user_id IN (?)', [userIdsToRemove]);
    }

    // Numbering restarts clean (SAL-000001, PUR-000001, ...) — generateCode()
    // recreates a row for each document type the first time it's next used,
    // exactly as it would on a genuinely brand-new install with this table empty.
    tableCounts.document_sequences = await countRows(connection, 'document_sequences');
    await connection.query('DELETE FROM document_sequences');

    await connection.commit();

    const removedGeneratedFiles = await removeFiles(filesToRemove);
    const clearedDirCounts = {};
    for (const dir of CLEARED_UPLOAD_DIRS) {
      clearedDirCounts[dir] = await clearUploadDir(dir);
    }

    const summary = {
      tablesCleared: tableCounts,
      usersDeactivated: userIdsToRemove.length,
      filesRemoved: removedGeneratedFiles,
      uploadDirsCleared: clearedDirCounts,
      activityLogsCleared: includeActivityLogs,
    };

    await recordAudit({
      userId: actorId,
      roleName: actorUser.role,
      branchId: actorUser.branchId,
      action: 'Production Reset',
      module: 'System',
      description: `Production Reset executed: ${userIdsToRemove.length} user(s) deactivated, ${Object.entries(tableCounts).map(([t, c]) => `${t}=${c}`).join(', ')}`,
      status: 'success',
    });

    logger.warn('Production Reset executed', { actorId, summary });

    return summary;
  } catch (err) {
    await connection.rollback();
    await recordAudit({
      userId: actorId,
      roleName: actorUser?.role,
      branchId: actorUser?.branchId,
      action: 'Production Reset',
      module: 'System',
      description: `Production Reset failed and was rolled back: ${err.message}`,
      status: 'failed',
    });
    throw err;
  } finally {
    connection.release();
  }
}
