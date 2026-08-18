import path from "node:path";
import fs from "node:fs/promises";
import sharp from "sharp";
import { getDb, newId } from "@/lib/db";
import {
  GALLERY_SECTIONS,
  GRID_CATEGORIES,
  fileUrl,
  getUploadsDir,
  type GalleryImage,
} from "@/lib/gallery";
import { authErrorResponse, requireTab } from "@/lib/auth";

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, filename, section, category, alt_text, caption, sort_order, created_at
         FROM gallery_images
        ORDER BY section, sort_order, created_at`
    )
    .all() as Array<{
    id: string;
    filename: string;
    section: string;
    category: string;
    alt_text: string;
    caption: string;
    sort_order: number;
    created_at: number;
  }>;

  const images: GalleryImage[] = rows.map((r) => ({
    id: r.id,
    filename: r.filename,
    url: fileUrl(r.filename),
    section: (r.section === "hero" ? "hero" : "grid"),
    category: r.category,
    altText: r.alt_text,
    caption: r.caption,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
  }));

  return Response.json({ images });
}

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB

export async function POST(req: Request) {
  try {
    await requireTab("gallery");
    const form = await req.formData();
    const file = form.get("file");
    const section = String(form.get("section") || "grid");
    const category = String(form.get("category") || "automotive");
    const altText = String(form.get("altText") || "");
    const caption = String(form.get("caption") || "");

    if (!(file instanceof File)) {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return Response.json({ error: "Only JPG/PNG/WebP/GIF allowed" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return Response.json({ error: "Max upload size 8 MB" }, { status: 400 });
    }
    if (!GALLERY_SECTIONS.includes(section as never)) {
      return Response.json({ error: "Invalid section" }, { status: 400 });
    }
    if (section === "grid" && !GRID_CATEGORIES.includes(category as never)) {
      return Response.json({ error: "Invalid category" }, { status: 400 });
    }

    const id = newId();
    const filename = `${id}.webp`;
    const inputBuf = Buffer.from(await file.arrayBuffer());

    // Animated GIFs need the animated flag preserved through sharp; everything else is a single-frame conversion.
    const isAnimated = file.type === "image/gif";
    const webpBuf = await sharp(inputBuf, isAnimated ? { animated: true } : undefined)
      .rotate() // honor EXIF orientation on JPEGs from phones
      .webp({ quality: 82, effort: 5 })
      .toBuffer();

    const dir = getUploadsDir();
    await fs.writeFile(path.join(dir, filename), webpBuf);

    const db = getDb();
    const nextOrder = (
      db.prepare(
        "SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM gallery_images WHERE section = ?"
      ).get(section) as { n: number }
    ).n;

    db.prepare(
      `INSERT INTO gallery_images (id, filename, section, category, alt_text, caption, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, filename, section, category, altText, caption, nextOrder);

    return Response.json({
      image: {
        id,
        filename,
        url: fileUrl(filename),
        section,
        category,
        altText,
        caption,
        sortOrder: nextOrder,
      },
    });
  } catch (e) {
    return authErrorResponse(e);
  }
}
