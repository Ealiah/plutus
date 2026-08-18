import { z } from "zod";
import { getDb, newId } from "@/lib/db";
import { authErrorResponse, requireTab } from "@/lib/auth";

const Body = z.object({
  id: z.string().min(1).max(64).optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  name: z.string().min(1).max(200),
  type: z.enum(["Recurring", "One-time"]),
  amount: z.number().nonnegative(),
  category: z.enum(["Software", "Equipment", "Ads", "Rent", "Internet", "Miscellaneous"]),
  head: z.string().max(200).optional().default(""),
  date: z.string().max(40).optional().default(""),
  notes: z.string().max(2000).optional().default(""),
});

function rowToExpense(r: Record<string, unknown>) {
  return {
    id: r.id, month: r.month, name: r.name, type: r.type, amount: r.amount,
    category: r.category, head: r.head, date: r.date, notes: r.notes,
  };
}

export async function GET(req: Request) {
  try {
    await requireTab("expenses");
    const month = new URL(req.url).searchParams.get("month") || "";
    const rows = getDb().prepare(
      "SELECT id, month, name, type, amount, category, head, date, notes FROM expenses WHERE month = ? ORDER BY date DESC, name"
    ).all(month) as Record<string, unknown>[];
    return Response.json({ expenses: rows.map(rowToExpense) });
  } catch (e) { return authErrorResponse(e); }
}

export async function POST(req: Request) {
  try {
    await requireTab("expenses");
    let body: unknown;
    try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
    const parsed = Body.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    const d = parsed.data;
    const id = d.id || newId();
    getDb().prepare(
      `INSERT OR REPLACE INTO expenses (id, month, name, type, amount, category, head, date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, d.month, d.name, d.type, d.amount, d.category, d.head, d.date, d.notes);
    return Response.json({ id });
  } catch (e) { return authErrorResponse(e); }
}
