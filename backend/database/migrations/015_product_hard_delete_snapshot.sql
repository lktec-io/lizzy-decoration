-- 015_product_hard_delete_snapshot.sql
-- Production hotfix: "Delete Product" must permanently remove the product
-- (catalog, search, POS, scanner, QR, current inventory — all gone), but
-- must never destroy a real sale or purchase transaction record. Those are
-- financial/audit history, not product data, and deleting them would mean
-- a customer's completed, paid sale silently vanishing from revenue
-- reports after the fact.
--
-- sale_items/purchase_items already store everything money-related
-- directly on the row (quantity, unit/buying price, line_total) — what
-- they don't store is the product's name/code, which today comes from a
-- live JOIN to products that would break (or the row would need excluding)
-- once the product is gone. This migration adds a name/code snapshot to
-- each line so a receipt or purchase record still reads correctly forever
-- after, then relaxes product_id from NOT NULL / ON DELETE RESTRICT to
-- NULL / ON DELETE SET NULL so deleting a product can never be blocked by,
-- or cascade into deleting, a real transaction.
--
-- Non-destructive: only adds nullable columns and backfills them from
-- still-existing product rows before relaxing the constraint. No existing
-- row's data changes; no table is dropped.
--
-- sale_items also gets a buying_price_snapshot: unlike purchase_items
-- (which already stores the price actually paid on the row), sale_items
-- has never stored cost — report.repository.js's profitReport() and
-- sale.service.js's computeProfit() both read it live from
-- products.buying_price at report/view time. Once a product is deleted
-- that live join would return NULL, silently zeroing the reported cost
-- (and so overstating gross profit) for every past sale of that product —
-- the snapshot preserves the cost as it was at sale time instead.

ALTER TABLE sale_items
  ADD COLUMN product_name_snapshot VARCHAR(150) NULL AFTER product_id,
  ADD COLUMN product_code_snapshot VARCHAR(30) NULL AFTER product_name_snapshot,
  ADD COLUMN buying_price_snapshot DECIMAL(14,2) NULL AFTER product_code_snapshot;

UPDATE sale_items si
JOIN products p ON p.id = si.product_id
SET si.product_name_snapshot = p.name, si.product_code_snapshot = p.code, si.buying_price_snapshot = p.buying_price
WHERE si.product_name_snapshot IS NULL;

ALTER TABLE sale_items
  DROP FOREIGN KEY fk_sale_items_product,
  MODIFY COLUMN product_id BIGINT UNSIGNED NULL,
  ADD CONSTRAINT fk_sale_items_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL;

ALTER TABLE purchase_items
  ADD COLUMN product_name_snapshot VARCHAR(150) NULL AFTER product_id,
  ADD COLUMN product_code_snapshot VARCHAR(30) NULL AFTER product_name_snapshot;

UPDATE purchase_items pi
JOIN products p ON p.id = pi.product_id
SET pi.product_name_snapshot = p.name, pi.product_code_snapshot = p.code
WHERE pi.product_name_snapshot IS NULL;

ALTER TABLE purchase_items
  DROP FOREIGN KEY fk_purchase_items_product,
  MODIFY COLUMN product_id BIGINT UNSIGNED NULL,
  ADD CONSTRAINT fk_purchase_items_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL;
