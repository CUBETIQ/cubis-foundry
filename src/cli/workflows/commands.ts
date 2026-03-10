import type { Command } from "commander";
import type {
  CommandDecorator,
  WorkflowAction,
  WorkflowDoctorAction,
  WorkflowTargetAction,
} from "../types.js";

export interface WorkflowCommandDeps {
  withInstallOptions: CommandDecorator;
  withWorkflowBaseOptions: CommandDecorator;
  registerConfigKeysSubcommands: (configCommand: Command) => void;
  runWorkflowInstall: WorkflowAction;
  runWorkflowRemove: WorkflowTargetAction;
  runWorkflowRemoveAll: WorkflowAction;
  runWorkflowPruneSkills: WorkflowAction;
  runWorkflowSyncRules: WorkflowAction;
  runWorkflowDoctor: WorkflowDoctorAction;
  runWorkflowConfig: WorkflowAction;
  printPlatforms: () => void;
  defaultSkillProfile: string;
}

export function registerWorkflowCommands(
  program: Command,
  deps: WorkflowCommandDeps,
) {
  const workflowsCommand = program
    .command("workflows")
    .description(
      "Install and manage workflow bundles for Antigravity, Codex, Copilot, and Claude",
    );

  workflowsCommand
    .command("platforms")
    .description("List workflow platform ids and defaults")
    .action(deps.printPlatforms);

  deps
    .withInstallOptions(
      workflowsCommand
        .command("install")
        .description("Install a workflow bundle into the selected platform"),
    )
    .action(deps.runWorkflowInstall);

  deps
    .withWorkflowBaseOptions(
      workflowsCommand
        .command("remove <bundle-or-workflow>")
        .description("Remove an installed bundle or workflow and sync rules")
        .option("--dry-run", "preview remove and sync without writing files")
        .option("-y, --yes", "skip interactive confirmation"),
    )
    .action(deps.runWorkflowRemove);

  workflowsCommand
    .command("remove-all")
    .description(
      "Remove all CBX-managed generated artifacts (workflows/agents/skills/rules/MCP config)",
    )
    .option(
      "-p, --platform <platform>",
      "target platform id or 'all' (default: all)",
      "all",
    )
    .option(
      "--scope <scope>",
      "target scope: project|global|all (default: all)",
      "all",
    )
    .option(
      "--target <path>",
      "remove project-scope artifacts from target project directory",
    )
    .option(
      "--include-credentials",
      "also remove ~/.cbx/credentials.env when scope includes global",
    )
    .option("--dry-run", "preview remove operations without writing files")
    .option("-y, --yes", "skip interactive confirmation")
    .action(deps.runWorkflowRemoveAll);

  deps
    .withWorkflowBaseOptions(
      workflowsCommand
        .command("prune-skills")
        .description(
          "Prune nested duplicates and out-of-profile installed skills",
        )
        .option(
          "-b, --bundle <bundle>",
          "bundle id (default: agent-environment-setup)",
        )
        .option(
          "--skill-profile <profile>",
          "skill prune profile: core|web-backend|full (default: core)",
          deps.defaultSkillProfile,
        )
        .option("--all-skills", "alias for --skill-profile full")
        .option(
          "--dry-run",
          "preview prune operations without deleting files",
        )
        .option("-y, --yes", "skip interactive confirmation"),
    )
    .action(deps.runWorkflowPruneSkills);

  deps
    .withWorkflowBaseOptions(
      workflowsCommand
        .command("sync-rules")
        .description(
          "Rebuild the managed workflow routing block for the selected platform",
        )
        .option("--dry-run", "preview managed rule sync without writing files")
        .option("--json", "output JSON"),
    )
    .action(deps.runWorkflowSyncRules);

  deps
    .withWorkflowBaseOptions(
      workflowsCommand
        .command("doctor [platform]")
        .description(
          "Validate workflow paths, rule file status, and managed block health",
        )
        .option("--json", "output JSON"),
    )
    .action(deps.runWorkflowDoctor);

  const workflowsConfigCommand = workflowsCommand
    .command("config")
    .description("View or edit cbx_config.json from terminal")
    .option(
      "-p, --platform <platform>",
      "target platform id for MCP target patch",
    )
    .option(
      "--scope <scope>",
      "config scope: project|workspace|global|user",
      "global",
    )
    .option("--show", "show current config (default when no edit flags)")
    .option("--edit", "edit Postman default workspace ID interactively")
    .option("--workspace-id <id|null>", "set postman.defaultWorkspaceId")
    .option("--clear-workspace-id", "set postman.defaultWorkspaceId to null")
    .option(
      "--postman-mode <mode>",
      "set postman.mcpUrl via mode: minimal|code|full",
    )
    .option("--mcp-runtime <runtime>", "set mcp.runtime: docker|local")
    .option("--mcp-fallback <fallback>", "set mcp.fallback: local|fail|skip")
    .option("--show-after", "print JSON after update")
    .option("--dry-run", "preview changes without writing files")
    .action(deps.runWorkflowConfig);

  deps.registerConfigKeysSubcommands(workflowsConfigCommand);

  workflowsCommand.action(() => {
    workflowsCommand.help();
  });
}
