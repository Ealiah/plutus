import bcrypt from "bcryptjs";
import { z } from "zod";
import { getDb, newId } from "@/lib/db";
import { authErrorResponse, requireOwner } from "@/lib/auth";

const CreateBody = z.object({
  username: z.string().min(2).max(64).regex(/^[a-zA-Z0-9._-]+$/, "Letters, numbers, . _ - only"),
  password: z.string().min(8).max(256),
  roleId: z.string().min(1),
});

export async function GET() {
  try {
    await requireOwner();
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT users.id, users.username, users.disabled, users.created_at,
                roles.id AS role_id, roles.name AS role_name
           FROM users
           JOIN roles ON roles.id = users.role_id
          ORDER BY users.created_at DESC`
      )
      .all() as Array<{
      id: string;
      username: string;
      disabled: number;
      created_at: number;
      role_id: string;
      role_name: string;
    }>;
    return Response.json({
      users: rows.map((r) => ({
        id: r.id,
        username: r.username,
        disabled: !!r.disabled,
        createdAt: r.created_at,
        roleId: r.role_id,
        roleName: r.role_name,
      })),
    });
  } catch (e) {
    return authErrorResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    await requireOwner();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = CreateBody.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    const { username, password, roleId } = parsed.data;

    const db = getDb();
    const role = db.prepare("SELECT id FROM roles WHERE id = ?").get(roleId);
    if (!role) return Response.json({ error: "Role not found" }, { status: 400 });

    const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
    if (existing) return Response.json({ error: "Username taken" }, { status: 409 });

    const hash = await bcrypt.hash(password, 12);
    const id = newId();
    db.prepare(
      "INSERT INTO users (id, username, password_hash, role_id, disabled) VALUES (?, ?, ?, ?, 0)"
    ).run(id, username, hash, roleId);

    return Response.json({ id });
  } catch (e) {
    return authErrorResponse(e);
  }
}
