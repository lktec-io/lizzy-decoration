# Testing & Verification

There is no live database in this development environment, by explicit design — the user manages the real Contabo MySQL instance and production `.env` directly and never shared credentials during this build. Every phase was still verified, just without a persistent automated test suite (no Jest/Vitest harness exists in this repo). This document explains what "verified" meant at each layer, so the absence of a `tests/` directory doesn't read as "untested."

## 1. Static verification (every phase, every file)

- `node --check <file>` on every new/modified backend file — catches syntax errors before anything else runs.
- `npm run lint` on both frontend and backend, required to pass with **zero errors** before any phase was considered complete. A small number of `react-hooks/incompatible-library` warnings are expected and accepted — they come from React Hook Form's `watch()` API, which the React Compiler cannot safely memoize; this is a known, harmless limitation of the library, not a bug in this codebase.
- `npm run build` (frontend), required to complete with no chunk-size warnings.

## 2. Backend dry-run (auth-gating verification)

Since `server.js` requires a real database connection before listening (by design — a production server shouldn't come up believing it's healthy when it can't reach its data), verification instead imports `app.js` directly (which builds the Express app without connecting to a database) and boots it standalone with dummy environment variables set only in the shell process — never written to disk. Every new endpoint from every phase was then hit with `curl` to confirm:

- Protected routes return `401` with no `Authorization` header.
- The response body never leaks a stack trace or internal detail, even for a route that would eventually hit a real database query.

This was run for all ~150 endpoints across all 22 route groups, incrementally as each phase shipped.

## 3. Transaction-safety verification (the most rigorous check in this build)

Every multi-step write that touches money or stock — Purchases, Transfers' approval, POS checkout, Returns' approval — needed proof that its transaction actually rolls back correctly on failure, not just that the happy path works. A live database wouldn't even be sufficient for this on its own; what's needed is proof of the *control flow* under failure, which is exactly what a live DB test would also have to construct artificially.

**Method**: `pool.getConnection` and `pool.query` are live object references in the module graph, so monkey-patching them (`pool.query = async (sql, params) => {...}`) affects every file that imported `pool`, without needing a mocking framework. A simulated `PoolConnection` object implements `beginTransaction`/`query`/`commit`/`rollback`/`release`, matching SQL text against the exact queries the real repository functions issue (most-specific pattern first, to avoid one query's WHERE clause substring-matching a different query). The **real, unmodified service function** is then called directly — not a copy, not a stub of it.

- **Success path**: asserts the exact call sequence (e.g. Purchases: `BEGIN → insert order → insert item → SELECT...FOR UPDATE → UPDATE inventory → insert movement → COMMIT → RELEASE`).
- **Failure path**: injects a simulated error partway through (e.g. on the second line item's inventory update, after the first line item and the order header already "succeeded" within the same uncommitted transaction) and asserts `ROLLBACK` fires, `COMMIT` never does, and the connection is still released.

Applied to: `createPurchase` (Phase 14), `approveTransfer` (Phase 15, dual-branch), `checkout` (Phase 17, POS), `approveReturn` (Phase 18), and re-verified for `checkout` again in Phase 22 after `recordMovement()` itself was modified to add low-stock detection — because that function underpins every one of the above, any change to it warranted re-proving the transactions built on top of it still behave correctly.

The same technique also verified `backup.service.createBackup()`'s failure path in Phase 23/24 — since this sandbox genuinely has no `mysqldump` binary, calling the real function was a true test of the "server misconfigured" failure mode, not a simulation of one.

## 4. Frontend verification (Playwright, every phase)

No frontend page was declared complete without being rendered in an actual browser and interacted with. Method: `playwright-core` driving local Microsoft Edge (`channel: 'msedge'`), with `page.route()` intercepting every API call the page under test makes and returning realistic mocked JSON matching the real backend's response envelope — so the *actual* React components render against fake data, not a separate test-only component tree.

Each phase's check script asserted specific, meaningful behavior — not just "the page didn't crash":

- Data renders correctly from the mocked response (e.g. cart totals compute correctly as items are added in POS).
- Client-side validation blocks invalid submission (e.g. required fields, password strength, same-branch transfer rejection).
- Permission-gated UI actually hides/disables for a role that lacks the permission (e.g. the price-override input is disabled for a Cashier without `sales.manage`).
- Interactive flows complete end-to-end (e.g. locate-sale → select-item → submit in the Returns form; a full POS checkout navigating to the receipt screen).
- Zero browser console errors.
- A screenshot was captured and visually reviewed for every significant new page, confirming the design system renders correctly (gold/black theme, spacing, responsive behavior) — not just that the DOM contains the right text.

## What this build does *not* have

- **No automated regression suite that runs on every future change.** Every check described above was a one-off script run during that phase's development, not a persisted `npm test` target. If this project continues past this build, adding Vitest (frontend) and a real integration-test database (backend, likely via a disposable MySQL container) would be the natural next step — the transaction-verification technique above translates directly into real integration tests once a live database is available to run them against.
- **No load/performance testing.** Nothing in this build was benchmarked under concurrent load; the transaction-safety verification proves *correctness* under failure, not throughput under load.
- **No end-to-end test against the real Contabo database.** By design — the user handles that verification themselves once `.env` is configured with real credentials, per the constraint that governed this entire build.
