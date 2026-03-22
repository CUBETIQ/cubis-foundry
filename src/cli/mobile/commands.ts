import type { Command } from "commander";
import type { WorkflowAction } from "../types.js";

export interface MobileCommandDeps {
  runMobileQa: WorkflowAction;
}

export function registerMobileCommands(
  program: Command,
  deps: MobileCommandDeps,
) {
  const mobileCommand = program
    .command("mobile")
    .description("Run first-class mobile QA workflows and validation helpers");

  const qaCommand = mobileCommand
    .command("qa")
    .description("Run deterministic Flutter/Android QA flows");

  qaCommand
    .command("run")
    .description("Execute a charter-driven mobile QA run")
    .requiredOption("--charter <path>", "path to the mobile QA YAML charter")
    .option("--apk <path>", "optional APK to install before launch")
    .option("--package <id>", "optional package id override")
    .option("--avd <name>", "optional AVD name to target")
    .option(
      "--artifacts-dir <path>",
      "artifact root directory",
      "artifacts/mobile-qa",
    )
    .option("--scope <scope>", "auto|global|project", "auto")
    .option(
      "--allow-adb-fallback",
      "allow direct adb execution while Android MCP runtime support is adapter-gated",
    )
    .option("--dry-run", "validate inputs and emit the planned artifact paths")
    .action(deps.runMobileQa);

  qaCommand.action(() => {
    qaCommand.help();
  });

  mobileCommand.action(() => {
    mobileCommand.help();
  });
}
