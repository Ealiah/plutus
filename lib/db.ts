import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  allowed_tabs TEXT NOT NULL DEFAULT '[]',
  is_system INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role_id TEXT NOT NULL REFERENCES roles(id),
  disabled INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  month TEXT NOT NULL,
  name TEXT NOT NULL,
  expected_income REAL NOT NULL DEFAULT 0,
  actual_income REAL NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'Pending',
  date TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  head_id TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_clients_month ON clients(month);

CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  month TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL,
  salary REAL NOT NULL DEFAULT 0,
  bonus REAL NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_employees_month ON employees(month);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  month TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'One-time',
  amount REAL NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'Miscellaneous',
  head TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_expenses_month ON expenses(month);

CREATE TABLE IF NOT EXISTS heads (
  id TEXT PRIMARY KEY,
  month TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_heads_month ON heads(month);

CREATE TABLE IF NOT EXISTS client_percentages (
  client_id TEXT NOT NULL,
  month TEXT NOT NULL,
  percentages TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (client_id, month)
);

CREATE TABLE IF NOT EXISTS client_section_heads (
  client_id TEXT NOT NULL,
  month TEXT NOT NULL,
  sections TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (client_id, month)
);

CREATE TABLE IF NOT EXISTS gallery_images (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  section TEXT NOT NULL DEFAULT 'grid',  -- 'hero' or 'grid'
  category TEXT NOT NULL DEFAULT 'brand', -- filter category for grid: brand|campaign|film|content|media
  alt_text TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_gallery_section ON gallery_images(section, sort_order);

CREATE TABLE IF NOT EXISTS gallery_websites (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_gallery_websites_order ON gallery_websites(sort_order);
`;

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  const dbPath = process.env.DATABASE_PATH || "./data/plutus.db";
  const absPath = path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath);
  fs.mkdirSync(path.dirname(absPath), { recursive: true });

  const db = new Database(absPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA_SQL);

  _db = db;
  return db;
}

export function newId(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 10)
  );
}
