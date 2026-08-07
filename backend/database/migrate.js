import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

// Standalone migration runner. Deliberately does NOT reuse config/db.js's
// pool — that pool is shared by the running app and must never have
// multipleStatements enabled (a stacked-query injection risk on a
// long-lived pool used for ordinary request handling). This script opens
// its own short-lived connection with multipleStatements on, only for the
// duration of applying .sql files, then closes it.
//
// Tracks what has already run in a `schema_migrations` table so this is
// safe to run on every deploy — already-applied files are skipped, never
// re-executed. `migrations/` (schema DDL) always runs before `seeders/`
// (reference data / permission grants), matching database/README.md's
// documented apply order.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const SEEDERS_DIR = path.join(__dirname, 'seeders');

async function ensureTrackingTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      kind ENUM('migration', 'seed') NOT NULL,
      filename VARCHAR(255) NOT NULL,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_schema_migrations_kind_filename (kind, filename)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

function listSqlFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.sql'))
    .sort(); // numeric filename prefixes (016_..., 017_...) sort correctly as plain strings
}

async function alreadyApplied(connection, kind, filename) {
  const [rows] = await connection.query(
    'SELECT 1 FROM schema_migrations WHERE kind = ? AND filename = ? LIMIT 1',
    [kind, filename],
  );
  return rows.length > 0;
}

// Every migration/seeder in this codebase predates this tracking table —
// 001-015 and seeders 001-007 were applied by hand, one at a time, per
// database/README.md, long before schema_migrations existed. The very
// first run of this script against an existing production database sees
// an EMPTY tracking table and must not assume that means "nothing has run
// yet" — CREATE TABLE IF NOT EXISTS / INSERT IGNORE files are naturally
// safe to replay, but the plain ALTER TABLE ... ADD COLUMN / ADD KEY
// migrations (012-016) are NOT idempotent by SQL syntax alone and would
// throw "Duplicate column/key" if the column/index is already there.
//
// Statements are split and run one at a time (not as one multi-statement
// batch) specifically so that outcome is distinguishable per-statement: a
// "this already exists" error on one ALTER is caught, logged, and treated
// as already-satisfied, while the file's remaining statements still run
// normally — a partially-applied historical migration finishes cleanly
// instead of the whole file aborting on its first already-done line.
const ALREADY_APPLIED_CODES = new Set([
  'ER_TABLE_EXISTS_ERROR', // 1050 — CREATE TABLE (should already be guarded by IF NOT EXISTS, kept as a safety net)
  'ER_DUP_FIELDNAME', // 1060 — ADD COLUMN where the column already exists
  'ER_DUP_KEYNAME', // 1061 — ADD KEY/INDEX where the index already exists
  'ER_DUP_ENTRY', // 1062 — INSERT hitting a UNIQUE constraint (seeders use INSERT IGNORE, kept as a safety net)
  'ER_FK_DUP_NAME', // 1826 — ADD CONSTRAINT ... FOREIGN KEY where that constraint name already exists (migration 002's deferred branches/roles/permissions FKs)
]);

// Splits on a semicolon immediately followed by a newline. A leading
// comment block (every file in migrations/seeders opens with `-- ...`
// header lines) rides along as part of whichever statement follows it —
// harmless, since MySQL parses `--`-prefixed lines as comments no matter
// where they sit inside a query string, so it must NOT be filtered out
// here (doing so would silently drop the real statement attached to it).
function splitStatements(sql) {
  return sql
    .split(/;\s*\n/)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
}

async function applyDirectory(connection, dir, kind) {
  const files = listSqlFiles(dir);
  let appliedCount = 0;

  for (const filename of files) {
    if (await alreadyApplied(connection, kind, filename)) {
      continue;
    }

    const sql = fs.readFileSync(path.join(dir, filename), 'utf8');
    const statements = splitStatements(sql);
    console.log(`Applying ${kind}: ${filename} (${statements.length} statement(s))`);

    let hadAlreadyAppliedStatements = false;
    for (const statement of statements) {
      try {
        await connection.query(statement);
      } catch (err) {
        if (ALREADY_APPLIED_CODES.has(err.code)) {
          hadAlreadyAppliedStatements = true;
          console.log(`  -> already applied, skipping one statement (${err.code})`);
          continue;
        }
        console.error(`  -> FAILED: ${err.message}`);
        throw err;
      }
    }

    await connection.query(
      'INSERT INTO schema_migrations (kind, filename) VALUES (?, ?)',
      [kind, filename],
    );
    appliedCount += 1;
    console.log(hadAlreadyAppliedStatements ? '  -> recorded (was already fully or partially applied)' : '  -> applied');
  }

  return appliedCount;
}

async function run() {
  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
    multipleStatements: true,
  });

  try {
    await ensureTrackingTable(connection);

    const migrationsApplied = await applyDirectory(connection, MIGRATIONS_DIR, 'migration');
    const seedsApplied = await applyDirectory(connection, SEEDERS_DIR, 'seed');

    if (migrationsApplied === 0 && seedsApplied === 0) {
      console.log('Database is already up to date — nothing to apply.');
    } else {
      console.log(`Done: ${migrationsApplied} migration(s), ${seedsApplied} seed file(s) applied.`);
    }
  } finally {
    await connection.end();
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration run failed:', err.message);
    process.exit(1);
  });
