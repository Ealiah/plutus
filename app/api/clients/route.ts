import { z } from "zod";
import { getDb, newId } from "@/lib/db";
import { authErrorResponse, requireTab } from "@/lib/auth";

const Body = z.object({
  id: z.string().min(1).max(64).optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  name: z.string().min(1).max(200),
  expectedIncome: z.number().nonnegative(),
  actualIncome: z.number().nonnegative(),
  paymentStatus: z.enum(["Paid", "Partial", "Pending", "Overdue"]),
  date: z.string().max(40).optional().default(""),
  notes: z.string().max(2000).optional().default(""),
  headId: z.string().max(64).optional().default(""),
});

function rowToClient(r: Record<string, unknown>) {
  return {
    id: r.id,
    month: r.month,
    name: r.name,
    expectedIncome: r.expected_income,
    actualIncome: r.actual_income,
    paymentStatus: r.payment_status,
    date: r.date,
    notes: r.notes,
    headId: r.head_id,
  };
}

export async function GET(req: Request) {
  try {
    await requireTab("details");
    const url = new URL(req.url);
    const month = url.searchParams.get("month") || "";
    const db = getDb();
    const rows = db
      .prepare(
        "SELECT id, month, name, expected_income, actual_income, payment_status, date, notes, head_id FROM clients WHERE month = ? ORDER BY name"
      )
      .all(month) as Record<string, unknown>[];
    return Response.json({ clients: rows.map(rowToClient) });
  } catch (e) {
    return authErrorResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    await requireTab("details");
    let body: unknown;
    try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
    const parsed = Body.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    const d = parsed.data;

    const db = getDb();
    const id = d.id || newId();
    db.prepare(
      `INSERT OR REPLACE INTO clients (id, month, name, expected_income, actual_income, payment_status, date, notes, head_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, d.month, d.name, d.expectedIncome, d.actualIncome, d.paymentStatus, d.date, d.notes, d.headId);
    return Response.json({ id });
  } catch (e) {
    return authErrorResponse(e);
  }
}
