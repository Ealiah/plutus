import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { getDb } from "./db";
import { TabId } from "./permissions";

export type SessionData = {
  userId?: string;
};

export type CurrentUser = {
  id: string;
  username: string;
  roleName: string;
  allowedTabs: TabId[];
  isOwner: boolean;
};

const cookieName = "plutus_session";

function getSessionOptions(): SessionOptions {
  const password = process.env.IRON_SESSION_PASSWORD;
  if (!password || password.length < 32) {
    throw new Error("IRON_SESSION_PASSWORD must be set and at least 32 characters long.");
  }
  return {
    password,
    cookieName,
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      httpOnly: true,
      path: "/",
    },
  };
}

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, getSessionOptions());
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  if (!session.userId) return null;

  const db = getDb();
  const row = db
    .prepare(
      `SELECT users.id AS id, users.username AS username, users.disabled AS disabled,
              roles.name AS role_name, roles.allowed_tabs AS allowed_tabs
         FROM users
         JOIN roles ON roles.id = users.role_id
        WHERE users.id = ?`
    )
    .get(session.userId) as
    | {
        id: string;
        username: string;
        disabled: number;
        role_name: string;
        allowed_tabs: string;
      }
    | undefined;

  if (!row || row.disabled) return null;

  let allowedTabs: TabId[] = [];
  try {
    allowedTabs = JSON.parse(row.allowed_tabs);
  } catch {
    allowedTabs = [];
  }

  return {
    id: row.id,
    username: row.username,
    roleName: row.role_name,
    allowedTabs,
    isOwner: row.role_name === "owner",
  };
}

export async function requireUser(): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u) throw new AuthError("Not authenticated", 401);
  return u;
}

export async function requireOwner(): Promise<CurrentUser> {
  const u = await requireUser();
  if (!u.isOwner) throw new AuthError("Forbidden", 403);
  return u;
}

export async function requireTab(tab: TabId): Promise<CurrentUser> {
  const u = await requireUser();
  if (!u.allowedTabs.includes(tab)) throw new AuthError("Forbidden", 403);
  return u;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function authErrorResponse(err: unknown) {
  if (err instanceof AuthError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  return Response.json({ error: "Internal error" }, { status: 500 });
}
