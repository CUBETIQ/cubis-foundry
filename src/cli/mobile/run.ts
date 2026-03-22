import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { expandPath, packageRoot } from "../pathing.js";
import type { AnyOptions } from "../types.js";

function resolveMobileQaRunnerPath() {
  return path.join(packageRoot(), "mcp", "runtime", "mobile-qa-runner.mjs");
}

export async function runMobileQa(options: AnyOptions) {
  try {
    const cwd = process.cwd();
    const charterValue = String(options.charter || "").trim();
    if (!charterValue) {
      throw new Error("--charter is required.");
    }

    const runnerPath = resolveMobileQaRunnerPath();
    if (!existsSync(runnerPath)) {
      throw new Error(
        `Mobile QA runner not found at ${runnerPath}. Reinstall or rebuild the package so mcp/runtime assets are present.`,
      );
    }

    const args = [
      runnerPath,
      "--charter",
      expandPath(charterValue, cwd),
      "--artifacts-dir",
      expandPath(String(options.artifactsDir || "artifacts/mobile-qa"), cwd),
      "--scope",
      String(options.scope || "auto"),
    ];
    if (options.apk) {
      args.push("--apk", expandPath(String(options.apk), cwd));
    }
    if (options.package) {
      args.push("--package", String(options.package));
    }
    if (options.avd) {
      args.push("--avd", String(options.avd));
    }
    if (options.allowAdbFallback) {
      args.push("--allow-adb-fallback");
    }
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
          reject(new Error(`Mobile QA runner terminated by signal ${signal}.`));
          return;
        }
        if (code && code !== 0) {
          reject(new Error(`Mobile QA runner exited with status ${code}.`));
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
