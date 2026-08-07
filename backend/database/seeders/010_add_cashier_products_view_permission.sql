-- 010_add_cashier_products_view_permission.sql
-- Restores Cashier's `products.view` grant, dropped as an apparent side
-- effect of 004_fix_role_permissions.sql's sidebar-narrowing pass (that
-- migration's own comment: "Deliberately dropped from the original broader
-- seed: products/inventory/suppliers/purchases/transfers/returns/expenses/
-- carwash/reports view access"). The original seed (001, line 119) DID
-- grant it, under "Cashier: POS-facing operations for their assigned
-- branch" — because it isn't just "can see the Products management page,"
-- it's also the exact permission backend/routes/product.routes.js requires
-- for GET /products/sellable and GET /products/lookup, the two endpoints
-- the POS product grid and barcode scanner depend on. Cashier keeps every
-- other narrowing from 004 (still no products.create/edit/delete/manage,
-- still no Products nav item) — this restores only the one code that POS
-- itself cannot function without.
--
-- No new permission row: products.view already exists (001). This is a
-- single additive role_permissions grant, matching the established
-- INSERT IGNORE pattern (006, 007, 008, 009) — not the destructive
-- delete-then-reinsert pattern 004/005 use for a full role rewrite.

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code = 'products.view'
WHERE r.name = 'Cashier';
