-- 014_add_sale_idempotency_key.sql
-- Business Workflow Optimization sprint: POS checkout previously had no
-- server-side protection against a duplicate/double-click submission or a
-- retried network request creating two sales for one cart — only a
-- client-side "disable the button while in flight" guard, which does not
-- protect against a retried request or a second browser tab. The frontend
-- now generates one client-side UUID per checkout attempt and sends it as
-- idempotencyKey; a UNIQUE index lets the backend detect "this exact
-- attempt already succeeded" and return the existing sale instead of
-- creating a second one. Nullable so every existing sale (and any client
-- that doesn't send a key) is unaffected — NULL is never compared as equal
-- to another NULL under a UNIQUE index, so multiple NULLs are allowed.

ALTER TABLE sales ADD COLUMN idempotency_key VARCHAR(64) NULL AFTER sale_number;
ALTER TABLE sales ADD UNIQUE KEY uq_sales_idempotency_key (idempotency_key);
