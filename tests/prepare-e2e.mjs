import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const projectDirectory = process.cwd();
const persistDirectoryName = process.env.E2E_PERSIST_DIR || ".wrangler-e2e";
const testDataDirectory = path.join(projectDirectory, persistDirectoryName);
if (path.dirname(testDataDirectory) !== projectDirectory || !/^\.wrangler-e2e(?:-[a-z0-9-]+)?$/.test(path.basename(testDataDirectory))) {
  throw new Error("E2E data directory must stay inside the project.");
}
fs.rmSync(testDataDirectory, { recursive: true, force: true });

const migration = spawnSync("npx", ["wrangler", "d1", "migrations", "apply", "northstar-commerce", "--local", "--persist-to", testDataDirectory], {
  cwd: projectDirectory,
  env: process.env,
  shell: process.platform === "win32",
  stdio: "inherit",
});
if (migration.error) throw migration.error;
if (migration.status !== 0) process.exit(migration.status || 1);
