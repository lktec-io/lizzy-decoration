# Changelog

All notable changes to JOZZY ERP are recorded here, newest first.

## Phase 3 — User Management

**Backend**
- Extended `user.repository.js` (previously auth-only) with `findAll` (paginated, searchable across name/email/username/phone, filterable by role/branch/status), `findConflict` (uniqueness check across email/username/phone in one query, excludes self on edit), `update`, `updateStatus`, `updateAvatarPath`, `softDelete`, and `getBranchIds`/`setBranches` for the `user_branches` many-to-many.
- `user.service.js` enforces two self-protection rules not in the spec but necessary given there's exactly one Super Admin at bootstrap: you cannot change your own status or delete your own account via this endpoint (prevents accidental self-lockout with no other admin to recover).
- List endpoints now return `data: { items, meta }` (`meta` = `{ page, limit, total, totalPages }`) — establishes the pagination envelope convention every future list endpoint follows.
- Minimal read-only pull-forwards (list-only, no create/edit): `GET /branches` and `GET /roles`, needed for the User form's dropdowns. Full Branch CRUD (Phase 5) and Role CRUD/Permission Matrix (Phase 4) are unaffected — these are just lookups.

**Frontend — new reusable infrastructure** (every future list page reuses this instead of duplicating table logic):
- `useTable(fetchFn)`: pagination + debounced search + filters + sort state, wired to any `fetchFn(params) -> { items, meta }`. Hit React 19's stricter `react-hooks/set-state-in-effect` lint rule on two textbook-standard patterns (fetching data in an effect, resetting to page 1 when search/filters change); resolved with targeted, documented disables rather than contorting the code, after confirming both patterns are the React docs' own recommended approach.
- `components/common/`: `Table` (sortable headers, loading/empty states), `Pagination`, `SearchInput` (debounced), `Modal` (Framer Motion enter/exit, portal-rendered, Escape/backdrop close), `ConfirmDialog` (built on `Modal`, loading-aware confirm button).
- `usePermission`-gated row actions (edit/suspend/delete) — hidden client-side for UX, independently enforced server-side per-route.

**Verification**
- Backend dry-run: `/users`, `/branches`, `/roles` all correctly return 401 before authentication, without touching the DB layer.
- Frontend: since no live database is available in this session, used Playwright's request interception to mock `/auth/refresh`, `/company`, `/users`, `/roles`, `/branches` with realistic JSON matching the real API contract — this renders the *actual* React components (real `MainLayout`, real `Table`, real form validation) against fake data rather than testing nothing. Confirmed: UserList table with status badges and pagination, UserForm create with populated role/branch dropdowns, UserForm edit with correctly pre-filled fields and multi-select branch state. Zero uncaught JS errors.

## Phase 2 — Company Settings

**RBAC pulled forward from Phase 4** (only the piece Company Settings actually needed):
- `repositories/permission.repository.js` + `middlewares/authorize(permissionCode)`: DB-driven permission check with a 60-second in-memory per-role cache (avoids a query on every request while staying correct within a short staleness window). `invalidatePermissionCache()` exported for Phase 4's Role Management UI to call when permissions change.
- `/auth/login`, `/auth/refresh`, `/auth/me` now all return `permissions: string[]` for the current user's role (previously just the sanitized user row).
- Frontend: `AuthContext.hasPermission(code)` + a thin `usePermission(code)` hook.
- Explicitly **not** pulled forward: Role CRUD endpoints/UI and the Permission Matrix editor — those remain Phase 4 scope. `docs/TODO.md` updated to show Phase 4's remaining scope accurately rather than re-listing already-shipped items.

**Backend**
- `company_settings` is a single-row table — `company.service.js` does get-or-insert-then-update (no seed row, since a fresh business's profile shouldn't be pre-filled with placeholder data).
- `middlewares/upload.js`: a reusable Multer factory (`createUploader({ subfolder, allowedMimeTypes, maxSizeMb })`) — the logo endpoint is the first consumer; product images, avatars and receipts will reuse it in later phases instead of duplicating Multer config.
- Logo upload validates MIME type + 2MB limit, stores under `backend/uploads/logo/`, deletes the previous logo file on replace (non-fatal if already gone), and is served via `express.static('/uploads')`.
- **`GET /company` is deliberately public** (no `authenticate`) — the Login page needs the name/logo before a session exists. Safe here because this is a single-tenant system (one company's own public-facing profile, not another tenant's private data); `PUT`/`POST /company/logo` still require `authenticate` + `authorize('company.manage')`.

**Frontend**
- New `CompanyContext`/`useCompany()` (mirrors the `AuthContext` pattern) fetches the company profile once at the app root and is consumed by `AuthLayout` (login page brand), `Sidebar` (logo replaces the "JOZZY" text mark when set), and `Navbar` (a small logo shown only ≤768px, since the sidebar already carries the brand on desktop — added specifically for when the sidebar is off-screen on mobile).
- `CompanySettings.jsx`: full form matching every field in `MASTER_PROMPT.md`'s Module 1, immediate-upload logo picker with preview, and a read-only mode (all fields disabled, no save/upload controls) for users without `company.manage` — the frontend gate is UX only, the backend still enforces it independently per the spec's "never rely only on frontend hiding buttons" rule.
- Routed at `/settings/company`; Sidebar's "Settings" link now points there (temporary — Phase 23 will turn `/settings` into a hub with Company as one tab among several).

**Verification**
- Backend dry-run (still no live DB): confirmed `GET /company` is reachable pre-auth and fails safely (generic 500, DB unreachable) rather than 404/leaking a DB error; confirmed `PUT /company` correctly returns 401 before authentication is checked.
- Caught and fixed a real bug during dry-run testing: a stale backend process from earlier manual testing survived a `pkill -f` (unreliable against Windows-spawned node processes from Git Bash) and was silently serving pre-Phase-2 routes, producing misleading 404s. Resolved by enumerating and force-stopping node processes via PowerShell `Get-CimInstance`/`Stop-Process` instead of `pkill`, then re-verified cleanly.
- Frontend verified in-browser: Login page renders correctly with `CompanyProvider` added (falls back to the "JOZZY" text mark when no company row exists yet, exactly as designed), zero uncaught JS errors.

## Phase 1 — Authentication

**Backend**
- Built the full auth stack following the layered architecture: `repositories/` (user, role, session, refreshToken, passwordReset, activityLog — pure SQL, no logic) → `services/auth.service.js` (all business rules) → `controllers/auth.controller.js` (thin, cookie handling only) → `routes/auth.routes.js`.
- JWT design: short-lived access token (15m, in-memory on the client) + long-lived refresh token (JWT signed with a separate secret, 30d with "remember me" / 1d without), stored **stateful** — hashed (SHA-256) and persisted in `refresh_tokens`/`sessions` so it can be revoked, combining stateless verification with DB-backed revocation and device tracking.
- Refresh token delivered as an **httpOnly, `sameSite=lax` cookie** scoped to `/api/v1/auth`; `secure` flag tied to `NODE_ENV=production`. Refresh rotation on every use (old token revoked, new one issued on the same session).
- Account lockout: 5 failed attempts within 15 minutes → 15-minute lock, via a single atomic `UPDATE ... IF(...)` to avoid a race between concurrent failed attempts.
- Forgot/reset password: random 32-byte token (hashed before storage, 30-minute expiry), always returns a generic success message regardless of whether the email exists (prevents user enumeration), and revokes all of the user's sessions on a successful reset (forces re-login everywhere).
- `email.service.js` never throws — if SMTP isn't configured (no `SMTP_HOST`), it logs to `email_logs` with a clear reason and the request still succeeds, so the auth flow works end-to-end even before production email is configured.
- Centralized `authenticate` middleware (JWT verify only); the DB-driven permission-check middleware is deliberately deferred to Phase 4 (Roles & Permissions) per `docs/TODO.md` — Phase 1's endpoints only need "authenticated or not," not granular permission codes.
- **`npm run seed:admin`** (`backend/database/seeders/create-admin.js`): interactive (or env-var-driven) CLI to create the first Super Administrator. No credentials are hardcoded anywhere — this solves the bootstrap problem left open in Phase 0 (no default admin was seeded in SQL, by design).

**Frontend**
- `src/services/apiClient.js`: Axios instance with an automatic-refresh interceptor (401 → single in-flight `/auth/refresh` call, shared across concurrent failed requests → retry once → on failure, clear state and redirect to Session Expired).
- `vite.config.js` now proxies `/api` to `http://localhost:4000` in dev, and `VITE_API_URL` defaults to the relative `/api/v1` — keeps frontend and backend same-origin (dev proxy, prod via Nginx) so the httpOnly cookie works without needing `SameSite=None`+HTTPS in local dev.
- `AuthContext` (provider in `AuthContext.jsx`, context object split into `authContextInstance.js` to satisfy React Fast Refresh's one-export-per-file rule) attempts a silent `/auth/refresh` on mount to restore a session across page reloads.
- `ProtectedRoute` gates the authenticated app shell; unauthenticated visitors are redirected to `/login` with the originally-requested path preserved for post-login redirect.
- Built `Login`, `ForgotPassword`, `ResetPassword` (reads `?token=`, client-side password-policy validation mirroring the backend), and `SessionExpired` pages — all using React Hook Form, the shared `forms.css`/`buttons.css` design system, loading-disabled submit buttons, and inline field + form-level error handling.
- Wired the real `logout()` into the Sidebar's Logout button and real user name/initials/branch into the Navbar (previously static placeholders from Phase 0).

**Verification**
- Backend verified without a live database: syntax-checked, dry-imported, then a persistent DB-less instance was booted to confirm the health check, express-validator error shapes, and the `authenticate` middleware's 401 responses (structured JSON, no stack trace leaked — confirmed via Winston log vs. HTTP response comparison).
- Frontend verified in a real browser (headless Edge via Playwright) against that same DB-less backend: unauthenticated root correctly redirects to `/login`; client-side validation fires; a login attempt correctly surfaces a safe generic error when the backend's DB call fails; Forgot Password, Reset-Password-without-token, and Session Expired pages all render and navigate correctly; zero uncaught JS errors (only expected 401/500 network log entries from the deliberately DB-less backend).
- **Not verified**: a full live login round-trip against a real MySQL instance, since production DB credentials are intentionally out of this session's scope (owner-managed). The project owner should run `npm run seed:admin` after applying the schema and do a first real login as a final smoke test.

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
