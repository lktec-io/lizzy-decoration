-- 008_add_audit_permission.sql
-- FINAL PRODUCTION SPRINT: Audit Trail (Feature 1). One new permission
-- gates the entire feature (view + export use the same code — there is no
-- separate export-only use case for a compliance log). Granted ONLY to
-- Super Administrator and Manager, per spec: Cashier and Store Keeper must
-- never access the Audit Trail. Super Administrator's blanket grant in
-- 004_fix_role_permissions.sql is a CROSS JOIN against whatever rows
-- existed in `permissions` at the time that seeder ran — audit.view is
-- inserted here, after it, so it is NOT automatically picked up and must
-- be granted explicitly, same as Manager.

INSERT IGNORE INTO permissions (code, module, action, description) VALUES
  ('audit.view', 'audit', 'view', 'View and export the system audit trail');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code = 'audit.view'
WHERE r.name IN ('Super Administrator', 'Manager');
