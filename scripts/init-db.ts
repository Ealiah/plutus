import { getDb } from "../lib/db";
import { DEFAULT_ROLES } from "../lib/permissions";

const db = getDb();

const insertRole = db.prepare(
  "INSERT OR IGNORE INTO roles (id, name, allowed_tabs, is_system) VALUES (?, ?, ?, ?)"
);

for (const role of DEFAULT_ROLES) {
  insertRole.run(role.name, role.name, JSON.stringify(role.allowedTabs), role.isSystem ? 1 : 0);
}

console.log("DB initialised. Roles ensured: " + DEFAULT_ROLES.map((r) => r.name).join(", "));
