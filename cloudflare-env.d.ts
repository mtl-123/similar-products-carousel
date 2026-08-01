/// <reference types="@cloudflare/workers-types" />

interface CloudflareEnv {
  UPLOADS: KVNamespace;
  DB: D1Database;
  ASSETS: Fetcher;
  ADMIN_PASSWORD?: string;
  AFFILIATE_PASSWORD?: string;
  SUPPORT_PASSWORD?: string;
  SESSION_SECRET?: string;
  INBOUND_WEBHOOK_TOKEN?: string;
  ALLOW_DEMO_AUTH?: string;
}

declare namespace Cloudflare {
  interface Env extends CloudflareEnv {}
}
