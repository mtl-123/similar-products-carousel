import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getRuntimeText } from "@/lib/runtime-env";

export type Role = "admin" | "affiliate" | "support";

const cookieName = "northstar_session";

const accountProfiles: Record<Role, { email: string; demoPassword: string; name: string; passwordBinding: "ADMIN_PASSWORD" | "AFFILIATE_PASSWORD" | "SUPPORT_PASSWORD" }> = {
  admin: { email: "admin@northstar.demo", demoPassword: "northstar-admin", name: "Alex Morgan", passwordBinding: "ADMIN_PASSWORD" },
  affiliate: { email: "maya@northstar.demo", demoPassword: "creator-demo", name: "Maya Chen", passwordBinding: "AFFILIATE_PASSWORD" },
  support: { email: "support@northstar.demo", demoPassword: "support-demo", name: "Jordan Lee", passwordBinding: "SUPPORT_PASSWORD" },
};

async function signature(payload: string) {
  const secret = await getRuntimeText("SESSION_SECRET") || "northstar-local-session-secret";
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export async function validateDemoLogin(role: Role, email: string, password: string) {
  const profile = accountProfiles[role];
  const allowDemoPasswords = process.env.NODE_ENV !== "production" || await getRuntimeText("ALLOW_DEMO_AUTH") === "true";
  const configuredPassword = await getRuntimeText(profile.passwordBinding);
  const expectedPassword = configuredPassword || (allowDemoPasswords ? profile.demoPassword : "");
  return expectedPassword && profile.email === email && expectedPassword === password ? profile : null;
}

export async function createSessionValue(role: Role, email: string, name: string) {
  const payload = Buffer.from(JSON.stringify({ role, email, name })).toString("base64url");
  return `${payload}.${await signature(payload)}`;
}

export async function getSession() {
  const value = (await cookies()).get(cookieName)?.value;
  if (!value) return null;
  const [payload, provided] = value.split(".");
  if (!payload || !provided) return null;
  const expected = await signature(payload);
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
