import type { Command } from "commander";
import type { WorkflowAction } from "../types.js";

export interface WebCommandDeps {
  runWebQa: WorkflowAction;
}

export function registerWebCommands(program: Command, deps: WebCommandDeps) {
  const webCommand = program
    .command("web")
    .description(
      "Run canonical web testing flows and compatibility helpers",
    );

  const qaCommand = webCommand
    .command("qa")
    .description(
      "Compatibility command for charter-driven web testing on web-testing + Playwright MCP",
    );

  qaCommand
    .command("run")
    .description("Execute a charter-driven web testing run")
    .requiredOption("--charter <path>", "path to the web testing YAML charter")
    .option(
      "--artifacts-dir <path>",
      "artifact root directory (default: artifacts/web-qa legacy compatibility path)",
      "artifacts/web-qa",
    )
    .option("--scope <scope>", "auto|global|project", "auto")
    .option("--dry-run", "validate inputs and emit the planned artifact paths")
    .action(deps.runWebQa);

  qaCommand.action(() => {
    qaCommand.help();
  });

  webCommand.action(() => {
    webCommand.help();
  });
}
