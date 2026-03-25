import type { Command } from "commander";
import { compile } from "../compiler/index.js";
import { join } from "node:path";

/**
 * Register `cbx catalog build` subcommand.
 *
 * Usage:
 *   cbx catalog build          # build for all platforms
 *   cbx catalog build --platform claude  # build for specific platform
 */
export function registerCatalogCommands(program: Command) {
  const catalogCommand = program
    .command("catalog")
    .description("Inspect and validate the Foundry control-plane catalog");

  catalogCommand
    .command("build")
    .description(
      "Compile the catalog and generate platform-specific runtime assets",
    )
    .option(
      "--platform <platform>",
      "compile for a specific platform only (claude|codex|copilot|gemini|antigravity)",
    )
    .option(
      "--dry-run",
      "run the compilation pipeline without writing files to disk",
    )
    .action(async (options) => {
      try {
        const cwd = process.cwd();
        const platform = options.platform ?? undefined;
        const dryRun = options.dryRun ?? false;

        if (dryRun) {
          console.log(`[cbx] Dry run — would compile catalog for: ${
            platform ?? "all platforms"
          }`);
          console.log(`[cbx] Working directory: ${cwd}`);
          return;
        }

        const results = await compile(cwd, platform);

        if (results.length === 0) {
          console.log("[cbx catalog build] No platforms compiled (no adapters found).");
          return;
        }

        for (const result of results) {
          console.log(
            `[cbx] Built ${result.platform}: ${result.assets.length} asset(s) -> ${result.outputDir} (${result.durationMs}ms)`,
          );
        }

        console.log(`[cbx] Catalog build complete: ${results.length} platform(s) compiled.`);
      } catch (error) {
        console.error("[cbx catalog build] Failed:", error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  catalogCommand
    .command("validate")
    .description("Validate the Foundry catalog and report errors/warnings")
    .action(async () => {
      // Delegate to scripts/validate-catalog.mjs logic via dynamic import.
      // This avoids duplicating the validation logic in the CLI.
      const { loadCatalog } = await import("../catalog/index.js");
      const { validateCatalog } = await import("../catalog/validators/index.js");
      try {
        const cwd = process.cwd();
        const catalog = await loadCatalog(cwd);
        const result = validateCatalog(catalog);

        if (result.errors.length > 0) {
          for (const issue of result.errors) {
            console.error(`ERROR ${issue.path}: ${issue.message}`);
          }
        }

        if (result.warnings.length > 0) {
          for (const issue of result.warnings) {
            console.warn(`WARNING ${issue.path}: ${issue.message}`);
          }
        }

        if (result.valid) {
          console.log("Catalog is valid.");
        } else {
          console.error(`Catalog validation failed: ${result.errors.length} error(s).`);
          process.exit(1);
        }
      } catch (error) {
        console.error("[cbx catalog validate] Failed:", error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}
