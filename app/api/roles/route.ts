import { getDb } from "@/lib/db";
import { authErrorResponse, requireUser } from "@/lib/auth";

export async function GET() {
  try {
    await requireUser();
    const db = getDb();
    const rows = db
      .prepare("SELECT id, name, allowed_tabs, is_system FROM roles ORDER BY name")
      .all() as Array<{ id: string; name: string; allowed_tabs: string; is_system: number }>;

    return Response.json({
      roles: rows.map((r) => {
        let allowedTabs: string[] = [];
        try {
          allowedTabs = JSON.parse(r.allowed_tabs);
        } catch {
          allowedTabs = [];
        }
        return {
          id: r.id,
          name: r.name,
          allowedTabs,
          isSystem: !!r.is_system,
        };
      }),
    });
  } catch (e) {
    return authErrorResponse(e);
  }
}
