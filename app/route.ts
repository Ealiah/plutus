import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET() {
  const file = path.join(process.cwd(), "landing.html");
  let html: string;
  try {
    html = fs.readFileSync(file, "utf8");
  } catch {
    return new Response("Landing page not found", { status: 500 });
  }
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
