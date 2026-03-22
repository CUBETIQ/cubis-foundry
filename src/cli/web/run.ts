import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { expandPath, packageRoot } from "../pathing.js";
import type { AnyOptions } from "../types.js";

function resolveWebQaRunnerPath() {
  return path.join(packageRoot(), "mcp", "runtime", "web-qa-runner.mjs");
}

export async function runWebQa(options: AnyOptions) {
  try {
    const cwd = process.cwd();
    const charterValue = String(options.charter || "").trim();
    if (!charterValue) {
      throw new Error("--charter is required.");
    }

    const runnerPath = resolveWebQaRunnerPath();
    if (!existsSync(runnerPath)) {
      throw new Error(
        `Web QA runner not found at ${runnerPath}. Reinstall or rebuild the package so mcp/runtime assets are present.`,
      );
    }

    const args = [
      runnerPath,
      "--charter",
      expandPath(charterValue, cwd),
      "--artifacts-dir",
      expandPath(String(options.artifactsDir || "artifacts/web-qa"), cwd),
      "--scope",
      String(options.scope || "auto"),
    ];
    if (options.dryRun) {
      args.push("--dry-run");
    }

    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, args, {
        cwd,
        stdio: "inherit",
        env: process.env,
      });

      child.once("error", reject);
      child.once("exit", (code, signal) => {
        if (signal) {
          reject(new Error(`Web QA runner terminated by signal ${signal}.`));
          return;
        }
        if (code && code !== 0) {
          reject(new Error(`Web QA runner exited with status ${code}.`));
          return;
        }
        resolve(null);
      });
    });
  } catch (error) {
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}
