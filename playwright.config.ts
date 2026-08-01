import { defineConfig, devices } from "@playwright/test";

process.env.NO_PROXY = [process.env.NO_PROXY, "127.0.0.1", "localhost"].filter(Boolean).join(",");
process.env.no_proxy = process.env.NO_PROXY;
const e2ePersistDirectory = process.env.E2E_PERSIST_DIR || ".wrangler-e2e";
if (!/^\.wrangler-e2e(?:-[a-z0-9-]+)?$/.test(e2ePersistDirectory)) {
  throw new Error("E2E persistence directory must stay inside the project.");
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:9401",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `npx opennextjs-cloudflare preview -- --port 9401 --persist-to ${e2ePersistDirectory} --var ALLOW_DEMO_AUTH:true`,
    url: "http://127.0.0.1:9401/login?role=admin",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      SESSION_SECRET: "northstar-e2e-session-secret",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
