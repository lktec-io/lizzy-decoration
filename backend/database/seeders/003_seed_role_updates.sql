-- 003_seed_role_updates.sql
-- Renames the seeded "Cashier" role to "Sales" (id, role_permissions, and any
-- assigned users.role_id references are untouched — this only updates the
-- display name/description) and adds a new "Car Wash Operator" system role.
-- Idempotent: safe to re-run.

UPDATE roles
SET name = 'Sales', description = 'Point of sale operations for their assigned branch'
WHERE name = 'Cashier';

INSERT IGNORE INTO roles (name, description, is_system) VALUES
  ('Car Wash Operator', 'Car wash service operations for their assigned branch', TRUE);

-- Car Wash Operator: dashboard + car wash only.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.code IN (
  'dashboard.view',
  'carwash.view', 'carwash.create'
) WHERE r.name = 'Car Wash Operator';
