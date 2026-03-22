import type { Command } from "commander";
import type { WorkflowAction } from "../types.js";

export interface WebCommandDeps {
  runWebQa: WorkflowAction;
}

export function registerWebCommands(program: Command, deps: WebCommandDeps) {
  const webCommand = program
    .command("web")
    .description("Run first-class web QA workflows and validation helpers");

  const qaCommand = webCommand
    .command("qa")
    .description("Run deterministic Playwright QA flows");

  qaCommand
    .command("run")
    .description("Execute a charter-driven web QA run")
    .requiredOption("--charter <path>", "path to the web QA YAML charter")
    .option(
      "--artifacts-dir <path>",
      "artifact root directory",
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
