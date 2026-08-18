import { z } from "zod";
import { getDb } from "@/lib/db";
import { authErrorResponse, requireTab } from "@/lib/auth";

const Patch = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().max(200).optional(),
  phone: z.string().max(60).optional(),
});
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    await requireTab("heads");
    const { id } = await ctx.params;
    let body: unknown;
    try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
    const parsed = Patch.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });

    const sets: string[] = [];
    const vals: unknown[] = [];
    for (const [k, v] of Object.entries(parsed.data)) {
      if (v === undefined) continue;
      sets.push(`${k} = ?`);
      vals.push(v);
    }
    if (sets.length === 0) return Response.json({ ok: true });
    vals.push(id);
    const r = getDb().prepare(`UPDATE heads SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
    if (r.changes === 0) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (e) { return authErrorResponse(e); }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    await requireTab("heads");
    const { id } = await ctx.params;
    getDb().prepare("DELETE FROM heads WHERE id = ?").run(id);
    return Response.json({ ok: true });
  } catch (e) { return authErrorResponse(e); }
}
