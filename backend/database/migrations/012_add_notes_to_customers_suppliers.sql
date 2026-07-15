-- 012_add_notes_to_customers_suppliers.sql
-- The simplified Customer/Supplier forms (Sales Management System sprint)
-- add an optional free-text Notes field that has no existing column to
-- back it — nullable, no default, purely additive.

ALTER TABLE customers ADD COLUMN notes TEXT NULL AFTER address;
ALTER TABLE suppliers ADD COLUMN notes TEXT NULL AFTER address;
