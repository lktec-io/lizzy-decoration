# Database Setup

Plain `.sql` files, applied manually — no migration framework/CLI is installed. Matches `docs/DATABASE_PLAN.md`.

## Apply order

Run the numbered files in `migrations/` in order, then `seeders/` in order:

```bash
mysql -u <user> -p jozzy_erp < migrations/001_create_roles_permissions.sql
mysql -u <user> -p jozzy_erp < migrations/002_create_branches_users.sql
mysql -u <user> -p jozzy_erp < migrations/003_create_settings_sessions.sql
mysql -u <user> -p jozzy_erp < migrations/004_create_catalog_inventory.sql
mysql -u <user> -p jozzy_erp < migrations/005_create_purchases_suppliers.sql
mysql -u <user> -p jozzy_erp < migrations/006_create_sales_pos.sql
mysql -u <user> -p jozzy_erp < migrations/007_create_stock_transfers.sql
mysql -u <user> -p jozzy_erp < migrations/008_create_expenses.sql
mysql -u <user> -p jozzy_erp < migrations/009_create_carwash.sql
mysql -u <user> -p jozzy_erp < migrations/010_create_notifications_logs.sql

mysql -u <user> -p jozzy_erp < seeders/001_seed_roles_permissions.sql
mysql -u <user> -p jozzy_erp < seeders/002_seed_reference_data.sql
```

Or apply everything in one shot with the concatenated `schema.sql` in this directory (migrations only — run seeders separately after):

```bash
mysql -u <user> -p jozzy_erp < schema.sql
mysql -u <user> -p jozzy_erp < seeders/001_seed_roles_permissions.sql
mysql -u <user> -p jozzy_erp < seeders/002_seed_reference_data.sql
```

All files are written with `CREATE TABLE IF NOT EXISTS` / `INSERT IGNORE`, so re-running them is safe.

## Why the FK ordering looks the way it does

`branches.manager_id` references `users.id`, and `users.branch_id` references `branches.id` — a genuine circular dependency. `002_create_branches_users.sql` resolves it by creating `branches` first without the manager FK, then `users`, then adding the deferred `ALTER TABLE ... ADD CONSTRAINT` for `branches.manager_id` plus the `created_by`/`updated_by` FKs on `roles`, `permissions` and `branches` (all three were created before `users` existed).

## What's deliberately NOT seeded

- **No default Super Admin user.** Seeding a shipped, guessable initial credential (even a bcrypt hash of a "default" password) is a real production risk if this repo or the SQL file is ever exposed. Create the first Super Administrator interactively once the Auth module (Phase 1) is live — see `docs/TODO.md`.
- **Car wash service prices in `002_seed_reference_data.sql` are placeholders** (5,000 / 10,000 / 8,000 / 12,000 TZS) so the module isn't empty out of the box. Adjust them via the Car Wash settings UI once built, or edit the seeder before running it.
- Everything else seeded (roles, permission catalog, role→permission mapping, expense categories) is static reference data with no secrets, matching what `MASTER_PROMPT.md` explicitly enumerates.

## Role → permission mapping source

`seeders/001_seed_roles_permissions.sql` encodes the per-role access described across `MASTER_PROMPT.md`'s per-module `PERMISSIONS` sections (Inventory, POS, Purchases, Transfers, Expenses, Car Wash). Where the spec is silent for a module/role combination (e.g. Store Keeper and Expenses), the seeder grants no access — safer to add later via the Role Management UI (Phase 4) than to over-grant now.
