import type { Command } from "commander";
import type { WorkflowAction } from "../types.js";

export interface MobileCommandDeps {
  runMobileTesting: WorkflowAction;
}

export function registerMobileCommands(
  program: Command,
  deps: MobileCommandDeps,
) {
  const mobileCommand = program
    .command("mobile")
    .description("Run canonical mobile testing flows");

  const testingCommand = mobileCommand
    .command("test")
    .description(
      "Run the Android-focused mobile testing compatibility runner while routing broader work through android-emulator-testing, ios-simulator-testing, and mobile-mcp",
    );

  testingCommand
    .command("run")
    .description("Execute a charter-driven mobile testing run")
    .requiredOption(
      "--charter <path>",
      "path to the mobile testing YAML charter",
    )
    .option("--apk <path>", "optional Android APK to install before launch")
    .option("--package <id>", "optional Android package id override")
    .option("--avd <name>", "optional Android AVD name to target")
    .option(
      "--artifacts-dir <path>",
      "artifact root directory (default: artifacts/mobile-testing)",
      "artifacts/mobile-testing",
    )
    .option("--scope <scope>", "auto|global|project", "auto")
    .option("--dry-run", "validate inputs and emit the planned artifact paths")
    .action(deps.runMobileTesting);

  testingCommand.action(() => {
    testingCommand.help();
  });

  mobileCommand.action(() => {
    mobileCommand.help();
  });
}
