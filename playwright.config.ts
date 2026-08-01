import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

process.env.NO_PROXY = [process.env.NO_PROXY, "127.0.0.1", "localhost"].filter(Boolean).join(",");
process.env.no_proxy = process.env.NO_PROXY;

const testDataDirectory = path.join(process.cwd(), ".data-e2e");
if (path.dirname(testDataDirectory) !== process.cwd()) {
  throw new Error("E2E data directory must stay inside the project.");
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
    command: "npm run start -- -H 127.0.0.1 -p 9401",
    url: "http://127.0.0.1:9401/login?role=admin",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATA_DIRECTORY: testDataDirectory,
      SESSION_SECRET: "northstar-e2e-session-secret",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
