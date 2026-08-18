import { z } from "zod";
import { getDb, newId } from "@/lib/db";
import { authErrorResponse, requireTab } from "@/lib/auth";

const Body = z.object({
  id: z.string().min(1).max(64).optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  name: z.string().min(1).max(200),
  role: z.string().max(200).optional().default(""),
  department: z.string().min(1).max(200),
  salary: z.number().nonnegative(),
  bonus: z.number().nonnegative(),
});

function rowToEmployee(r: Record<string, unknown>) {
  return {
    id: r.id, month: r.month, name: r.name, role: r.role,
    department: r.department, salary: r.salary, bonus: r.bonus,
  };
}

export async function GET(req: Request) {
  try {
    await requireTab("salaries");
    const month = new URL(req.url).searchParams.get("month") || "";
    const db = getDb();
    const rows = db.prepare(
      "SELECT id, month, name, role, department, salary, bonus FROM employees WHERE month = ? ORDER BY name"
    ).all(month) as Record<string, unknown>[];
    return Response.json({ employees: rows.map(rowToEmployee) });
  } catch (e) { return authErrorResponse(e); }
}

export async function POST(req: Request) {
  try {
    await requireTab("salaries");
    let body: unknown;
    try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
    const parsed = Body.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    const d = parsed.data;

    const db = getDb();
    const id = d.id || newId();
    db.prepare(
      `INSERT OR REPLACE INTO employees (id, month, name, role, department, salary, bonus)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, d.month, d.name, d.role, d.department, d.salary, d.bonus);
    return Response.json({ id });
  } catch (e) { return authErrorResponse(e); }
}
