import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/apiResponse.js';
import { pool } from '../config/db.js';

// Global search currently only covers Users — Products/Customers/Suppliers/
// Sales/Purchases/Vehicles/Expenses are added to this as their modules ship
// (see docs/API_PLAN.md §8). The response shape (grouped by entity type) is
// designed to extend without a breaking change.
export const search = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) {
    return success(res, { data: { users: [] } });
  }

  const term = `%${q}%`;
  const [users] = await pool.query(
    `SELECT id, first_name, last_name, email, username
     FROM users
     WHERE deleted_at IS NULL AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR username LIKE ?)
     LIMIT 5`,
    [term, term, term, term],
  );

  return success(res, { data: { users } });
});
