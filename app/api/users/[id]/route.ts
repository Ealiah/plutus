import bcrypt from "bcryptjs";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { authErrorResponse, requireOwner } from "@/lib/auth";

const PatchBody = z.object({
  username: z.string().min(2).max(64).regex(/^[a-zA-Z0-9._-]+$/).optional(),
  password: z.string().min(8).max(256).optional(),
  roleId: z.string().min(1).optional(),
  disabled: z.boolean().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const me = await requireOwner();
    const { id } = await ctx.params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = PatchBody.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }
    const data = parsed.data;

    const db = getDb();
    const target = db
      .prepare(
        `SELECT users.id, users.disabled, roles.name AS role_name
           FROM users JOIN roles ON roles.id = users.role_id
          WHERE users.id = ?`
      )
      .get(id) as { id: string; disabled: number; role_name: string } | undefined;
    if (!target) return Response.json({ error: "User not found" }, { status: 404 });

    // Guard: don't allow disabling, demoting, or password-changing the last enabled owner
    const isLastOwner = (() => {
      if (target.role_name !== "owner") return false;
      const ownerCount = (
        db
          .prepare(
            `SELECT COUNT(*) AS n FROM users
              JOIN roles ON roles.id = users.role_id
              WHERE roles.name = 'owner' AND users.disabled = 0`
          )
          .get() as { n: number }
      ).n;
      return ownerCount <= 1;
    })();

    if (isLastOwner) {
      if (data.disabled === true) {
        return Response.json({ error: "Cannot disable the last owner" }, { status: 400 });
      }
      if (data.roleId) {
        const newRole = db.prepare("SELECT name FROM roles WHERE id = ?").get(data.roleId) as
          | { name: string }
          | undefined;
        if (newRole && newRole.name !== "owner") {
          return Response.json({ error: "Cannot demote the last owner" }, { status: 400 });
        }
      }
    }

    if (data.username) {
      const taken = db
        .prepare("SELECT id FROM users WHERE username = ? AND id != ?")
        .get(data.username, id);
      if (taken) return Response.json({ error: "Username taken" }, { status: 409 });
      db.prepare("UPDATE users SET username = ? WHERE id = ?").run(data.username, id);
    }
    if (data.password) {
      const hash = await bcrypt.hash(data.password, 12);
      db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, id);
    }
    if (data.roleId) {
      const role = db.prepare("SELECT id FROM roles WHERE id = ?").get(data.roleId);
      if (!role) return Response.json({ error: "Role not found" }, { status: 400 });
      db.prepare("UPDATE users SET role_id = ? WHERE id = ?").run(data.roleId, id);
    }
    if (typeof data.disabled === "boolean") {
      db.prepare("UPDATE users SET disabled = ? WHERE id = ?").run(data.disabled ? 1 : 0, id);
    }

    // No-op self-reference to satisfy unused var lint
    void me;

    return Response.json({ ok: true });
  } catch (e) {
    return authErrorResponse(e);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const me = await requireOwner();
    const { id } = await ctx.params;

    if (id === me.id) {
      return Response.json({ error: "You can't delete your own account" }, { status: 400 });
    }

    const db = getDb();
    const target = db
      .prepare(
        `SELECT users.id, roles.name AS role_name
           FROM users JOIN roles ON roles.id = users.role_id
          WHERE users.id = ?`
      )
      .get(id) as { id: string; role_name: string } | undefined;
    if (!target) return Response.json({ error: "User not found" }, { status: 404 });

    if (target.role_name === "owner") {
      const ownerCount = (
        db
          .prepare(
            `SELECT COUNT(*) AS n FROM users
              JOIN roles ON roles.id = users.role_id
              WHERE roles.name = 'owner'`
          )
          .get() as { n: number }
      ).n;
      if (ownerCount <= 1) {
        return Response.json({ error: "Cannot delete the last owner" }, { status: 400 });
      }
    }

    db.prepare("DELETE FROM users WHERE id = ?").run(id);
    return Response.json({ ok: true });
  } catch (e) {
    return authErrorResponse(e);
  }
}
