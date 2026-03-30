import type { Command } from "commander";
import type { WorkflowAction } from "../types.js";

export interface WebCommandDeps {
  runWebTesting: WorkflowAction;
}

export function registerWebCommands(program: Command, deps: WebCommandDeps) {
  const webCommand = program
    .command("web")
    .description("Run canonical web testing flows");

  const testingCommand = webCommand
    .command("test")
    .description(
      "Run charter-driven web testing on web-testing + Playwright MCP",
    );

  testingCommand
    .command("run")
    .description("Execute a charter-driven web testing run")
    .requiredOption("--charter <path>", "path to the web testing YAML charter")
    .option(
      "--artifacts-dir <path>",
      "artifact root directory (default: artifacts/web-testing)",
      "artifacts/web-testing",
    )
    .option("--scope <scope>", "auto|global|project", "auto")
    .option("--dry-run", "validate inputs and emit the planned artifact paths")
    .action(deps.runWebTesting);

  testingCommand.action(() => {
    testingCommand.help();
  });

  webCommand.action(() => {
    webCommand.help();
  });
}
