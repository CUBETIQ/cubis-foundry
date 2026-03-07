import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

function hasExpect() {
  const probe = process.platform === "win32"
    ? spawnSync("where", ["expect"], { encoding: "utf8" })
    : spawnSync("which", ["expect"], { encoding: "utf8" });
  return probe.status === 0;
}

const cliArg = process.argv[2];
if (!cliArg) {
  console.error("Usage: node scripts/run-init-tty-test.mjs <path-to-cli>");
  process.exit(1);
}

if (!hasExpect()) {
  console.log("TTY_INIT_SKIPPED: expect is not available in this environment");
  process.exit(0);
}

const scriptPath = path.resolve("scripts", "test-init-tty.exp");
const cliPath = path.resolve(cliArg);
const result = spawnSync("expect", [scriptPath, cliPath], {
  stdio: "inherit",
  encoding: "utf8",
});

if (typeof result.status === "number") {
  process.exit(result.status);
}

process.exit(1);
