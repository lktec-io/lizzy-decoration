# Changelog

All notable changes to JOZZY ERP are recorded here, newest first.

## Phase 11 — QR Codes

**Spec deviation, deliberate and documented:** `MASTER_PROMPT.md` says the QR payload should include Branch ID. Since Phase 0 locked in a shared-catalog architecture (one `products` row per SKU, stock tracked per branch in `inventory`), a product has no single branch to encode — baking one in would be wrong for anything stocked at multiple branches. Resolution: the QR encodes `{ productId, code, name, sellingPrice }` only; the scanning POS terminal supplies branch context from its own session at scan time, in Phase 17.

**Backend**
- `qrCode.service.js` generates via the `qrcode` package (installed since Phase 0), writing to `backend/uploads/qrcodes/`.
- Filenames are **versioned per regeneration** (`product-{id}-v{n}.png`), not overwritten in place — a stable filename that changes content would risk browsers serving a cached stale image after "Regenerate." The old file is deleted after the new one is written (best-effort, non-fatal on failure, same pattern as company logo / avatar replacement from Phases 2-3).
- `qr_codes` is treated as one row per product (upsert: update-in-place + increment `regenerated_count` if a row exists, insert otherwise) — matches the schema's audit-trail-via-counter design rather than keeping literal historical rows.

**Frontend**
- `QRCodeDisplay` (in `components/products/`): preview, Download (native `<a download>`), Print (opens a minimal print window with just the QR + product name/code — not the full page chrome), Regenerate. Embedded directly in the Product edit page rather than a separate route, consistent with every other module's "no dedicated detail page" pattern.
- `QRScanner` (in `components/common/`, reusable): wraps `html5-qrcode`'s camera scanning lifecycle. Not consumed by any page yet — Phase 17 (POS) is its first real user — and confirmed via the production build that an unused component with a real dependency (`html5-qrcode`) correctly contributes zero bytes to the bundle (tree-shaken), rather than silently bloating it while sitting unused.

**Verification**
- Backend dry-run: `GET /products/:id/qr` correctly 401s pre-auth.
- Frontend: Playwright with a real PNG fixture (not just a mocked JSON response) serving as the QR image, to confirm the `<img>` tag actually renders bytes rather than just a URL string — the QR card, product edit page layout, and all three action buttons screenshotted, zero console errors.

## Phase 10 — Inventory

**The most architecturally important backend piece so far:** `inventory.repository.js`'s `recordMovement()` is the single function every future stock-affecting phase (Purchases, POS, Transfers, Returns) will call instead of writing their own `UPDATE inventory` logic. Getting its contract right now avoids four future phases each reinventing (and potentially getting slightly wrong) the same stock-mutation rules.

**Backend**
- `recordMovement(data, externalConnection?)`: locks the inventory row with `SELECT ... FOR UPDATE`, creates it on first touch, computes `newStock`, rejects negative results with a `422` (enforced at the data layer, not just in a form — every future caller inherits this for free), updates `inventory.quantity`, and inserts the `inventory_movements` row — all in one transaction. Accepts an optional external DB connection specifically so a future POS checkout (sale + payment + inventory decrement, all-or-nothing) can pass its own transaction connection through instead of this function managing a separate one; called standalone (as Adjustments do today), it manages its own transaction.
- `inventory.service.js` is branch-scoped via Phase 5's `branchScope.js` throughout — list, summary, and movements all respect "Super Admin sees all, others see their branch(es)." Adjustment creation additionally checks the acting user actually has access to the target branch before recording anything.
- **Deliberately not implemented:** the adjustment approval workflow. The schema already supports it (`requires_approval`/`approved_by`/`approved_at`), but `MASTER_PROMPT.md` never specified a concrete threshold for when approval should trigger, and guessing one felt worse than being explicit that adjustments are currently auto-approved. Documented as a known gap in `docs/TODO.md` rather than silently skipped.
- Route-level permission split matches the Phase 0 seed data exactly: both `inventory.view` and `inventory.adjust` are required to create an adjustment, which correctly allows Store Keeper (has both) and blocks Manager (has `view` + `approve`, not `adjust`) — Manager's role is to approve, not adjust directly, per the spec's per-module permission tables.

**Frontend**
- `InventoryOverview`: summary KPI cards (reusing Phase 6's `KPICard`), branch/low-stock/out-of-stock filters, and a color-coded stock-level badge per row (green/amber/red) computed client-side from quantity vs. min-stock.
- `StockMovements`: full audit trail with signed quantity display (green `+12` / red `-3`) and a movement-type badge per row.
- Adjust Stock is a modal opened from the overview table (pre-filled with the product/branch context), not a separate page — consistent with how Categories/Brands/Roles handle small, single-purpose forms.

**Verification**
- Backend dry-run: `/inventory` and `/inventory/movements` correctly 401 pre-auth.
- Frontend: Playwright with mocked API — summary cards, stock-level badges (in/low/out), the Adjust Stock modal with correct product context, and the movement history table all screenshotted. Zero console errors.

## Phase 9 — Products

**Backend**
- `sequence.repository.js`: the reusable numbering engine `document_sequences` was designed for back in Phase 0. Uses MySQL's `INSERT ... VALUES (..., LAST_INSERT_ID(1)) ON DUPLICATE KEY UPDATE last_number = LAST_INSERT_ID(last_number + 1)` idiom — atomic and race-condition-safe under concurrent product creation without needing an explicit transaction or row lock. The `LAST_INSERT_ID(1)` on the insert branch (not just the update branch) was a deliberate fix — without it, the very first code for a new category/year would return the row's raw auto-increment `id` instead of `1`, since `LAST_INSERT_ID()` only applies automatically to a plain `INSERT`'s primary key, not to a manually named counter column.
- **Product codes are category-code-prefixed** (`CRT-2026-00001`, `WLD-2026-00001` — matches `MASTER_PROMPT.md`'s literal examples `SPR-2026-00001`/`DEC-2026-00001` exactly), reusing each category's existing unique `code` field from Phase 7 rather than inventing a separate prefix scheme. Each category gets its own counter (`document_type = PRODUCT_<categoryCode>`), so two categories' codes both correctly start at `00001`.
- Buying-price > selling-price guard: returns `422` with a structured `PRICE_OVERRIDE_REQUIRED` error code (not a generic message) so the frontend can distinguish "needs confirmation" from "actually invalid" and re-submit with `confirmPriceOverride: true`.
- `hasTransactionHistory(id)` checks `sale_items`/`purchase_items` before allowing delete — real queries against tables that exist since Phase 0, correctly permissive today and correctly protective once Purchases/POS ship.
- Product images reuse Phase 2's `createUploader` factory (subfolder `products`, 3MB limit) — third consumer after company logos and user avatars, no new upload plumbing needed.

**Frontend**
- `ProductList`: adds row-selection checkboxes + bulk activate/deactivate on top of the standard `useTable`/`Table` pattern — the first list page needing multi-select, kept local to this page rather than generalized into `Table` since nothing else needs it yet.
- `ProductForm`: image gallery (upload/remove/primary badge, edit-mode only — same reasoning as Phase 3's avatar upload, needs a product ID first) and the price-override confirmation flow (submit → catch `422` → inline warning banner with "Save Anyway" → resubmit with the confirmation flag, values preserved via React Hook Form's `getValues()`).
- No dedicated Product **detail** page — folded into the edit form, consistent with every list module so far (Users, Branches, Categories, Brands). A future QR/stock-focused detail view naturally belongs to Phase 10 (Inventory) and Phase 11 (QR Codes) once there's real stock/QR data to show.

**Explicitly deferred:** image compression/resizing. Multer validates type and a 3MB size cap but doesn't re-encode. Not a real problem yet at this scale — flagged to revisit (e.g. `sharp`) if upload sizes become an issue in practice, rather than adding a dependency preemptively.

**Verification**
- Backend dry-run: product endpoints correctly 401 pre-auth.
- Frontend: Playwright with mocked API — product list (generated codes, category/brand filters, bulk-action reveal on selection) and the complete price-override flow (intentionally submitted buying price 50,000 > selling price 30,000, confirmed the `422`+warning-banner+resubmit round-trip works end-to-end) both screenshotted. Zero console errors (the single 422 in the network log is the test intentionally exercising the rejection path, not a bug).

## Phases 7-8 — Categories & Brands (Master Prompt Phase 2: Inventory Management Engine begins)

Two small, near-identical catalog modules, built together. Both follow the exact CRUD-with-modal pattern established by `RoleList` (Phase 4) rather than a full separate form page — appropriate given each has only 3-4 fields.

**Backend**
- `category.repository.js`/`brand.repository.js`: standard CRUD plus `countProducts(id)` — a real query against the `products` table (which exists since Phase 0) that correctly returns 0 today and starts blocking deletion the moment Phase 9 ships products referencing a category/brand. No stubbing, same pattern as Phase 6's dashboard KPIs.
- Both enforce uniqueness on name *and* code (spec only mentioned name; code uniqueness is an obvious necessary addition since codes are meant to be short stable identifiers, e.g. for future product-code prefixing).
- `/active` lookup endpoints added preemptively for Phase 9's Product form dropdowns, mirroring the Branches pattern from Phase 5.

**Frontend**
- `CategoryList`/`BrandList`: `useTable` + `Table` + `Pagination` + `SearchInput` for the list, `Modal` + React Hook Form for create/edit, `ConfirmDialog` for delete. Zero new reusable infrastructure needed — this is the payoff of Phase 3's investment in shared components.

**Verification**
- Backend dry-run: both list endpoints correctly 401 pre-auth.
- Frontend: Playwright with mocked API — category list, the New Category modal, and the brand list (country column, active/inactive badges) all screenshotted, zero console errors.

## Phase 6 — Dashboard (completes Master Prompt Phase 1: Core ERP Foundation)

**The architectural payoff of Phase 0's complete-schema-upfront decision:** every KPI and chart the spec asks for (Sales, Purchases, Inventory, Customers, Suppliers, Car Wash, Transfers — none of which have their own CRUD/business-logic modules yet) can be queried for real right now, because all 42 tables already exist from Phase 0. No stub data, no hardcoded zeros, no TODO placeholders — genuine `SELECT`/`SUM`/`GROUP BY` queries against real tables that simply return 0/empty until Phases 7-21 start writing rows, then light up automatically with zero further backend work.

**Backend**
- `dashboard.repository.js`: all 14 KPIs (today/monthly sales & profit, customers, suppliers, products, inventory value, low-stock count, today/monthly expenses, car wash revenue, pending transfers/purchases) and all 8 chart types (sales/revenue/expense/profit trend, top products, branch performance, inventory summary, car wash summary). Profit is computed as `line_total - (quantity × buying_price)` per sale item, not stored redundantly.
- First real consumer of Phase 5's `branchScope.js`: every KPI/chart query is branch-scoped (`getAccessibleBranchIds`), so Super Admin sees everything and Managers/Cashiers see only their branch(es) — exactly the business rule that utility was built for, now proven end-to-end.
- Caught and fixed a fragile pattern while writing this: initially used `.replace('branch_id', 'i.branch_id')` string substitution to adapt a filter clause for a different table alias. Replaced with building the filter with the correct alias from the start — string-editing generated SQL fragments is a real correctness risk (silent wrong replacements) that isn't worth the shortcut.
- `GET /search`: global search, **users-only for now** — the only entity that exists. Response is `{ users: [...] }`, shaped to add `products`/`customers`/`suppliers`/etc. keys without a breaking change as later phases ship.

**Frontend**
- `components/charts/`: `LineChart`, `BarChart`, `DoughnutChart` — thin `react-chartjs-2` wrappers themed to the gold/black brand palette (`chartTheme.js` duplicates the CSS custom properties as hex constants, since Chart.js can't read CSS vars directly).
- `components/dashboard/`: `KPICard`, `ChartCard` (loading/empty states), `ActivityTimeline`, `QuickActions`.
- **Quick Actions are visibly disabled**, not hidden and not linking to dead pages — all 8 spec'd actions (New Sale, New Product, etc.) target routes that don't exist until Phases 8-21. This matches the master prompt's own Implementation Order (Dashboard is step 7, those pages are steps 8-21), so building working links now was never possible; each action flips to enabled the moment its owning phase adds the route.
- Navbar's search input (static since Phase 0) is now functionally wired: debounced query, dropdown results, click-outside-to-close, navigates to the matched user's edit page.
- `utils/formatCurrency.js`: `formatCurrency`/`formatNumber` via `Intl.NumberFormat`, currency defaults to TZS.

**Verification**
- Backend dry-run: all dashboard and search endpoints correctly 401 before authentication.
- Frontend: Playwright with mocked KPI/chart/activity/search responses — confirmed all 14 KPI cards, all 8 charts (rendering real Chart.js canvases, not placeholders), the activity timeline, the quick actions grid, and the wired search dropdown, all in one full-page screenshot. Zero console errors on what is by far the most complex page built so far.
- `vite build`: Dashboard is its own 198KB lazy chunk (Chart.js is heavy but only loads when the Dashboard route is visited) — the code-splitting work from Phase 5 paid off immediately.

## Phase 5 — Branches

**Backend**
- Full Branch CRUD. Deactivation is blocked while any user is still assigned to the branch (same pattern as Phase 4's role-deletion guard) — reassign staff first, then deactivate.
- `utils/branchScope.js`: `getAccessibleBranchIds(user)` returns `null` for Super Administrator (unrestricted) or the concrete list of accessible branch IDs (primary `branch_id` + `user_branches`) otherwise. This is infrastructure only for now — nothing branch-owned exists yet to scope (Sales, Purchases, Inventory, Expenses all come later) — but it's built once here so every later phase's service layer just calls it instead of reinventing branch-visibility logic.
- Split the branches endpoint in two: `GET /branches/active` (lightweight name+code lookup for dropdowns, any authenticated user — used by Phase 3's User form) vs. `GET /branches` (full paginated/searchable listing, requires `branches.view`). Existing frontend dropdown consumer updated to match.

**Frontend**
- `BranchList`/`BranchForm` follow the exact `useTable`/`Table`/`Pagination` pattern established in Phase 3 — lint passed clean on the first try this time, confirming the pattern is now genuinely reusable rather than one-off.
- Manager assignment dropdown pulls from the Users list (`userService.listUsers`).

**Performance (opportunistic, not originally scoped here)**
- `vite build` started warning about a >500kB chunk once Branches pushed the bundle over the threshold. Converted every route-level page import in `AppRouter.jsx` to `React.lazy()` wrapped in a single `Suspense`, using the same spinner as `ProtectedRoute`'s loading state. Largest chunk dropped from 507kB to 307kB, with every page now its own small on-demand chunk. This is the pattern all future phases' routes should follow — established now while there are only ~13 routes, rather than retrofitting it across 40+ later.

**Verification**
- Backend dry-run: both branch endpoints correctly 401 pre-auth.
- Frontend: Playwright with mocked API — BranchList shows resolved manager names and active/inactive badges, BranchForm's manager dropdown populates correctly, lazy-loaded chunks load without errors. Zero console errors.

## Phase 4 — Roles & Permissions (Role CRUD + Permission Matrix)

Completes the RBAC module — the permission-check middleware and `usePermission` hook already shipped in Phase 2 when Company Settings needed them first.

**Backend**
- `role.repository.js`: full CRUD plus `countUsersWithRole` (blocks deletion while any user still holds the role). `permission.repository.js`: `replaceForRole` wraps the delete+bulk-insert in a real transaction (rollback on failure) rather than two unguarded statements.
- Business rules in `role.service.js`: system roles (`is_system=true`) cannot be renamed or deleted regardless of caller permissions — this is a code-level guarantee, not just a missing DELETE button; role name uniqueness checked on both create and update.
- `middlewares/authorize.js`'s permission cache is invalidated (`invalidatePermissionCache(roleId)`) whenever a role's permission set changes, so updates take effect immediately instead of waiting out the 60-second cache window.
- Routes: `GET /roles` stays public-to-any-authenticated-user (unchanged from Phase 3, used by dropdowns elsewhere); everything else (`POST/PUT/DELETE /roles`, `GET/PUT /roles/:id/permissions`, `GET /roles/permissions/catalog`) requires the matching `roles.*` permission.

**Frontend**
- `RoleList.jsx`: table + create/edit modal (2 fields — name, description); delete action hidden entirely for system roles rather than shown-then-rejected.
- `PermissionMatrix.jsx`: a genuine matrix — permissions grouped by module as rows, roles as columns, checkbox per cell. Fetches every role's current permission set in parallel on load, tracks edits locally, and on Save diffs against the original per role so only roles that actually changed get a `PUT` call (not all of them). The Super Administrator column is rendered checked-and-disabled — editable Super Admin permissions risk locking out the only admin account with no recovery path, so it's structurally prevented rather than just discouraged.
- Added "Roles" to the Sidebar between Users and Customers (the spec's sidebar list doesn't itemize it separately, but it needs a way in — nested/grouped sidebar sections aren't built yet, so it's a flat top-level entry for now, matching how Settings was handled in Phase 2).

**Verification**
- Backend dry-run: role + permission-catalog endpoints correctly 401 before authentication.
- Frontend: Playwright with mocked API responses (same technique as Phase 3, still no live DB in this session) — confirmed RoleList's System/Custom badges and conditional delete button, the New Role modal, and the full PermissionMatrix grid rendering grouped checkboxes with the locked Super Admin column. Zero console errors.

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
