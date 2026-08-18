import path from "node:path";
import fs from "node:fs/promises";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { GALLERY_SECTIONS, GRID_CATEGORIES, getUploadsDir } from "@/lib/gallery";
import { authErrorResponse, requireTab } from "@/lib/auth";

const PatchBody = z.object({
  section: z.enum(GALLERY_SECTIONS).optional(),
  category: z.enum(GRID_CATEGORIES).optional(),
  altText: z.string().max(200).optional(),
  caption: z.string().max(500).optional(),
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
      return Response.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }
    const data = parsed.data;

    const db = getDb();
    const existing = db.prepare("SELECT id FROM gallery_images WHERE id = ?").get(id);
    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

    if (data.section) db.prepare("UPDATE gallery_images SET section = ? WHERE id = ?").run(data.section, id);
    if (data.category) db.prepare("UPDATE gallery_images SET category = ? WHERE id = ?").run(data.category, id);
    if (typeof data.altText === "string") db.prepare("UPDATE gallery_images SET alt_text = ? WHERE id = ?").run(data.altText, id);
    if (typeof data.caption === "string") db.prepare("UPDATE gallery_images SET caption = ? WHERE id = ?").run(data.caption, id);
    if (typeof data.sortOrder === "number") db.prepare("UPDATE gallery_images SET sort_order = ? WHERE id = ?").run(data.sortOrder, id);

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
    const row = db
      .prepare("SELECT filename FROM gallery_images WHERE id = ?")
      .get(id) as { filename: string } | undefined;
    if (!row) return Response.json({ error: "Not found" }, { status: 404 });

    db.prepare("DELETE FROM gallery_images WHERE id = ?").run(id);

    try {
      await fs.unlink(path.join(getUploadsDir(), row.filename));
    } catch {
      /* file may have been removed manually — ignore */
    }

    return Response.json({ ok: true });
  } catch (e) {
    return authErrorResponse(e);
  }
}
