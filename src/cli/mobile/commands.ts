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
    .description(
      "Run canonical mobile testing flows and compatibility helpers",
    );

  const qaCommand = mobileCommand
    .command("qa")
    .description(
      "Compatibility command for mobile testing via android-emulator-testing, ios-simulator-testing, and mobile-mcp fallback paths",
    );

  qaCommand
    .command("run")
    .description("Execute a charter-driven mobile testing run")
    .requiredOption(
      "--charter <path>",
      "path to the mobile testing YAML charter",
    )
    .option("--apk <path>", "optional APK to install before launch")
    .option("--package <id>", "optional package id override")
    .option("--avd <name>", "optional AVD name to target")
    .option(
      "--artifacts-dir <path>",
      "artifact root directory (default: artifacts/mobile-qa legacy compatibility path)",
      "artifacts/mobile-qa",
    )
    .option("--scope <scope>", "auto|global|project", "auto")
    .option(
      "--android-mcp",
      "opt in to Android MCP-assisted mobile testing; CLI-first ADB remains the default",
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
