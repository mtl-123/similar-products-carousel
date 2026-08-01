/// <reference types="@cloudflare/workers-types" />

interface CloudflareEnv {
  UPLOADS: KVNamespace;
  DB: D1Database;
  ASSETS: Fetcher;
}

declare namespace Cloudflare {
  interface Env extends CloudflareEnv {}
}
