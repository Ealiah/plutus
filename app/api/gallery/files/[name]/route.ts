import path from "node:path";
import fs from "node:fs";
import { getUploadsDir } from "@/lib/gallery";

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

type Ctx = { params: Promise<{ name: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { name } = await ctx.params;
  // Reject any path traversal
  if (name.includes("/") || name.includes("\\") || name.includes("..") || !name) {
    return new Response("Bad request", { status: 400 });
  }

  const dir = getUploadsDir();
  const filePath = path.join(dir, name);
  // Confirm path stays inside uploads dir
  if (!filePath.startsWith(dir + path.sep)) {
    return new Response("Bad request", { status: 400 });
  }

  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch {
    return new Response("Not found", { status: 404 });
  }
  if (!stat.isFile()) return new Response("Not found", { status: 404 });

  const ext = path.extname(name).toLowerCase();
  const mime = MIME_BY_EXT[ext] || "application/octet-stream";
  const buf = fs.readFileSync(filePath);
  // Convert Buffer to ArrayBuffer view that Web Response accepts in Node runtime
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(stat.size),
      "Cache-Control": "public, max-age=3600",
    },
  });
}
