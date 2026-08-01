import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type Role = "admin" | "affiliate" | "support";

const secret = process.env.SESSION_SECRET || "northstar-local-session-secret";
const cookieName = "northstar_session";

const demoAccounts: Record<Role, { email: string; password: string; name: string }> = {
  admin: { email: "admin@northstar.demo", password: "northstar-admin", name: "Alex Morgan" },
  affiliate: { email: "maya@northstar.demo", password: "creator-demo", name: "Maya Chen" },
  support: { email: "support@northstar.demo", password: "support-demo", name: "Jordan Lee" },
};

function signature(payload: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function validateDemoLogin(role: Role, email: string, password: string) {
  const account = demoAccounts[role];
  return account.email === email && account.password === password ? account : null;
}

export function createSessionValue(role: Role, email: string, name: string) {
  const payload = Buffer.from(JSON.stringify({ role, email, name })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export async function getSession() {
  const value = (await cookies()).get(cookieName)?.value;
  if (!value) return null;
  const [payload, provided] = value.split(".");
  if (!payload || !provided) return null;
  const expected = signature(payload);
  if (provided.length !== expected.length || !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { role: Role; email: string; name: string };
  } catch {
    return null;
  }
}

export async function setSession(value: string) {
  (await cookies()).set(cookieName, value, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 12, path: "/" });
}

export async function clearSession() {
  (await cookies()).delete(cookieName);
}

export async function requireRole(roles: Role[]) {
  const session = await getSession();
  if (!session || !roles.includes(session.role)) redirect(`/login?role=${roles[0]}`);
  return session;
}

export async function assertRole(roles: Role[]) {
  const session = await getSession();
  if (!session || !roles.includes(session.role)) throw new Error("Unauthorized");
  return session;
}

export { demoAccounts };
