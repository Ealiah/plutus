import { z } from "zod";
import { getDb, newId } from "@/lib/db";
import { authErrorResponse, requireTab } from "@/lib/auth";

const Body = z.object({
  id: z.string().min(1).max(64).optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  name: z.string().min(1).max(200),
  email: z.string().max(200).optional().default(""),
  phone: z.string().max(60).optional().default(""),
});

function rowToHead(r: Record<string, unknown>) {
  return { id: r.id, month: r.month, name: r.name, email: r.email, phone: r.phone };
}

export async function GET(req: Request) {
  try {
    await requireTab("heads");
    const month = new URL(req.url).searchParams.get("month") || "";
    const rows = getDb().prepare(
      "SELECT id, month, name, email, phone FROM heads WHERE month = ? ORDER BY name"
    ).all(month) as Record<string, unknown>[];
    return Response.json({ heads: rows.map(rowToHead) });
  } catch (e) { return authErrorResponse(e); }
}

export async function POST(req: Request) {
  try {
    await requireTab("heads");
    let body: unknown;
    try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
    const parsed = Body.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    const d = parsed.data;
    const id = d.id || newId();
    getDb().prepare(
      "INSERT OR REPLACE INTO heads (id, month, name, email, phone) VALUES (?, ?, ?, ?, ?)"
    ).run(id, d.month, d.name, d.email, d.phone);
    return Response.json({ id });
  } catch (e) { return authErrorResponse(e); }
}
