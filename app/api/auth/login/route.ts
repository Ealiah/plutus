import bcrypt from "bcryptjs";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

const Body = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(256),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid credentials" }, { status: 400 });
  }
  const { username, password } = parsed.data;

  const db = getDb();
  const user = db
    .prepare(
      "SELECT id, password_hash, disabled FROM users WHERE username = ?"
    )
    .get(username) as
    | { id: string; password_hash: string; disabled: number }
    | undefined;

  if (!user || user.disabled) {
    return Response.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return Response.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const session = await getSession();
  session.userId = user.id;
  await session.save();

  return Response.json({ ok: true });
}
