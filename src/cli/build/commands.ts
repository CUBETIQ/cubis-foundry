import type { Command } from "commander";
import type { WorkflowAction } from "../types.js";

export interface BuildCommandDeps {
  runBuildArchitecture: WorkflowAction;
}

export function registerBuildCommands(
  program: Command,
  deps: BuildCommandDeps,
) {
  const buildCommand = program
    .command("build")
    .description("Run strict platform-native build helpers");

  buildCommand
    .command("architecture")
    .description(
      "Refresh PRODUCT.md, ARCHITECTURE.md, ENGINEERING_RULES.md, TECH.md, ROADMAP.md, and ADR scaffolds via a strict platform-native CLI subprocess",
    )
    .requiredOption(
      "--platform <platform>",
      "architecture build platform: codex|claude|gemini|copilot",
    )
    .option(
      "--research <mode>",
      "research mode: auto|always|never",
      "auto",
    )
    .option("--check", "report managed architecture-doc drift without writing")
    .option("--overwrite", "overwrite existing managed scaffolding when needed")
    .option("--dry-run", "probe the target CLI and print the planned invocation")
    .option("--json", "output JSON")
    .action(deps.runBuildArchitecture);

  buildCommand.action(() => {
    buildCommand.help();
  });
}
