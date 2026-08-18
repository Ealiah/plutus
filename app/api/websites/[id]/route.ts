import { z } from "zod";
import { getDb } from "@/lib/db";
import { authErrorResponse, requireTab } from "@/lib/auth";
import {
  WEBSITE_DESC_MAX,
  WEBSITE_NAME_MAX,
  WEBSITE_URL_MAX,
  normalizeWebsiteUrl,
} from "@/lib/websites";

const PatchBody = z.object({
  name: z.string().trim().min(1).max(WEBSITE_NAME_MAX).optional(),
  url: z.string().trim().min(1).max(WEBSITE_URL_MAX).optional(),
  description: z.string().trim().max(WEBSITE_DESC_MAX).optional(),
  sortOrder: z.number().int().min(0).max(10000).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    await requireTab("gallery");
    const { id } = await ctx.params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = PatchBody.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const db = getDb();
    const existing = db.prepare("SELECT id FROM gallery_websites WHERE id = ?").get(id);
    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

    if (data.url !== undefined) {
      const url = normalizeWebsiteUrl(data.url);
      if (!url) {
        return Response.json({ error: "Enter a valid http(s) website URL" }, { status: 400 });
      }
      db.prepare("UPDATE gallery_websites SET url = ? WHERE id = ?").run(url, id);
    }
    if (data.name !== undefined) {
      db.prepare("UPDATE gallery_websites SET name = ? WHERE id = ?").run(data.name, id);
    }
    if (data.description !== undefined) {
      db.prepare("UPDATE gallery_websites SET description = ? WHERE id = ?").run(
        data.description,
        id
      );
    }
    if (data.sortOrder !== undefined) {
      db.prepare("UPDATE gallery_websites SET sort_order = ? WHERE id = ?").run(data.sortOrder, id);
    }

    return Response.json({ ok: true });
  } catch (e) {
    return authErrorResponse(e);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    await requireTab("gallery");
    const { id } = await ctx.params;

    const db = getDb();
    const res = db.prepare("DELETE FROM gallery_websites WHERE id = ?").run(id);
    if (res.changes === 0) return Response.json({ error: "Not found" }, { status: 404 });

    return Response.json({ ok: true });
  } catch (e) {
    return authErrorResponse(e);
  }
}
