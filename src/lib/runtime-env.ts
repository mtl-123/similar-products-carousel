import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

export type RuntimeTextBinding =
  | "ADMIN_PASSWORD"
  | "AFFILIATE_PASSWORD"
  | "SUPPORT_PASSWORD"
  | "SESSION_SECRET"
  | "INBOUND_WEBHOOK_TOKEN"
  | "ALLOW_DEMO_AUTH";

export async function getRuntimeText(binding: RuntimeTextBinding) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const value = env[binding];
    if (typeof value === "string" && value) return value;
  } catch {
    // Next.js development runs without a Cloudflare request context.
  }

  return process.env[binding] || undefined;
}
