import type { Command } from "commander";
import type { WorkflowAction } from "../types.js";

export interface RulesCommandDeps {
  runRulesInit: WorkflowAction;
  runRulesTechMd: WorkflowAction;
}

export function registerRulesCommands(program: Command, deps: RulesCommandDeps) {
  const rulesCommand = program
    .command("rules")
    .description(
      "Create and sync strict engineering rules and generated TECH.md",
    );

  rulesCommand
    .command("init")
    .description(
      "Create/update ENGINEERING_RULES.md, patch active platform rule file with managed guardrail block, and generate TECH.md",
    )
    .option("-p, --platform <platform>", "target platform id")
    .option("--scope <scope>", "target scope: project|global", "project")
    .option("--overwrite", "overwrite existing ENGINEERING_RULES.md and TECH.md")
    .option("--skip-tech", "skip TECH.md generation")
    .option("--dry-run", "preview changes without writing files")
    .action(deps.runRulesInit);

  rulesCommand
    .command("tech-md")
    .description("Scan the codebase and generate/update TECH.md")
    .option("--output <path>", "output path (default: <workspace-root>/TECH.md)")
    .option("--overwrite", "overwrite existing TECH.md")
    .option("--compact", "generate compact TECH.md (stack + context budget only)")
    .option("--dry-run", "preview generation without writing files")
    .action(deps.runRulesTechMd);

  rulesCommand.action(() => {
    rulesCommand.help();
  });
}
