import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

// ── Types ──────────────────────────────────────────────────────────────────
export interface QueryResult {
  rows: Record<string, unknown>[]
}

export interface Pool {
  query(sql: string, params?: unknown[]): Promise<QueryResult>
}

// ── SQL normalizer (pg → SQLite) ───────────────────────────────────────────
// Converts $1,$2,... placeholders to ? and strips pg-specific type casts
function pgToSqlite(sql: string): string {
  return sql
    .replace(/\$\d+/g, '?')
    .replace(/::\w+/g, '')          // strip ::int ::text ::timestamptz etc.
}

// ── SQLite pool (local dev, no DATABASE_URL) ───────────────────────────────
function createSQLitePool(): Pool {
  const Database = require('better-sqlite3') as typeof import('better-sqlite3').default
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const dbPath = path.resolve(__dirname, '../../data/intelligent_funding.db')
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  return {
    async query(sql: string, params: unknown[] = []): Promise<QueryResult> {
      const converted = pgToSqlite(sql)
      const upper = converted.trim().toUpperCase()
      const isSelect = upper.startsWith('SELECT') || upper.startsWith('WITH') || upper.startsWith('PRAGMA')
      if (isSelect) {
        const stmt = db.prepare(converted)
        const rows = stmt.all(...params) as Record<string, unknown>[]
        return { rows }
      }
      // INSERT / UPDATE / DELETE — may include RETURNING
      const stmt = db.prepare(converted)
      const result = stmt.run(...params)
      if (/RETURNING/i.test(converted)) {
        // Return the inserted/updated row id
        return { rows: [{ id: result.lastInsertRowid }] }
      }
      return { rows: [{ count: result.changes }] }
    },
  }
}

// ── PostgreSQL pool (production with DATABASE_URL) ─────────────────────────
function createPgPool(): Pool {
  const { Pool: PgPool } = require('pg') as typeof import('pg')
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL
  const pool = new PgPool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 3,
    connectionTimeoutMillis: 20000,
    idleTimeoutMillis: 30000,
  })
  return {
    async query(sql: string, params: unknown[] = []): Promise<QueryResult> {
      const result = await pool.query(sql, params)
      return { rows: result.rows as Record<string, unknown>[] }
    },
  }
}

// ── Singleton ──────────────────────────────────────────────────────────────
let _pool: Pool | null = null

export function getPool(): Pool {
  if (_pool) return _pool
  const hasPostgres = !!(
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL
  )
  _pool = hasPostgres ? createPgPool() : createSQLitePool()
  console.log(`Database: ${hasPostgres ? 'PostgreSQL' : 'SQLite (local)'}`)
  return _pool
}

export function isPostgres(): boolean {
  return !!(
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL
  )
}

// ── Schema init (no-op if tables already exist) ────────────────────────────
let schemaInitialized = false

export async function initSchema(): Promise<void> {
  if (schemaInitialized) return
  const p = getPool()
  const pg = isPostgres()
  const pk = pg ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'
  const now = pg ? 'TIMESTAMPTZ DEFAULT now()' : "TEXT DEFAULT (datetime('now'))"

  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      stripe_customer_id TEXT,
      subscription_status TEXT DEFAULT 'inactive',
      subscription_end_date TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)

  await p.query(`
    CREATE TABLE IF NOT EXISTS institutions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('Bank', 'Credit Union', 'Fintech')),
      inquiry_reuse TEXT NOT NULL DEFAULT 'Not Verified' CHECK(inquiry_reuse IN ('Yes', 'No', 'Partial', 'Not Verified')),
      inquiry_reuse_window TEXT DEFAULT 'Not Found',
      preapproval_available TEXT NOT NULL DEFAULT 'Not Verified' CHECK(preapproval_available IN ('Yes', 'No', 'Not Found', 'Not Verified')),
      soft_pull_available TEXT NOT NULL DEFAULT 'Not Verified' CHECK(soft_pull_available IN ('Yes', 'No', 'Not Found', 'Not Verified')),
      geographic_restrictions TEXT DEFAULT 'Nationwide',
      application_url TEXT,
      path TEXT NOT NULL CHECK(path IN ('Capital Access', 'Credit Builder', 'Both')),
      last_verified_date TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)

  await p.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('Unsecured Card', 'Line of Credit', 'Personal Loan', 'Secured Card', 'Credit Builder Loan', 'Alternative Tradeline')),
      bureau_pulled TEXT NOT NULL DEFAULT 'Not Verified' CHECK(bureau_pulled IN ('Experian', 'Equifax', 'TransUnion', 'All 3', 'None', 'Not Verified')),
      reports_to TEXT DEFAULT 'Not verified — contact institution to confirm',
      inquiry_reuse_eligible TEXT NOT NULL DEFAULT 'Not Verified' CHECK(inquiry_reuse_eligible IN ('Yes', 'No', 'Not Verified')),
      preapproval_available TEXT NOT NULL DEFAULT 'Not Found' CHECK(preapproval_available IN ('Yes', 'No', 'Not Found')),
      minimum_credit_score INTEGER,
      deposit_amount TEXT DEFAULT 'N/A',
      annual_fee TEXT DEFAULT 'None',
      graduation_potential TEXT DEFAULT 'N/A' CHECK(graduation_potential IN ('Yes', 'No', 'N/A', 'Not Verified')),
      graduation_timeline TEXT DEFAULT 'N/A',
      existing_customer_required TEXT DEFAULT 'No' CHECK(existing_customer_required IN ('Yes', 'No')),
      last_verified_date TEXT,
      strategy_notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)

  // Widen the product-type constraint on already-created Postgres tables
  // (SQLite can't alter CHECKs — local dev gets it via fresh DB creation)
  if (pg) {
    await p.query(`ALTER TABLE products DROP CONSTRAINT IF EXISTS products_type_check`)
    await p.query(`ALTER TABLE products ADD CONSTRAINT products_type_check CHECK (type IN ('Unsecured Card','Line of Credit','Personal Loan','Secured Card','Credit Builder Loan','Alternative Tradeline'))`)
  }

  // ── Growth tables (leads, community datapoints, click tracking) ──────────
  await p.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id ${pk},
      email TEXT UNIQUE NOT NULL,
      source TEXT DEFAULT 'cheat-sheet',
      created_at ${now}
    )
  `)

  await p.query(`
    CREATE TABLE IF NOT EXISTS submissions (
      id ${pk},
      institution_name TEXT NOT NULL,
      product_name TEXT,
      bureau_pulled TEXT,
      approved TEXT,
      credit_score_band TEXT,
      credit_limit TEXT,
      state TEXT,
      inquiry_reuse_observed TEXT,
      notes TEXT,
      email TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at ${now}
    )
  `)

  await p.query(`
    CREATE TABLE IF NOT EXISTS click_events (
      id ${pk},
      institution_id INTEGER,
      event_type TEXT NOT NULL DEFAULT 'apply_click',
      created_at ${now}
    )
  `)

  schemaInitialized = true
}
