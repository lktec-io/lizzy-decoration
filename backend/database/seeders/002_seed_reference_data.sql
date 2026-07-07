-- 002_seed_reference_data.sql
-- Static reference data explicitly enumerated in MASTER_PROMPT.md. Safe: no
-- secrets, no user accounts. Idempotent: safe to re-run.

INSERT IGNORE INTO expense_categories (name) VALUES
  ('Rent'), ('Electricity'), ('Water'), ('Fuel'), ('Salary'),
  ('Maintenance'), ('Transport'), ('Office Supplies'), ('Other');

INSERT IGNORE INTO carwash_services (name, price, status) VALUES
  ('Normal Wash', 5000.00, 'active'),
  ('Full Wash', 10000.00, 'active'),
  ('Engine Wash', 8000.00, 'active'),
  ('Interior Cleaning', 12000.00, 'active');
