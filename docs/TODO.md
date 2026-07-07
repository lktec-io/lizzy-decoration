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
| ☐ | Backend: Users CRUD (create/edit/soft-delete) | Critical | Users | |
| ☐ | Backend: activate/suspend/lock user | Critical | Users | |
| ☐ | Backend: admin-triggered password reset | High | Users | |
| ☐ | Backend: assign role + branch(es) to user | Critical | Users | |
| ☐ | Frontend: User list (search, filter, paginate) | Critical | Users | |
| ☐ | Frontend: User create/edit form + avatar upload | Critical | Users | |
| ☐ | Validation: unique username, unique email, phone format | Critical | Users | |
| ☐ | Quality Check | Critical | Users | |

## Phase 4 — Roles & Permissions

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☑ | DB: `roles`, `permissions`, `role_permissions` tables | Critical | RBAC | 2026-07-07 (Phase 0) |
| ☑ | Seed default roles: Super Administrator, Manager, Cashier, Store Keeper | Critical | RBAC | 2026-07-07 (Phase 0) |
| ☑ | Seed permission catalog (view/create/edit/delete/approve/export/print + module-manage permissions) | Critical | RBAC | 2026-07-07 (Phase 0) |
| ☑ | Backend: permission-check middleware (DB-driven, no hardcoding) — pulled forward to Phase 2, `middlewares/authorize.js` + `repositories/permission.repository.js` | Critical | RBAC | 2026-07-07 (Phase 2) |
| ☐ | Backend: role CRUD (support future custom roles) | High | RBAC | |
| ☐ | Frontend: Role management + permission matrix UI | High | RBAC | |
| ☑ | Frontend: `usePermission` hook + permission-gated UI elements — pulled forward to Phase 2, used by `CompanySettings.jsx` | Critical | RBAC | 2026-07-07 (Phase 2) |
| ☐ | Quality Check *(remaining scope: Role CRUD + Permission Matrix UI only — middleware/hook already shipped and verified in Phase 2)* | Critical | RBAC | |

## Phase 5 — Branches

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☐ | DB: `branches`, `user_branches` tables | Critical | Branches | |
| ☐ | Backend: Branch CRUD, deactivate, assign manager/users | Critical | Branches | |
| ☐ | Backend: branch-scoping middleware (filters queries by user's branch access) | Critical | Branches | |
| ☐ | Frontend: Branch list/create/edit/detail pages | Critical | Branches | |
| ☐ | Business rule: Super Admin sees all, Manager sees assigned branches, Cashier sees assigned branch only | Critical | Branches | |
| ☐ | Quality Check | Critical | Branches | |

## Phase 6 — Dashboard

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☐ | Backend: KPI aggregation endpoints (today/monthly sales, profit, expenses, low stock, etc.) | Critical | Dashboard | |
| ☐ | Backend: chart data endpoints (sales/revenue/expense/profit trend, top products, branch performance) | Critical | Dashboard | |
| ☐ | Backend: recent activity timeline endpoint | High | Dashboard | |
| ☐ | Backend: global search endpoint (products/customers/suppliers/sales/purchases/vehicles/expenses/users) | High | Dashboard | |
| ☐ | Frontend: KPI cards | Critical | Dashboard | |
| ☐ | Frontend: Chart.js charts (Sales, Revenue, Expense, Profit trend; Top Products; Branch Performance; Inventory; Car Wash) | Critical | Dashboard | |
| ☐ | Frontend: Recent Activity timeline | High | Dashboard | |
| ☐ | Frontend: Quick Action buttons | Medium | Dashboard | |
| ☐ | Frontend: Notification panel widget | High | Dashboard | |
| ☐ | Frontend: Navbar (logo, branch selector, search, notifications, avatar, date/time) | Critical | Dashboard | |
| ☐ | Frontend: Sidebar (collapsible, active-highlight, full menu) | Critical | Dashboard | |
| ☐ | Quality Check — responsive on all breakpoints | Critical | Dashboard | |

## Phase 7 — Categories

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☐ | DB: `categories` table | Critical | Categories | |
| ☐ | Backend: CRUD + soft delete blocked if products exist | Critical | Categories | |
| ☐ | Frontend: Category list/create/edit | Critical | Categories | |
| ☐ | Validation: unique category name | Critical | Categories | |
| ☐ | Quality Check | Critical | Categories | |

## Phase 8 — Brands

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☐ | DB: `brands` table | Critical | Brands | |
| ☐ | Backend: CRUD + soft delete blocked if products exist | Critical | Brands | |
| ☐ | Frontend: Brand list/create/edit | Critical | Brands | |
| ☐ | Validation: unique brand name | Critical | Brands | |
| ☐ | Quality Check | Critical | Brands | |

## Phase 9 — Products

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☐ | DB: `products`, `product_images` tables | Critical | Products | |
| ☐ | DB: `document_sequences` table (reusable numbering engine) | Critical | Products | |
| ☐ | Backend: product code auto-generation (`SPR-2026-00001` style, category-prefixed, never reused) | Critical | Products | |
| ☐ | Backend: Product CRUD, image upload + compression | Critical | Products | |
| ☐ | Backend: buying-price > selling-price confirmation guard | Medium | Products | |
| ☐ | Frontend: Product list (search/filter/bulk actions) | Critical | Products | |
| ☐ | Frontend: Product create/edit form | Critical | Products | |
| ☐ | Frontend: Product detail page (image, code, QR preview, stock, branch) | High | Products | |
| ☐ | Quality Check | Critical | Products | |

## Phase 10 — Inventory

| Status | Task | Priority | Module | Completed |
|---|---|---|---|---|
| ☐ | DB: `inventory`, `inventory_movements`, `inventory_adjustments` tables | Critical | Inventory | |
| ☐ | Backend: inventory read model (current/reserved/available per branch) | Critical | Inventory | |
| ☐ | Backend: movement recording service (single source of truth, reusable across Sales/Purchases/Transfers/Returns) | Critical | Inventory | |
| ☐ | Backend: stock adjustment endpoint (reason, description, optional approval) | Critical | Inventory | |
| ☐ | Backend: low-stock / out-of-stock detection | Critical | Inventory | |
| ☐ | Frontend: Inventory overview page (current/reserved/available/low/out) | Critical | Inventory | |
| ☐ | Frontend: Stock movement history table | High | Inventory | |
| ☐ | Frontend: Stock adjustment form | High | Inventory | |
| ☐ | Business rule: never allow negative stock | Critical | Inventory | |
| ☐ | Quality Check | Critical | Inventory | |

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
