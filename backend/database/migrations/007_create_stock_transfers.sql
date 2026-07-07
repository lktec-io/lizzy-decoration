-- 007_create_stock_transfers.sql

CREATE TABLE IF NOT EXISTS stock_transfer_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  transfer_number VARCHAR(30) NOT NULL,
  source_branch_id BIGINT UNSIGNED NOT NULL,
  destination_branch_id BIGINT UNSIGNED NOT NULL,
  status ENUM('pending','approved','rejected','completed') NOT NULL DEFAULT 'pending',
  requested_by BIGINT UNSIGNED NOT NULL,
  approved_by BIGINT UNSIGNED NULL,
  approved_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_stock_transfer_requests_number (transfer_number),
  KEY idx_stock_transfer_requests_source (source_branch_id),
  KEY idx_stock_transfer_requests_destination (destination_branch_id),
  KEY idx_stock_transfer_requests_status (status),
  CONSTRAINT fk_stock_transfer_requests_source FOREIGN KEY (source_branch_id) REFERENCES branches (id) ON DELETE RESTRICT,
  CONSTRAINT fk_stock_transfer_requests_destination FOREIGN KEY (destination_branch_id) REFERENCES branches (id) ON DELETE RESTRICT,
  CONSTRAINT fk_stock_transfer_requests_requested_by FOREIGN KEY (requested_by) REFERENCES users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_stock_transfer_requests_approved_by FOREIGN KEY (approved_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT chk_stock_transfer_requests_diff_branch CHECK (source_branch_id <> destination_branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stock_transfer_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  transfer_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_stock_transfer_items_transfer (transfer_id),
  KEY idx_stock_transfer_items_product (product_id),
  CONSTRAINT fk_stock_transfer_items_transfer FOREIGN KEY (transfer_id) REFERENCES stock_transfer_requests (id) ON DELETE CASCADE,
  CONSTRAINT fk_stock_transfer_items_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT,
  CONSTRAINT chk_stock_transfer_items_quantity_positive CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
