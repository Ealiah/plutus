import { z } from "zod";
import { getDb } from "@/lib/db";
import { authErrorResponse, requireTab } from "@/lib/auth";

const Body = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  clientId: z.string().min(1),
  percentages: z.record(z.string(), z.number().min(0).max(100)),
});

export async function GET(req: Request) {
  try {
    await requireTab("percentages");
    const month = new URL(req.url).searchParams.get("month") || "";
    const rows = getDb().prepare(
      "SELECT client_id, month, percentages FROM client_percentages WHERE month = ?"
    ).all(month) as Array<{ client_id: string; month: string; percentages: string }>;
    return Response.json({
      percentages: rows.map((r) => ({
        clientId: r.client_id,
        month: r.month,
        percentages: safeParseRecord(r.percentages),
      })),
    });
  } catch (e) { return authErrorResponse(e); }
}

// PUT acts as upsert keyed by (clientId, month)
export async function PUT(req: Request) {
  try {
    await requireTab("percentages");
    let body: unknown;
    try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
    const parsed = Body.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    const d = parsed.data;
    getDb().prepare(
      `INSERT INTO client_percentages (client_id, month, percentages)
       VALUES (?, ?, ?)
       ON CONFLICT(client_id, month) DO UPDATE SET percentages = excluded.percentages`
    ).run(d.clientId, d.month, JSON.stringify(d.percentages));
    return Response.json({ ok: true });
  } catch (e) { return authErrorResponse(e); }
}

function safeParseRecord(s: string): Record<string, number> {
  try {
    const v = JSON.parse(s);
    if (v && typeof v === "object") return v as Record<string, number>;
  } catch {}
  return {};
}
