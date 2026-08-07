-- 009_add_system_reset_permission.sql
-- Production Reset (System Maintenance). The single most destructive
-- action in the whole application — irreversibly wipes every branch's
-- transactional data — so it gets a permission of its own rather than
-- reusing an existing broad one, and is granted ONLY to Super
-- Administrator (not Manager, unlike most other settings.* grants).
-- Super Administrator's blanket grant in 004_fix_role_permissions.sql
-- predates this permission's existence, so it must be granted explicitly
-- here too — same reasoning as audit.view in 008.

INSERT IGNORE INTO permissions (code, module, action, description) VALUES
  ('system.reset', 'system', 'reset', 'Permanently reset all operational business data (Production Reset)');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code = 'system.reset'
WHERE r.name = 'Super Administrator';
