import { z } from "zod";
import { getDb } from "@/lib/db";
import { authErrorResponse, requireTab } from "@/lib/auth";

const Body = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  clientId: z.string().min(1),
  sections: z.record(z.string(), z.string()),
});

export async function GET(req: Request) {
  try {
    await requireTab("heads");
    const month = new URL(req.url).searchParams.get("month") || "";
    const rows = getDb().prepare(
      "SELECT client_id, month, sections FROM client_section_heads WHERE month = ?"
    ).all(month) as Array<{ client_id: string; month: string; sections: string }>;
    return Response.json({
      sectionHeads: rows.map((r) => ({
        clientId: r.client_id,
        month: r.month,
        sections: safeParseRecord(r.sections),
      })),
    });
  } catch (e) { return authErrorResponse(e); }
}

export async function PUT(req: Request) {
  try {
    await requireTab("heads");
    let body: unknown;
    try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
    const parsed = Body.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    const d = parsed.data;
    getDb().prepare(
      `INSERT INTO client_section_heads (client_id, month, sections)
       VALUES (?, ?, ?)
       ON CONFLICT(client_id, month) DO UPDATE SET sections = excluded.sections`
    ).run(d.clientId, d.month, JSON.stringify(d.sections));
    return Response.json({ ok: true });
  } catch (e) { return authErrorResponse(e); }
}

function safeParseRecord(s: string): Record<string, string> {
  try {
    const v = JSON.parse(s);
    if (v && typeof v === "object") return v as Record<string, string>;
  } catch {}
  return {};
}
