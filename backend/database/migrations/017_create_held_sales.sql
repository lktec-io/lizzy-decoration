-- 017_create_held_sales.sql
-- FINAL PRODUCTION SPRINT: Hold & Resume Sales (Feature 2). A dedicated
-- table, deliberately NOT mixed with `sales` (whose status ENUM is only
-- 'completed'/'voided' and which every report/dashboard query already
-- treats as "real, stock-affecting transactions"). A held sale never
-- touches sales/sale_items/inventory — it is just a server-persisted cart
-- snapshot so it survives a refresh, logout, or server restart, resumed by
-- feeding cart_data back into the existing, unchanged checkout endpoint.
--
-- cart_data stores the full POS cart (items, quantities, prices, discounts,
-- notes) as JSON — the exact shape the frontend cart already uses, so
-- Resume can repopulate it losslessly. items_count/total_amount are
-- denormalized snapshots purely so the Held Sales list can render without
-- parsing JSON per row; they are never read by checkout, which always
-- revalidates stock/pricing server-side regardless.
--
-- Display numbers (HOLD-0001, HOLD-0002, ...) are derived from this table's
-- own AUTO_INCREMENT id at read time — no separate sequence needed.

CREATE TABLE IF NOT EXISTS held_sales (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  branch_id BIGINT UNSIGNED NOT NULL,
  customer_id BIGINT UNSIGNED NULL,
  held_by BIGINT UNSIGNED NOT NULL,
  cart_data JSON NOT NULL,
  items_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  total_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
  notes VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_held_sales_branch_date (branch_id, created_at),
  KEY idx_held_sales_held_by (held_by),
  CONSTRAINT fk_held_sales_branch FOREIGN KEY (branch_id) REFERENCES branches (id) ON DELETE RESTRICT,
  CONSTRAINT fk_held_sales_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL,
  CONSTRAINT fk_held_sales_held_by FOREIGN KEY (held_by) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
