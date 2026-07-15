-- 006_add_customer_supplier_delete_permissions.sql
-- New permission codes for hard-deleting customers/suppliers (previously
-- only view/create/edit existed for these two modules — status
-- activate/deactivate was the only "removal" affordance). Granted to
-- Super Administrator and Manager, matching their existing
-- customers.edit/suppliers.edit scope. Idempotent: safe to re-run.

INSERT IGNORE INTO permissions (code, module, action, description) VALUES
  ('customers.delete', 'customers', 'delete', 'Permanently delete customers'),
  ('suppliers.delete', 'suppliers', 'delete', 'Permanently delete suppliers');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code IN ('customers.delete', 'suppliers.delete')
WHERE r.name IN ('Super Administrator', 'Manager');
