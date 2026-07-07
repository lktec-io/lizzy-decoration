# JOZZY ERP — TODO

The heart of the project. Every task lives here. Checked items are never deleted, only marked complete with a date. Update this file immediately after finishing any task — never batch updates.

Legend: Priority = Critical / High / Medium / Low. Status = ☐ Not Started / ▶ In Progress / ☑ Done.

---

## Phase 0 — Project Setup

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☑ | Install frontend deps: react-router-dom, axios, react-hook-form, framer-motion, react-icons, chart.js, react-chartjs-2, html5-qrcode | Critical | Setup | 2026-07-07 |
| ☑ | Replace default `App.jsx`/`App.css`/`README.md` Vite scaffold content | Critical | Setup | 2026-07-07 |
| ☑ | Create `src/` subfolders per `FOLDER_STRUCTURE.md` | Critical | Setup | 2026-07-07 |
| ☑ | Scaffold `backend/` (Express app, `package.json`, folder tree) | Critical | Setup | 2026-07-07 |
| ☑ | Install backend deps: express, mysql2, jsonwebtoken, bcrypt, express-validator, helmet, express-rate-limit, cors, cookie-parser, multer, qrcode, pdfkit, exceljs, json2csv, node-cron, nodemailer, dotenv, winston | Critical | Setup | 2026-07-07 |
| ☑ | Create `.env.example` (frontend + backend) — pure placeholders, no real secrets | Critical | Setup | 2026-07-07 |
| ☑ | Set up MySQL connection pool + config (reads exclusively from env vars, no hardcoded fallback credentials) | Critical | Setup | 2026-07-07 |
| ☑ | Set up base Express app: Helmet, CORS, rate limiter, JSON body parser, centralized error handler | Critical | Setup | 2026-07-07 |
| ☑ | Set up React Router skeleton + `AuthLayout`/`MainLayout` shells | Critical | Setup | 2026-07-07 |
| ☑ | Configure ESLint for backend (mirror frontend strictness) | High | Setup | 2026-07-07 |
| ☑ | Write complete database schema: 10 migrations, 42 tables, FK-order statically verified + seeders (roles/permissions/expense categories/carwash services) + `schema.sql` | Critical | Setup | 2026-07-07 |
| ☑ | Verify `npm run build` and `npm run lint` pass on frontend | Critical | Setup | 2026-07-07 |
| ☑ | Verify backend structure without a live DB: syntax check every file, dry-import `app.js`, live health-check request on an ephemeral port | Critical | Setup | 2026-07-07 |
| ☑ | Initialize git repository, initial commit | High | Setup | 2026-07-07 |

**Note:** production database provisioning (creating the DB/user, writing the real `backend/.env`, running the migrations, final connection test) is being handled directly by the project owner on their Contabo MySQL server — not part of this repo's automated setup.

## Phase 1 — Authentication

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☑ | DB: `users`, `sessions`, `refresh_tokens`, `password_resets` tables + migrations | Critical | Auth | 2026-07-07 (Phase 0) |
| ☑ | Backend: register password hashing (bcrypt, cost 12) | Critical | Auth | 2026-07-07 |
| ☑ | Backend: login endpoint — JWT access token + refresh token (httpOnly cookie) | Critical | Auth | 2026-07-07 |
| ☑ | Backend: refresh-token rotation endpoint | Critical | Auth | 2026-07-07 |
| ☑ | Backend: logout current device / logout all devices | Critical | Auth | 2026-07-07 |
| ☑ | Backend: account lockout after 5 failed attempts / 15 min | High | Auth | 2026-07-07 |
| ☑ | Backend: forgot password → email token → reset password flow (Nodemailer) | Critical | Auth | 2026-07-07 |
| ☑ | Backend: device/session tracking on login (IP, user agent) | Medium | Auth | 2026-07-07 |
| ☑ | Backend: bootstrap `npm run seed:admin` CLI to create the first Super Administrator | Critical | Auth | 2026-07-07 |
| ☑ | Frontend: Login page (logo, email, password, remember me, forgot password link, loading state, validation) | Critical | Auth | 2026-07-07 |
| ☑ | Frontend: Forgot Password / Reset Password pages | Critical | Auth | 2026-07-07 |
| ☑ | Frontend: Session Expired page + auto token refresh via Axios interceptor | High | Auth | 2026-07-07 |
| ☑ | Frontend: `AuthContext` + `ProtectedRoute` | Critical | Auth | 2026-07-07 |
| ☑ | Business rule: block login for inactive/deleted/suspended/locked users | Critical | Auth | 2026-07-07 |
| ☑ | Quality Check: build/lint pass, backend verified via dry-run (health/validation/auth-guard), frontend flows verified in-browser against a DB-less backend (login redirect, validation, error handling, forgot/reset/session-expired pages). Full live-DB login round-trip deferred to the project owner's environment where real MySQL credentials exist. | Critical | Auth | 2026-07-07 |

## Phase 2 — Company Settings

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☑ | DB: `company_settings` table (single-row) | Critical | Company | 2026-07-07 (Phase 0) |
| ☑ | Backend: get/update company profile (Super Admin only, via `authorize('company.manage')`) | Critical | Company | 2026-07-07 |
| ☑ | Backend: logo upload (Multer, type/size validation, static `/uploads` serving, old file cleanup on replace) | Critical | Company | 2026-07-07 |
| ☑ | Frontend: Company Settings page (all fields per spec, read-only for non-Super-Admins) | Critical | Company | 2026-07-07 |
| ☑ | Wire company logo into: Sidebar, Navbar (mobile), Login page, via a shared `CompanyContext` | High | Company | 2026-07-07 |
| ☑ | *(Pulled forward from Phase 4, needed for "Super Admin only")*: DB-driven `authorize(permissionCode)` middleware, `permission.repository.js`, `/auth/me` now returns `permissions[]`, frontend `usePermission` hook | Critical | RBAC | 2026-07-07 |
| ☑ | Quality Check: build/lint pass on both apps; backend dry-run confirms public `GET /company` reaches the DB layer (safe 500, DB-less) and `PUT /company` is correctly blocked pre-auth; frontend verified in-browser (Login page unaffected by the new `CompanyProvider`, graceful fallback to text brand mark when no company row exists yet) | Critical | Company | 2026-07-07 |

## Phase 3 — User Management

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☑ | Backend: Users CRUD (create/edit/soft-delete) | Critical | Users | 2026-07-08 |
| ☑ | Backend: activate/suspend/lock user (self-modification blocked) | Critical | Users | 2026-07-08 |
| ☑ | Backend: admin-triggered password reset | High | Users | 2026-07-08 |
| ☑ | Backend: assign role + branch(es) to user (`user_branches` for multi-branch managers) | Critical | Users | 2026-07-08 |
| ☑ | Frontend: User list (search, filter, paginate) — built on new reusable `Table`/`Pagination`/`SearchInput`/`useTable` infra, reused by every list page from here on | Critical | Users | 2026-07-08 |
| ☑ | Frontend: User create/edit form + avatar upload | Critical | Users | 2026-07-08 |
| ☑ | Validation: unique username, unique email, phone format (backend `findConflict`, express-validator) | Critical | Users | 2026-07-08 |
| ☑ | *(Minimal pull-forward, read-only lookups only)*: `GET /branches` and `GET /roles` for dropdowns — full CRUD stays Phase 5/Phase 4 scope | Critical | Users | 2026-07-08 |
| ☑ | Quality Check: build/lint pass both apps; backend dry-run confirms `/users`, `/branches`, `/roles` all correctly 401 pre-auth; frontend verified via Playwright with mocked API responses (real components + real MainLayout shell rendering realistic data) since a live DB isn't available in this session — UserList table/badges/pagination, UserForm create, and UserForm edit (pre-filled) all screenshotted and confirmed | Critical | Users | 2026-07-08 |

## Phase 4 — Roles & Permissions

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☑ | DB: `roles`, `permissions`, `role_permissions` tables | Critical | RBAC | 2026-07-07 (Phase 0) |
| ☑ | Seed default roles: Super Administrator, Manager, Cashier, Store Keeper | Critical | RBAC | 2026-07-07 (Phase 0) |
| ☑ | Seed permission catalog (view/create/edit/delete/approve/export/print + module-manage permissions) | Critical | RBAC | 2026-07-07 (Phase 0) |
| ☑ | Backend: permission-check middleware (DB-driven, no hardcoding) — pulled forward to Phase 2, `middlewares/authorize.js` + `repositories/permission.repository.js` | Critical | RBAC | 2026-07-07 (Phase 2) |
| ☑ | Backend: role CRUD (support future custom roles; system roles' names locked, deletion blocked if in use) | High | RBAC | 2026-07-08 |
| ☑ | Frontend: Role management + permission matrix UI (module-grouped grid, per-role diffing so only changed roles are saved, Super Administrator locked to full access) | High | RBAC | 2026-07-08 |
| ☑ | Frontend: `usePermission` hook + permission-gated UI elements — pulled forward to Phase 2, used by `CompanySettings.jsx` | Critical | RBAC | 2026-07-07 (Phase 2) |
| ☑ | Quality Check: build/lint pass both apps; backend dry-run confirms role/permission-catalog endpoints 401 pre-auth; frontend verified via Playwright with mocked API — RoleList (System/Custom badges, delete hidden for system roles), New Role modal, and PermissionMatrix (grouped checkboxes, locked Super Admin column) all screenshotted with zero console errors | Critical | RBAC | 2026-07-08 |

## Phase 5 — Branches

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☑ | DB: `branches`, `user_branches` tables | Critical | Branches | 2026-07-07 (Phase 0) |
| ☑ | Backend: Branch CRUD, deactivate (blocked while users still assigned), assign manager | Critical | Branches | 2026-07-08 |
| ☑ | Backend: `utils/branchScope.js` — `getAccessibleBranchIds(user)` helper (Super Admin → `null`/unrestricted, others → their branch + `user_branches`). Built now as reusable infra; real enforcement begins once branch-owned data exists (Sales, Purchases, Inventory, Expenses in later phases) | Critical | Branches | 2026-07-08 |
| ☑ | Frontend: Branch list/create/edit pages (detail page folded into edit — matches the Users/Roles pattern, no separate read-only view built) | Critical | Branches | 2026-07-08 |
| ☑ | Business rule: Super Admin sees all, Manager sees assigned branches, Cashier sees assigned branch only — encoded in `branchScope.js`, consumed starting Phase 14+ | Critical | Branches | 2026-07-08 |
| ☑ | Quality Check: build/lint pass both apps (fixed on first pass — the `useTable`/`Table` pattern from Phase 3 is now well-established); backend dry-run confirms `/branches` and `/branches/active` 401 pre-auth; frontend verified via Playwright with mocked API — BranchList (active/inactive badges, resolved manager names) and BranchForm (manager dropdown) screenshotted, zero console errors | Critical | Branches | 2026-07-08 |

**Bonus (not originally scoped to this phase, done opportunistically):** converted all route-level page imports in `AppRouter.jsx` to `React.lazy()` + `Suspense` after `vite build` started warning about a >500kB chunk. Every future page follows this pattern automatically. Largest chunk dropped from 507kB to 307kB with the rest split into small per-page chunks.

## Phase 6 — Dashboard

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☑ | Backend: KPI aggregation endpoint — all 14 KPIs from the spec, querying the real tables built in Phase 0 (correctly returns 0 until Sales/Purchases/Inventory/etc. start writing data in later phases; no stubbing needed since the full schema already existed) | Critical | Dashboard | 2026-07-08 |
| ☑ | Backend: chart data endpoints — all 8 types (sales/revenue/expense/profit trend, top products, branch performance, inventory summary, car wash summary), `GET /dashboard/charts/:type` | Critical | Dashboard | 2026-07-08 |
| ☑ | Backend: recent activity timeline endpoint (reuses `activityLog.repository.js` from Phase 1) | High | Dashboard | 2026-07-08 |
| ☑ | Backend: global search endpoint — **users only** for now (the only searchable entity that exists); response shape is grouped by entity type so products/customers/suppliers/etc. slot in without a breaking change as their phases ship | High | Dashboard | 2026-07-08 |
| ☑ | Backend: all KPIs/charts respect branch scoping via Phase 5's `branchScope.js` — first real consumer of that utility | Critical | Dashboard | 2026-07-08 |
| ☑ | Frontend: KPI cards — all 14, `formatCurrency`/`formatNumber` utilities added | Critical | Dashboard | 2026-07-08 |
| ☑ | Frontend: Chart.js charts — all 8 types via reusable `LineChart`/`BarChart`/`DoughnutChart` wrappers themed to the brand palette | Critical | Dashboard | 2026-07-08 |
| ☑ | Frontend: Recent Activity timeline | High | Dashboard | 2026-07-08 |
| ☑ | Frontend: Quick Action buttons — all 8 from the spec, rendered visibly disabled ("coming soon") since every target page is a later phase (matches the master prompt's own Implementation Order — Dashboard is step 7, those pages are steps 8-21); each lights up automatically once its phase ships | Medium | Dashboard | 2026-07-08 |
| ☐ | Frontend: Notification panel widget | High | Dashboard | *(deferred to Phase 22 — nothing generates real notifications yet; premature to build now)* |
| ☑ | Frontend: Navbar — logo, branch selector, **search now functionally wired** (debounced, dropdown results, click-outside-to-close), notifications icon (visual only, Phase 22), avatar, date/time | Critical | Dashboard | 2026-07-08 |
| ☑ | Frontend: Sidebar (collapsible, active-highlight, full menu) — shipped incrementally since Phase 0, confirmed complete here | Critical | Dashboard | 2026-07-08 |
| ☑ | Quality Check: build/lint pass both apps (zero chunk-size warnings after Phase 5's code-splitting); backend dry-run confirms all dashboard/search endpoints 401 pre-auth; frontend verified via Playwright with mocked KPI/chart/activity/search data — full-page screenshot confirms all 14 KPI cards, all 8 charts, activity timeline, quick actions, and the wired search dropdown all render correctly with zero console errors | Critical | Dashboard | 2026-07-08 |

**Milestone:** this completes `MASTER_PROMPT.md`'s "Phase 1 — Core ERP Foundation" (Company, Auth, Users, Roles/Permissions, Branches, Dashboard). Every subsequent phase builds catalog/transactional modules on top of this foundation.

## Phase 7 — Categories

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☑ | DB: `categories` table | Critical | Categories | 2026-07-07 (Phase 0) |
| ☑ | Backend: CRUD + soft delete blocked if products exist (real `COUNT(*) FROM products WHERE category_id = ?` check — correctly 0 until Phase 9 ships) | Critical | Categories | 2026-07-08 |
| ☑ | Frontend: Category list/create/edit (modal pattern, matches `RoleList`) | Critical | Categories | 2026-07-08 |
| ☑ | Validation: unique category name and code | Critical | Categories | 2026-07-08 |
| ☑ | Quality Check: build/lint pass, backend dry-run confirms auth-gating, frontend verified via Playwright with mocked API, zero console errors | Critical | Categories | 2026-07-08 |

## Phase 8 — Brands

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☑ | DB: `brands` table | Critical | Brands | 2026-07-07 (Phase 0) |
| ☑ | Backend: CRUD + soft delete blocked if products exist | Critical | Brands | 2026-07-08 |
| ☑ | Frontend: Brand list/create/edit | Critical | Brands | 2026-07-08 |
| ☑ | Validation: unique brand name and code | Critical | Brands | 2026-07-08 |
| ☑ | Quality Check: build/lint pass, backend dry-run confirms auth-gating, frontend verified via Playwright with mocked API (country column, active/inactive badges), zero console errors | Critical | Brands | 2026-07-08 |

## Phase 9 — Products

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☑ | DB: `products`, `product_images` tables | Critical | Products | 2026-07-07 (Phase 0) |
| ☑ | DB: `document_sequences` table (reusable numbering engine) | Critical | Products | 2026-07-07 (Phase 0) |
| ☑ | Backend: product code auto-generation — category-code-prefixed (`CRT-2026-00001`), atomic via MySQL's `LAST_INSERT_ID(expr)` idiom (no explicit transaction/lock needed, safe under concurrent creates), never reused since it's a monotonic counter | Critical | Products | 2026-07-08 |
| ☑ | Backend: Product CRUD, image upload | Critical | Products | 2026-07-08 |
| ☐ | Backend: image **compression** — not implemented; Multer validates type/size (3MB max) but doesn't re-encode/resize. Flagged for a later pass (e.g. `sharp`) if upload sizes become a real problem in practice | Low | Products | *(deferred)* |
| ☑ | Backend: buying-price > selling-price confirmation guard — `422` + `PRICE_OVERRIDE_REQUIRED` error code, frontend shows an inline warning with "Save Anyway" | Medium | Products | 2026-07-08 |
| ☑ | Frontend: Product list (search/filter by category+brand/bulk activate-deactivate via row checkboxes) | Critical | Products | 2026-07-08 |
| ☑ | Frontend: Product create/edit form (image gallery with primary/remove, price-override flow) | Critical | Products | 2026-07-08 |
| ☐ | Frontend: dedicated Product detail page (image, code, QR preview, stock, branch) — **folded into the edit form** instead (matches the Users/Branches/Categories pattern of no separate read-only view); QR preview is Phase 11 scope (doesn't exist yet), stock/branch display is Phase 10 (Inventory) scope | High | Products | *(scope adjusted)* |
| ☑ | Quality Check: build/lint pass (zero chunk-size warnings); backend dry-run confirms auth-gating; frontend verified via Playwright with mocked API — product list with generated codes, category/brand filters, bulk-action reveal on row selection, and the full price-override confirmation flow (submit → 422 → warning banner → confirmed resubmit) all screenshotted, zero console errors | Critical | Products | 2026-07-08 |

## Phase 10 — Inventory

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☑ | DB: `inventory`, `inventory_movements`, `inventory_adjustments` tables | Critical | Inventory | 2026-07-07 (Phase 0) |
| ☑ | Backend: inventory read model (current/reserved/available per branch, branch-scoped via `branchScope.js`) | Critical | Inventory | 2026-07-08 |
| ☑ | Backend: `recordMovement()` — **the** movement recording service, single source of truth. Accepts an optional external connection so Phases 14+ (Purchases/POS/Transfers/Returns) can compose it into their own larger transactions instead of duplicating stock-mutation logic | Critical | Inventory | 2026-07-08 |
| ☑ | Backend: stock adjustment endpoint (reason, description) | Critical | Inventory | 2026-07-08 |
| ☐ | Backend: adjustment **approval workflow** — schema supports it (`requires_approval`/`approved_by`/`approved_at` on `inventory_adjustments`) but not wired up; every adjustment is currently auto-approved. No clear threshold rule existed in the spec for *when* approval should trigger, so this was left as a deliberate simplification rather than guessed at — revisit if/when a concrete business rule is defined | Medium | Inventory | *(deferred)* |
| ☑ | Backend: low-stock / out-of-stock detection (summary endpoint + per-row level badges) | Critical | Inventory | 2026-07-08 |
| ☑ | Frontend: Inventory overview page (current/available/min-stock, summary KPI cards, branch + low/out-of-stock filters) | Critical | Inventory | 2026-07-08 |
| ☑ | Frontend: Stock movement history table (filterable by branch/movement type, signed quantity display) | High | Inventory | 2026-07-08 |
| ☑ | Frontend: Stock adjustment form (modal, opened from the overview table) | High | Inventory | 2026-07-08 |
| ☑ | Business rule: never allow negative stock — enforced inside `recordMovement()` itself (`newStock < 0` throws `422`), not just at the UI layer, so every future caller (Purchases, POS, Transfers, Returns) inherits the guarantee automatically | Critical | Inventory | 2026-07-08 |
| ☑ | Quality Check: build/lint pass (zero chunk-size warnings); backend dry-run confirms auth-gating; frontend verified via Playwright with mocked API — summary cards, color-coded stock-level badges, the Adjust Stock modal, and the movement history table (signed +/- quantity change) all screenshotted, zero console errors | Critical | Inventory | 2026-07-08 |

## Phase 11 — QR Codes

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☐ | DB: `qr_codes` table (history/audit) | High | QR | |
| ☐ | Backend: reusable QR generation service (product ID, code, branch, name, price → PNG) | Critical | QR | |
| ☐ | Backend: regenerate endpoint | Medium | QR | |
| ☐ | Frontend: QR preview, download, print, regenerate UI | High | QR | |
| ☐ | Frontend: `html5-qrcode` camera scan component (reusable, used later in POS) | Critical | QR | |
| ☐ | Quality Check | Critical | QR | |

## Phase 12 — Label Printing

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☐ | Backend: label PDF generation (pdfkit) — QR, name, code, price, branch | High | Labels | |
| ☐ | Frontend: single label print | High | Labels | |
| ☐ | Frontend: bulk label print (multi-select from product list) | Medium | Labels | |
| ☐ | Support multiple paper/sticker sizes | Medium | Labels | |
| ☐ | Quality Check | High | Labels | |

## Phase 13 — Suppliers

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☐ | DB: `suppliers` table | Critical | Suppliers | |
| ☐ | Backend: Supplier CRUD, deactivate, purchase history view | Critical | Suppliers | |
| ☐ | Frontend: Supplier list/create/edit/detail | Critical | Suppliers | |
| ☐ | Quality Check | Critical | Suppliers | |

## Phase 14 — Purchases

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☐ | DB: `purchase_orders`, `purchase_items`, `supplier_payments` tables | Critical | Purchases | |
| ☐ | Backend: purchase number generation (`PUR-2026-000001`) | Critical | Purchases | |
| ☐ | Backend: create purchase → transaction: insert order+items, increment inventory, create movement | Critical | Purchases | |
| ☐ | Backend: supplier balance tracking (purchases − payments) | High | Purchases | |
| ☐ | Frontend: Purchase create flow (supplier, products, quantity, price) | Critical | Purchases | |
| ☐ | Frontend: Purchase history + outstanding balance view | High | Purchases | |
| ☐ | Quality Check — purchases increase stock correctly | Critical | Purchases | |

## Phase 15 — Stock Transfers

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☐ | DB: `stock_transfer_requests`, `stock_transfer_items` tables | Critical | Transfers | |
| ☐ | Backend: transfer number generation (`TRF-2026-000001`) | Critical | Transfers | |
| ☐ | Backend: create → approve/reject workflow (Manager/Super Admin) | Critical | Transfers | |
| ☐ | Backend: approval → transaction: decrement source, increment destination, dual movement records | Critical | Transfers | |
| ☐ | Frontend: Transfer create/approve/history pages | Critical | Transfers | |
| ☐ | Business rules: cannot exceed available stock, cannot transfer to same branch | Critical | Transfers | |
| ☐ | Quality Check | Critical | Transfers | |

## Phase 16 — Customers

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☐ | DB: `customers` table | Critical | Customers | |
| ☐ | Backend: Customer CRUD, customer types, purchase/return history | Critical | Customers | |
| ☐ | Frontend: Customer list/create/edit/detail | Critical | Customers | |
| ☐ | Quality Check | Critical | Customers | |

## Phase 17 — POS (Sales Engine)

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☐ | DB: `sales`, `sale_items`, `sale_payments` tables | Critical | POS | |
| ☐ | Backend: sale number generation (`SAL-2026-000001`) | Critical | POS | |
| ☐ | Backend: checkout transaction (validate cart/stock/customer/payment → create sale+items+payments → update inventory+movements → audit/activity logs → notifications) | Critical | POS | |
| ☐ | Backend: discount engine (percentage/fixed, line/cart level, permission-gated limits) | Critical | POS | |
| ☐ | Backend: mixed payment validation (sum(payments) >= total) | Critical | POS | |
| ☐ | Backend: receipt data endpoint | Critical | POS | |
| ☐ | Frontend: POS layout (product grid+search left, cart+payment right) | Critical | POS | |
| ☐ | Frontend: camera QR scan integrated into product search | Critical | POS | |
| ☐ | Frontend: cart (qty, price override by permission, discount, notes, clear) | Critical | POS | |
| ☐ | Frontend: payment section (cash/M-Pesa/Airtel Money manual entry, mixed) | Critical | POS | |
| ☐ | Frontend: receipt preview + print (80mm layout) + reprint | Critical | POS | |
| ☐ | Frontend: Sale history + detail pages | High | POS | |
| ☐ | Architecture-only: Hold Sale (data model + UI stub, not full save/resume flow this phase) | Low | POS | |
| ☐ | Quality Check — full checkout tested, transaction rollback verified | Critical | POS | |

## Phase 18 — Returns

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☐ | DB: `returns`, `return_items` tables | Critical | Returns | |
| ☐ | Backend: return number generation (`RET-2026-000001`) | Critical | Returns | |
| ☐ | Backend: return workflow (locate sale → select items/qty → reason → approve → restore inventory) | Critical | Returns | |
| ☐ | Backend: refund tracking (amount, method, date, status, approver) | High | Returns | |
| ☐ | Frontend: Return create/approve/history pages | Critical | Returns | |
| ☐ | Business rule: cannot return more than sold quantity | Critical | Returns | |
| ☐ | Quality Check | Critical | Returns | |

## Phase 19 — Expenses

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☐ | DB: `expense_categories`, `expenses` tables | Critical | Expenses | |
| ☐ | Backend: Expense CRUD, branch scoping, receipt upload | Critical | Expenses | |
| ☐ | Frontend: Expense list/create/edit | Critical | Expenses | |
| ☐ | Business rule: expenses feed Profit Reports | Critical | Expenses | |
| ☐ | Quality Check | Critical | Expenses | |

## Phase 20 — Car Wash

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☐ | DB: `vehicles`, `carwash_services`, `carwash_transactions` tables | Critical | Car Wash | |
| ☐ | Backend: vehicle registration, service catalog, transaction + payment recording | Critical | Car Wash | |
| ☐ | Frontend: Vehicle register / service / history pages | Critical | Car Wash | |
| ☐ | Business rule: revenue feeds Profit Reports and Dashboard | Critical | Car Wash | |
| ☐ | Quality Check | Critical | Car Wash | |

## Phase 21 — Reports

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☐ | Backend: report query services per category (Sales/Inventory/Purchases/Expenses/Car Wash/Financial/Branches/Profit/Returns/Transfers/Customers/Suppliers/Activity/Audit) | Critical | Reports | |
| ☐ | Backend: shared filter engine (date range, branch, user, category, supplier, customer, product, payment method, status, search) | Critical | Reports | |
| ☐ | Backend: PDF export (pdfkit, with logo/title/filters/date/generated-by/page numbers/footer) | Critical | Reports | |
| ☐ | Backend: Excel export (exceljs) | Critical | Reports | |
| ☐ | Backend: CSV export (json2csv) | Critical | Reports | |
| ☐ | Frontend: Reports Center hub + per-category report pages | Critical | Reports | |
| ☐ | Frontend: preview-before-print + print | High | Reports | |
| ☐ | Verify: dashboard KPIs and report totals use identical calculation logic | Critical | Reports | |
| ☐ | Quality Check | Critical | Reports | |

## Phase 22 — Notifications

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☐ | DB: `notifications` table | Critical | Notifications | |
| ☐ | Backend: notification creation hooks on key events (low stock, purchase received, transfer approved, expense submitted/approved, sale completed, return processed, system error) | Critical | Notifications | |
| ☐ | Backend: read/unread, mark-all-read, delete endpoints | Critical | Notifications | |
| ☐ | Frontend: Notifications page + panel (polling refresh) | Critical | Notifications | |
| ☐ | Quality Check | Critical | Notifications | |

## Phase 23 — Settings

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☐ | DB: `system_settings` table (currency, tax rate, receipt footer, email config, backup prefs) | Critical | Settings | |
| ☐ | Backend: settings CRUD (Super Admin only) | Critical | Settings | |
| ☐ | Backend: manual DB backup trigger + `system_backups` record | High | Settings | |
| ☐ | Backend: `node-cron` job for automatic daily backup | High | Settings | |
| ☐ | Frontend: Settings page (Company/Logo/Receipt/Currency/Tax/Email/Backup tabs) | Critical | Settings | |
| ☐ | Quality Check | Critical | Settings | |

## Phase 24 — Final Testing

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☐ | Full regression: every module against Definition of Done | Critical | QA | |
| ☐ | Security pass: Helmet, rate limiting, input sanitization, SQLi/XSS checks, CORS, JWT config | Critical | QA | |
| ☐ | Responsive QA: desktop/laptop/tablet/mobile, no horizontal overflow, no overlap | Critical | QA | |
| ☐ | Print QA: receipts, labels, reports (PDF/Excel/CSV) | Critical | QA | |
| ☐ | Zero console errors, zero runtime errors, build + lint clean | Critical | QA | |
| ☐ | Update `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `SECURITY.md`, `TESTING.md`, `CODING-STANDARDS.md` to reflect final implementation | High | Docs | |

## Phase 25 — Deployment

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☐ | Provision Contabo VPS (Ubuntu), Node.js, MySQL install | Critical | Deploy | |
| ☐ | Nginx reverse proxy config for `jozzy.clixworks.co.tz` | Critical | Deploy | |
| ☐ | PM2 process config for backend | Critical | Deploy | |
| ☐ | SSL certificate (Let's Encrypt/Certbot) | Critical | Deploy | |
| ☐ | Production `.env` setup (never committed) | Critical | Deploy | |
| ☐ | Backup + restore procedure documented and tested | Critical | Deploy | |
| ☐ | Write `DEPLOYMENT.md` | Critical | Deploy | |
| ☐ | Go-live smoke test | Critical | Deploy | |

---

## Cross-Cutting (ongoing throughout all phases)

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☐ | `docs/CHANGELOG.md` updated after every implementation | Critical | Docs | |
| ☐ | Audit logging wired into every mutating action (who/what/when/IP/branch/before/after) | Critical | Security | |
| ☐ | Activity log timeline wired into every user-facing action relevant to Dashboard | High | Security | |
| ☐ | `npm run build` + `npm run lint` re-verified after every module | Critical | QA | |
