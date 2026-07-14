-- 011_fix_soft_deleted_user_uniqueness.sql
-- Backfill for the same issue fixed in userRepository.softDelete()
-- (backend/repositories/user.repository.js): every soft-deleted user before
-- this fix kept its original email/username/phone, which permanently
-- blocked recreating an account with those same values (the columns' plain
-- UNIQUE KEY constraints have no awareness of deleted_at). This mangles
-- already-soft-deleted rows the same way new deletes are now handled.
-- Idempotent: the WHERE guard skips rows already mangled by this or a
-- later run.
UPDATE users
SET email = CONCAT('deleted_user_', id, '@deleted.invalid'),
    username = CONCAT('deleted_user_', id),
    phone = CONCAT('deleted', id)
WHERE deleted_at IS NOT NULL
  AND email NOT LIKE 'deleted_user_%@deleted.invalid';
