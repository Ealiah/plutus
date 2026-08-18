import { z } from "zod";
import { getDb } from "@/lib/db";
import { authErrorResponse, requireTab } from "@/lib/auth";

const Patch = z.object({
  name: z.string().min(1).max(200).optional(),
  role: z.string().max(200).optional(),
  department: z.string().min(1).max(200).optional(),
  salary: z.number().nonnegative().optional(),
  bonus: z.number().nonnegative().optional(),
});
const FIELD_MAP: Record<string, string> = {
  name: "name", role: "role", department: "department", salary: "salary", bonus: "bonus",
};
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    await requireTab("salaries");
    const { id } = await ctx.params;
    let body: unknown;
    try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
    const parsed = Patch.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });

    const db = getDb();
    const sets: string[] = [];
    const vals: unknown[] = [];
    for (const [k, v] of Object.entries(parsed.data)) {
      if (v === undefined) continue;
      const col = FIELD_MAP[k];
      if (!col) continue;
      sets.push(`${col} = ?`);
      vals.push(v);
    }
    if (sets.length === 0) return Response.json({ ok: true });
    vals.push(id);
    const r = db.prepare(`UPDATE employees SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
    if (r.changes === 0) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (e) { return authErrorResponse(e); }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    await requireTab("salaries");
    const { id } = await ctx.params;
    getDb().prepare("DELETE FROM employees WHERE id = ?").run(id);
    return Response.json({ ok: true });
  } catch (e) { return authErrorResponse(e); }
}
