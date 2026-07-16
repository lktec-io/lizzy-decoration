-- 007_add_carwash_edit_delete_permissions.sql
-- Car Wash previously only had carwash.view/carwash.create — no way to
-- correct a mistyped transaction or remove one at all. edit goes to
-- everyone who can already create one (Super Administrator, Manager,
-- Cashier — matches carwash.create's existing grant list); delete is
-- restricted to Super Administrator/Manager, mirroring the
-- customers.delete/suppliers.delete grant pattern from an earlier sprint.

INSERT IGNORE INTO permissions (code, module, action, description) VALUES
  ('carwash.edit', 'carwash', 'edit', 'Edit car wash transactions'),
  ('carwash.delete', 'carwash', 'delete', 'Permanently delete car wash transactions');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code = 'carwash.edit'
WHERE r.name IN ('Super Administrator', 'Manager', 'Cashier');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code = 'carwash.delete'
WHERE r.name IN ('Super Administrator', 'Manager');
