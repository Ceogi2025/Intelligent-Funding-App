import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '../../data/intelligent_funding.db')

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db

  const dataDir = path.dirname(DB_PATH)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  initSchema(db)
  return db
}

function initSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      stripe_customer_id TEXT,
      subscription_status TEXT DEFAULT 'inactive',
      subscription_end_date TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

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
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('Unsecured Card', 'Line of Credit', 'Personal Loan', 'Secured Card', 'Credit Builder Loan')),
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
    );
  `)
}

export default getDb
