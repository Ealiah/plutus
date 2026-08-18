import bcrypt from "bcryptjs";
import { getDb, newId } from "../lib/db";
import { DEFAULT_ROLES } from "../lib/permissions";

const username = process.env.SEED_ADMIN_USERNAME;
const password = process.env.SEED_ADMIN_PASSWORD;

if (!username || !password) {
  console.error("Set SEED_ADMIN_USERNAME and SEED_ADMIN_PASSWORD env vars before running seed.");
  process.exit(1);
}

const db = getDb();

const insertRole = db.prepare(
  "INSERT OR IGNORE INTO roles (id, name, allowed_tabs, is_system) VALUES (?, ?, ?, ?)"
);
for (const role of DEFAULT_ROLES) {
  insertRole.run(role.name, role.name, JSON.stringify(role.allowedTabs), role.isSystem ? 1 : 0);
}

const ownerRole = db.prepare("SELECT id FROM roles WHERE name = 'owner'").get() as { id: string } | undefined;
if (!ownerRole) {
  console.error("owner role missing after seed of default roles — aborting.");
  process.exit(1);
}

const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
if (existing) {
  console.log(`User '${username}' already exists; nothing to do.`);
  process.exit(0);
}

const hash = bcrypt.hashSync(password, 12);
db.prepare(
  "INSERT INTO users (id, username, password_hash, role_id, disabled) VALUES (?, ?, ?, ?, 0)"
).run(newId(), username, hash, ownerRole.id);

console.log(`Owner user '${username}' created.`);
