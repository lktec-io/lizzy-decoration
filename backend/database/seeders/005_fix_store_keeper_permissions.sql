-- 005_fix_store_keeper_permissions.sql
-- Narrows Store Keeper to exactly Dashboard, Products, Inventory, Purchases
-- (the explicit sidebar spec) — 004_fix_role_permissions.sql carried the
-- role's original broader seed forward unchanged (it also had
-- Suppliers/Transfers/Sales/Returns/Reports view access). Dropping
-- suppliers.view does NOT break purchase-order creation: the supplier
-- picker on that form calls GET /suppliers/active, which is gated only by
-- authenticate (any logged-in user), not authorize('suppliers.view') — see
-- backend/routes/supplier.routes.js. inventory.adjust and purchases.create
-- are kept so Store Keeper can still actually do the job those two visible
-- pages exist for. Idempotent: full delete-then-insert, safe to re-run.

DELETE rp FROM role_permissions rp JOIN roles r ON r.id = rp.role_id WHERE r.name = 'Store Keeper';
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code IN (
  'dashboard.view',
  'products.view',
  'inventory.view', 'inventory.adjust',
  'purchases.view', 'purchases.create'
) WHERE r.name = 'Store Keeper';
