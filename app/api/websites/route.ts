import { z } from "zod";
import { getDb, newId } from "@/lib/db";
import { authErrorResponse, requireTab } from "@/lib/auth";
import {
  WEBSITE_DESC_MAX,
  WEBSITE_NAME_MAX,
  WEBSITE_URL_MAX,
  normalizeWebsiteUrl,
  type Website,
} from "@/lib/websites";

type Row = {
  id: string;
  name: string;
  url: string;
  description: string;
  sort_order: number;
  created_at: number;
};

function listWebsites(): Website[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, name, url, description, sort_order, created_at
         FROM gallery_websites
        ORDER BY sort_order, created_at`
    )
    .all() as Row[];

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    url: r.url,
    description: r.description,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
  }));
}

export async function GET() {
  return Response.json({ websites: listWebsites() });
}

const PostBody = z.object({
  name: z.string().trim().min(1, "Name is required").max(WEBSITE_NAME_MAX),
  url: z.string().trim().min(1, "URL is required").max(WEBSITE_URL_MAX),
  description: z.string().trim().max(WEBSITE_DESC_MAX).optional(),
});

export async function POST(req: Request) {
  try {
    await requireTab("gallery");

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = PostBody.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const url = normalizeWebsiteUrl(parsed.data.url);
    if (!url) {
      return Response.json({ error: "Enter a valid http(s) website URL" }, { status: 400 });
    }

    const db = getDb();
    const id = newId();
    const nextOrder = (
      db.prepare("SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM gallery_websites").get() as {
        n: number;
      }
    ).n;

    db.prepare(
      `INSERT INTO gallery_websites (id, name, url, description, sort_order)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, parsed.data.name, url, parsed.data.description || "", nextOrder);

    return Response.json({
      website: {
        id,
        name: parsed.data.name,
        url,
        description: parsed.data.description || "",
        sortOrder: nextOrder,
      },
    });
  } catch (e) {
    return authErrorResponse(e);
  }
}
