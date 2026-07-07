# Changelog

All notable changes to JOZZY ERP are recorded here, newest first.

## Phase 0 — Project Setup

**Planning**
- Added `docs/PROJECT_PLAN.md`, `docs/TODO.md`, `docs/DATABASE_PLAN.md`, `docs/API_PLAN.md`, `docs/FOLDER_STRUCTURE.md` capturing architecture decisions, the phase plan, and the full schema/API contract.
- Resolved four spec ambiguities with the user: gold/black brand palette is canonical (not the navy/green corporate palette also present in `MASTER_PROMPT.md`); products are a shared catalog with per-branch `inventory` rows (not duplicated per branch); Chart.js + react-chartjs-2 added for dashboard charts (spec required charts but named no library); `html5-qrcode` added for in-browser camera QR scanning in POS.

**Frontend**
- Installed the approved dependency set: `react-router-dom`, `axios`, `react-hook-form`, `framer-motion`, `react-icons`, `chart.js`, `react-chartjs-2`, `html5-qrcode`.
- Built the full `src/` folder structure per `docs/FOLDER_STRUCTURE.md`.
- Built the design system: `variables.css`, `colors.css` (gold/black brand palette), `typography.css` (Poppins), `spacing.css`, `buttons.css`, `forms.css`, `tables.css`, `cards.css`, `layout.css`, `animations.css`, `responsive.css`, `utilities.css`, `theme.css`.
- Built layout shells: `AuthLayout`, `MainLayout` (with `Sidebar` — full nav menu, collapsible — and `Navbar` — branch selector, search, notifications, user menu, live clock), `ErrorLayout`.
- Wired `AppRouter` with placeholder `Login` and `Dashboard` pages and a `NotFound404` page; verified all three render correctly with zero console errors via a headless-browser check (screenshots reviewed).
- Replaced the default Vite scaffold (`App.jsx`, `App.css`, `README.md`, `index.html` title/meta) and removed now-unused scaffold assets (`react.svg`, `vite.svg`, `hero.png`, `public/icons.svg`).

**Backend**
- Scaffolded `backend/` as a sibling to the existing frontend root (intentional deviation from the spec's `client/`+`backend/` example — the Vite app already lives at the repo root and the spec forbids relocating it; documented in `docs/FOLDER_STRUCTURE.md` §1).
- Installed runtime dependencies (express, mysql2, jsonwebtoken, bcrypt, express-validator, helmet, express-rate-limit, cors, cookie-parser, multer, qrcode, pdfkit, exceljs, json2csv, node-cron, nodemailer, dotenv, winston) and dev dependencies (nodemon, eslint).
- Built the Express app skeleton: `config/` (env validation, MySQL pool, CORS, winston logger), `middlewares/` (centralized error handler that never leaks stack traces or raw SQL errors, rate limiter), `utils/` (`apiResponse`, `apiError`, `asyncHandler`), `routes/index.js` with a `/api/v1/health` check.
- Verified the full request pipeline (Helmet → CORS → rate limiter → routing → error handling → response envelope) end-to-end with a live request against an ephemeral port, using only in-process dummy environment variables — no `.env` file was created and no database was touched.

**Database**
- Wrote the complete schema as 10 numbered migrations (`backend/database/migrations/001`–`010`, 42 tables) covering every module in `docs/DATABASE_PLAN.md`: auth/RBAC, branches, company/system settings, sessions/tokens, catalog & inventory (with the immutable `inventory_movements` ledger), purchases & suppliers, sales/POS/returns, stock transfers, expenses, car wash, notifications/activity/audit logs.
- Resolved the `branches`↔`users` circular foreign key (branch manager vs. user's home branch) by creating `branches` without the manager FK first, then `users`, then adding the deferred `ALTER TABLE` constraints.
- Added a combined `backend/database/schema.sql` (concatenation of all migrations) and `backend/database/README.md` documenting apply order and the reasoning behind schema decisions.
- Seeded safe, static reference data only: the 4 system roles, the full permission catalog, a role→permission mapping derived from `MASTER_PROMPT.md`'s per-module `PERMISSIONS` sections, default expense categories, and default car wash services. Deliberately did **not** seed a default Super Admin account (see `backend/database/README.md` for the security reasoning) — the first admin is created interactively once Phase 1 (Authentication) ships.
- Statically verified all 42 tables' foreign keys resolve to already-declared tables (no forward references) and that every migration file is syntactically balanced — without requiring a live database connection, since production database provisioning is being handled directly by the project owner on their Contabo MySQL server.

**Refinements to `docs/DATABASE_PLAN.md`**
- Clarified that pure join tables (`role_permissions`, `user_branches`) intentionally omit `updated_by`/`updated_at`/`deleted_at` (insert/delete only, never updated) — a refinement made while writing the actual DDL.
