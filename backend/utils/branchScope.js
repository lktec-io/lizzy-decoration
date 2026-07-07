import { pool } from '../config/db.js';

// Returns null for Super Admin (unrestricted — sees all branches), or an
// array of branch IDs the user may access otherwise (their primary branch
// plus any additional branches from user_branches, e.g. multi-branch
// Managers). Services for branch-owned data (sales, inventory, purchases,
// expenses, ...) should call this and add `AND branch_id IN (?)` when the
// result isn't null. Business rule from MASTER_PROMPT.md: "Super Admin sees
// all branches. Managers see assigned branches. Cashiers see assigned
// branch only."
export async function getAccessibleBranchIds(user) {
  if (user.role === 'Super Administrator') {
    return null;
  }

  const branchIds = new Set();
  if (user.branchId) branchIds.add(user.branchId);

  const [rows] = await pool.query('SELECT branch_id FROM user_branches WHERE user_id = ?', [user.id]);
  rows.forEach((row) => branchIds.add(row.branch_id));

  return Array.from(branchIds);
}
