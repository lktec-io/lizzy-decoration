-- 016_extend_audit_logs.sql
-- FINAL PRODUCTION SPRINT: Audit Trail (Feature 1). The audit_logs table
-- created in 010_create_notifications_logs.sql has never been referenced by
-- any application code (confirmed via full-repo grep), so it is safe to
-- reshape rather than create a second, confusingly-named audit table. This
-- extends it with the fields the compliance Audit Trail UI requires:
-- readable user/role/branch name snapshots (so a later user rename,
-- deletion, or role change never rewrites history), a `module` category
-- distinct from the raw table_name, a human-readable description, the
-- request's device/browser, and a success/failed status.
--
-- user_id, record_id and table_name are relaxed to nullable: a failed
-- login attempt against an unknown username has no user_id, and a
-- system-level event (e.g. "Company Settings Updated") has no single
-- table/record to point at.

ALTER TABLE audit_logs MODIFY COLUMN user_id BIGINT UNSIGNED NULL;
ALTER TABLE audit_logs MODIFY COLUMN record_id BIGINT UNSIGNED NULL;
ALTER TABLE audit_logs MODIFY COLUMN table_name VARCHAR(50) NULL;

ALTER TABLE audit_logs ADD COLUMN module VARCHAR(50) NOT NULL AFTER action;
ALTER TABLE audit_logs ADD COLUMN description VARCHAR(500) NULL AFTER new_value;
ALTER TABLE audit_logs ADD COLUMN user_name VARCHAR(150) NULL AFTER user_id;
ALTER TABLE audit_logs ADD COLUMN role_name VARCHAR(100) NULL AFTER user_name;
ALTER TABLE audit_logs ADD COLUMN branch_name VARCHAR(150) NULL AFTER branch_id;
ALTER TABLE audit_logs ADD COLUMN user_agent VARCHAR(255) NULL AFTER ip_address;
ALTER TABLE audit_logs ADD COLUMN status ENUM('success', 'failed') NOT NULL DEFAULT 'success' AFTER user_agent;

ALTER TABLE audit_logs ADD KEY idx_audit_logs_module (module);
ALTER TABLE audit_logs ADD KEY idx_audit_logs_branch_date (branch_id, created_at);
ALTER TABLE audit_logs ADD KEY idx_audit_logs_status (status);
