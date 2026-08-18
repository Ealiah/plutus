import { z } from "zod";
import { getDb } from "@/lib/db";
import { authErrorResponse, requireTab } from "@/lib/auth";

const Patch = z.object({
  name: z.string().min(1).max(200).optional(),
  expectedIncome: z.number().nonnegative().optional(),
  actualIncome: z.number().nonnegative().optional(),
  paymentStatus: z.enum(["Paid", "Partial", "Pending", "Overdue"]).optional(),
  date: z.string().max(40).optional(),
  notes: z.string().max(2000).optional(),
  headId: z.string().max(64).optional(),
});

const FIELD_MAP: Record<string, string> = {
  name: "name",
  expectedIncome: "expected_income",
  actualIncome: "actual_income",
  paymentStatus: "payment_status",
  date: "date",
  notes: "notes",
  headId: "head_id",
};

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    await requireTab("details");
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
    const result = db.prepare(`UPDATE clients SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
    if (result.changes === 0) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (e) {
    return authErrorResponse(e);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    await requireTab("details");
    const { id } = await ctx.params;
    const db = getDb();
    const tx = db.transaction((cid: string) => {
      db.prepare("DELETE FROM clients WHERE id = ?").run(cid);
      db.prepare("DELETE FROM client_percentages WHERE client_id = ?").run(cid);
      db.prepare("DELETE FROM client_section_heads WHERE client_id = ?").run(cid);
    });
    tx(id);
    return Response.json({ ok: true });
  } catch (e) {
    return authErrorResponse(e);
  }
}
