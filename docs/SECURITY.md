# Security

## Authentication

- **Passwords**: bcrypt, 12 rounds. Policy enforced server-side (`backend/utils/passwordPolicy.js`) on every path that sets a password (registration, reset, self-service change): minimum 8 characters, at least one uppercase, one lowercase, one number, one symbol.
- **Account lockout**: 5 failed login attempts locks the account for 15 minutes (`backend/utils/constants.js`). Failed-attempt counter resets on successful login.
- **Tokens**: short-lived JWT access token (default 15 minutes, `JWT_ACCESS_EXPIRES_IN`) carried in `Authorization: Bearer`, never in a cookie — not vulnerable to CSRF. Longer-lived refresh token (1 day default, 30 days with "remember me") stored in an `httpOnly`, `sameSite=lax`, `secure` (in production) cookie, scoped to `/api/v1/auth` only.
- **Refresh token rotation**: every `/auth/refresh` call revokes the presented token and issues a new one on the same session — a stolen refresh token that gets used by its rightful owner invalidates the thief's copy on next use.
- **Refresh tokens are hashed at rest** (`SHA-256`, `tokenUtils.hashToken`) — the raw token exists only in the cookie and briefly in memory; the database only ever stores the hash, the same way passwords are hashed rather than stored plaintext.
- **Password reset tokens**: single-use, 30-minute expiry, hashed at rest the same way. `/auth/forgot-password` always returns 200 regardless of whether the email exists, to prevent user enumeration.
- **JWT algorithm pinned explicitly** (`HS256`) on both sign and verify (`backend/utils/tokenUtils.js`) — defense in depth against algorithm-confusion attacks, added during the Phase 24 security pass. `jsonwebtoken` defaults to `HS256` for a string secret regardless, but stating it explicitly removes any dependency on that default holding.
- **Session revocation**: changing your own password, an admin resetting a user's password, or "logout everywhere" all revoke every session for that user (`sessionRepository.revokeAllForUser` + `refreshTokenRepository.revokeAllForUser`).

## Authorization

- **Role-based**: permissions attach to roles, not directly to users (`role_permissions`). A role's permission set is cached for 60 seconds in the `authorize()` middleware to avoid a query on every request; the cache is invalidated whenever Roles → Permissions is edited.
- **Every protected route** declares its required permission at the router level — see [API.md](API.md) for the full map. There is no route that skips authorization by omission; routes with no permission requirement (self-service profile, notifications inbox) are deliberate, not oversights.
- **Branch scoping** is enforced server-side on every branch-owned read and write via `getAccessibleBranchIds()` — a Cashier assigned to one branch cannot read or write another branch's sales/inventory/expenses/etc. by manipulating a request parameter; the service layer checks it independently of whatever the client sent.
- **Client-side permission checks** (`usePermission()`, gating buttons and routes in the React app) are a UX convenience only. The real boundary is the server; every client-hidden action is also server-rejected if attempted directly.

## Transport & request handling

- **Helmet** (`app.use(helmet())`) sets standard security headers (`X-Content-Type-Options`, `X-Frame-Options`, HSTS in production, etc.) with its default policy.
- **CORS** locked to a single configured origin (`FRONTEND_URL`) with `credentials: true` — no wildcard origin, ever, when credentials are involved.
- **Rate limiting**: 300 requests/15min per IP on the general API, tightened to 10/15min on `/auth/login`, `/auth/forgot-password`, `/auth/reset-password` specifically — the endpoints most valuable to brute-force.
- **Body size limit**: `express.json({ limit: '2mb' })` — bounds the attack surface of a maliciously large JSON payload.
- **CSRF posture**: the access token (used for every state-changing API call) travels in a custom `Authorization` header, which a cross-site form or fetch cannot set without JavaScript already running same-origin — the standard SPA CSRF defense. The one cookie-authenticated endpoint (`/auth/refresh`) is mitigated by `sameSite=lax` (blocks the cookie on cross-site POST) and the strict single-origin CORS policy (even if a cross-site request reached the endpoint, the browser blocks the attacker's script from reading a cross-origin credentialed response body unless CORS explicitly allows their origin, which it doesn't).

## Input validation & injection

- **Every write endpoint** validates its body with `express-validator` before the controller runs (`validateRequest` middleware) — type coercion, required fields, string length caps, enum membership, custom password-strength checks.
- **SQL injection**: every single query across all 40+ repository files uses parameterized placeholders (`?`) via `mysql2`; no user-controllable value is ever string-interpolated into a query. Verified with a repo-wide sweep during the Phase 24 security pass — zero matches for raw-value interpolation patterns in SQL template strings.
- **XSS**: the frontend is a React SPA; all user-supplied content renders through JSX's default text interpolation, which HTML-escapes automatically. `dangerouslySetInnerHTML` is not used anywhere in the codebase (verified by search) — there is no code path where a stored string (product name, customer note, expense description, etc.) can execute as markup.
- **File uploads**: `multer`-backed, MIME-type allowlisted (JPEG/PNG/WEBP for images), size-capped per upload type (2MB avatars/logos, 3MB product images), written to disk with a randomized filename (never the client-supplied name) under a fixed subfolder.

## Secrets

- Real credentials (`DB_PASSWORD`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, SMTP credentials) live only in `.env`, which is git-ignored. `.env.example` documents every required variable with placeholder values, never real ones.
- Database backups (full `.sql` dumps, which necessarily contain password hashes and all business data) are written to `backend/backups/` — deliberately **outside** `backend/uploads/`, which is statically served at `/uploads`. Placing a backup inside the served directory would make it downloadable by anyone who guessed or found the filename, with no authentication. Backups are only reachable through a `settings.manage`-gated, authenticated streaming download endpoint.
- `mysqldump` is invoked via `child_process.spawn` with an argument array — never a shell string — and the database password is passed through the child process's `MYSQL_PWD` environment variable, never as a command-line argument (which would be visible in the process list to any other user on the same machine).

## Error handling

The global error handler (`middlewares/errorHandler.js`) never returns a stack trace, raw SQL error, or internal exception message to the client. `ApiError` instances (thrown deliberately with a status and safe message) pass through as-is; MySQL's `ER_DUP_ENTRY` becomes a generic "a record with these details already exists" 409; every other unexpected error becomes a generic 500. This was verified directly during Phase 23/24 by triggering a real failure (calling `mysqldump` when the binary doesn't exist in this sandbox) and confirming the client-facing error contained no internal detail.

## Known limitations / recommendations for production hardening

These weren't addressed in this build — either out of scope for the spec, or reasonably deferred given the constraints of building without a live production database in this session:

- **No 2FA/MFA.** Not in the spec; would be a reasonable addition for Super Administrator accounts specifically.
- **No Web Application Firewall.** Recommend placing Nginx (or Cloudflare) in front of the API in production with basic WAF rules, on top of the application-level rate limiting already in place.
- **No automated dependency vulnerability scanning wired into CI.** Recommend `npm audit` (or a service like Dependabot/Snyk) as part of the deployment pipeline once one exists.
- **No centralized secrets manager.** `.env` on the server is standard practice for this scale of deployment but doesn't rotate automatically; consider a secrets manager if the team grows.
- **HTTPS/TLS termination** is the deploying operator's responsibility (Nginx + Let's Encrypt per [DEPLOYMENT.md](DEPLOYMENT.md)) — the application itself doesn't terminate TLS.
