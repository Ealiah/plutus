import { getDb } from "@/lib/db";
import { authErrorResponse, requireUser } from "@/lib/auth";

// Bundle of everything for a single month — used by the client to hydrate the store
export async function GET(req: Request) {
  try {
    const me = await requireUser();
    const allowed = new Set(me.allowedTabs);
    const month = new URL(req.url).searchParams.get("month") || "";
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return Response.json({ error: "Invalid month" }, { status: 400 });
    }

    const db = getDb();
    const out: Record<string, unknown> = {};

    if (allowed.has("details") || allowed.has("overview") || allowed.has("percentages") || allowed.has("heads")) {
      const rows = db.prepare(
        "SELECT id, month, name, expected_income, actual_income, payment_status, date, notes, head_id FROM clients WHERE month = ? ORDER BY name"
      ).all(month) as Record<string, unknown>[];
      out.clients = rows.map((r) => ({
        id: r.id, month: r.month, name: r.name,
        expectedIncome: r.expected_income, actualIncome: r.actual_income,
        paymentStatus: r.payment_status, date: r.date, notes: r.notes, headId: r.head_id,
      }));
    } else { out.clients = []; }

    if (allowed.has("salaries") || allowed.has("overview")) {
      const rows = db.prepare(
        "SELECT id, month, name, role, department, salary, bonus FROM employees WHERE month = ? ORDER BY name"
      ).all(month) as Record<string, unknown>[];
      out.employees = rows;
    } else { out.employees = []; }

    if (allowed.has("expenses") || allowed.has("overview")) {
      const rows = db.prepare(
        "SELECT id, month, name, type, amount, category, head, date, notes FROM expenses WHERE month = ? ORDER BY date DESC"
      ).all(month) as Record<string, unknown>[];
      out.expenses = rows;
    } else { out.expenses = []; }

    if (allowed.has("heads") || allowed.has("overview")) {
      const rows = db.prepare(
        "SELECT id, month, name, email, phone FROM heads WHERE month = ? ORDER BY name"
      ).all(month) as Record<string, unknown>[];
      out.heads = rows;
    } else { out.heads = []; }

    if (allowed.has("percentages") || allowed.has("overview")) {
      const rows = db.prepare(
        "SELECT client_id, percentages FROM client_percentages WHERE month = ?"
      ).all(month) as Array<{ client_id: string; percentages: string }>;
      out.percentages = rows.map((r) => ({
        clientId: r.client_id,
        percentages: safeParse(r.percentages) as Record<string, number>,
      }));
    } else { out.percentages = []; }

    if (allowed.has("heads") || allowed.has("overview")) {
      const rows = db.prepare(
        "SELECT client_id, sections FROM client_section_heads WHERE month = ?"
      ).all(month) as Array<{ client_id: string; sections: string }>;
      out.sectionHeads = rows.map((r) => ({
        clientId: r.client_id,
        sections: safeParse(r.sections) as Record<string, string>,
      }));
    } else { out.sectionHeads = []; }

    return Response.json(out);
  } catch (e) { return authErrorResponse(e); }
}

function safeParse(s: string): unknown {
  try { return JSON.parse(s); } catch { return {}; }
}
