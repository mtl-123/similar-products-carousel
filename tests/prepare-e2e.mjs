import fs from "node:fs";
import path from "node:path";

const projectDirectory = process.cwd();
const testDataDirectory = path.join(projectDirectory, ".data-e2e");
if (path.dirname(testDataDirectory) !== projectDirectory) {
  throw new Error("E2E data directory must stay inside the project.");
}
fs.rmSync(testDataDirectory, { recursive: true, force: true });
