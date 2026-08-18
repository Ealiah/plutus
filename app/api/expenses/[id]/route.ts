import { z } from "zod";
import { getDb } from "@/lib/db";
import { authErrorResponse, requireTab } from "@/lib/auth";

const Patch = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(["Recurring", "One-time"]).optional(),
  amount: z.number().nonnegative().optional(),
  category: z.enum(["Software", "Equipment", "Ads", "Rent", "Internet", "Miscellaneous"]).optional(),
  head: z.string().max(200).optional(),
  date: z.string().max(40).optional(),
  notes: z.string().max(2000).optional(),
});
const FIELD_MAP: Record<string, string> = {
  name: "name", type: "type", amount: "amount", category: "category",
  head: "head", date: "date", notes: "notes",
};
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    await requireTab("expenses");
    const { id } = await ctx.params;
    let body: unknown;
    try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
    const parsed = Patch.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
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
    const r = getDb().prepare(`UPDATE expenses SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
    if (r.changes === 0) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (e) { return authErrorResponse(e); }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    await requireTab("expenses");
    const { id } = await ctx.params;
    getDb().prepare("DELETE FROM expenses WHERE id = ?").run(id);
    return Response.json({ ok: true });
  } catch (e) { return authErrorResponse(e); }
}
