import { Command } from "commander";
import type {
  CommandDecorator,
  WorkflowAction,
  WorkflowDoctorAction,
  WorkflowTargetAction,
} from "../types.js";
import { registerWorkflowCommands } from "../workflows/commands.js";
import { registerMcpCommands } from "../mcp/commands.js";
import { registerRulesCommands } from "../rules/commands.js";

export interface CliRegistrationDeps {
  cliVersion: string;
  printPlatforms: () => void;
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
  runInitWizard: WorkflowAction;
  defaultSkillProfile: string;
  runMcpServe: WorkflowAction;
  runMcpToolsSync: WorkflowAction;
  runMcpToolsList: WorkflowAction;
  runMcpRuntimeStatus: WorkflowAction;
  runMcpRuntimeUp: WorkflowAction;
  runMcpRuntimeDown: WorkflowAction;
  defaultMcpDockerContainerName: string;
  runRulesInit: WorkflowAction;
  runRulesTechMd: WorkflowAction;
}

export function registerCommands(deps: CliRegistrationDeps) {
  const program = new Command();
  program
    .name("cbx")
    .description("Cubis Foundry CLI for workflow-first AI agent environments")
    .version(deps.cliVersion);

  program
    .command("init")
    .description("Run guided interactive install wizard")
    .option("-y, --yes", "accept defaults and apply without confirmation")
    .option("--dry-run", "preview wizard execution without writing files")
    .option("--target <path>", "run against target project directory")
    .option("--bundle <bundleId>", "workflow bundle id")
    .option(
      "--platforms <items>",
      "comma-separated platforms: codex,antigravity,copilot",
    )
    .option(
      "--skill-profile <profile>",
      "skills profile: core|web-backend|full",
    )
    .option(
      "--skills-scope <scope>",
      "scope for skills install: global|project",
    )
    .option("--mcp-scope <scope>", "scope for MCP config: global|project")
    .option(
      "--mcps <items>",
      "comma-separated MCP selections: cubis-foundry,postman,stitch",
    )
    .option("--postman-mode <mode>", "Postman mode: full|minimal")
    .option(
      "--postman-workspace-id <id|null>",
      "optional: set default Postman workspace ID (use 'null' for no default)",
    )
    .option("--mcp-runtime <runtime>", "MCP runtime: docker|local")
    .option(
      "--mcp-build-local",
      "when MCP runtime is docker, build image locally instead of pulling",
    )
    .option("--no-banner", "skip init welcome banner")
    .option("--json", "print machine-readable final summary")
    .action(deps.runInitWizard);

  registerWorkflowCommands(program, {
    printPlatforms: deps.printPlatforms,
    withInstallOptions: deps.withInstallOptions,
    withWorkflowBaseOptions: deps.withWorkflowBaseOptions,
    registerConfigKeysSubcommands: deps.registerConfigKeysSubcommands,
    runWorkflowInstall: deps.runWorkflowInstall,
    runWorkflowRemove: deps.runWorkflowRemove,
    runWorkflowRemoveAll: deps.runWorkflowRemoveAll,
    runWorkflowPruneSkills: deps.runWorkflowPruneSkills,
    runWorkflowSyncRules: deps.runWorkflowSyncRules,
    runWorkflowDoctor: deps.runWorkflowDoctor,
    runWorkflowConfig: deps.runWorkflowConfig,
    defaultSkillProfile: deps.defaultSkillProfile,
  });

  registerMcpCommands(program, {
    runMcpServe: deps.runMcpServe,
    runMcpToolsSync: deps.runMcpToolsSync,
    runMcpToolsList: deps.runMcpToolsList,
    runMcpRuntimeStatus: deps.runMcpRuntimeStatus,
    runMcpRuntimeUp: deps.runMcpRuntimeUp,
    runMcpRuntimeDown: deps.runMcpRuntimeDown,
    defaultMcpDockerContainerName: deps.defaultMcpDockerContainerName,
  });

  registerRulesCommands(program, {
    runRulesInit: deps.runRulesInit,
    runRulesTechMd: deps.runRulesTechMd,
  });

  const agentsCommand = program
    .command("agents")
    .description("Cubis Agent Bot commands");

  const removeCommand = program
    .command("remove")
    .description("Cleanup CBX-managed generated artifacts");
  removeCommand
    .command("all")
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
  removeCommand.action(() => {
    removeCommand.help();
  });

  agentsCommand
    .command("status")
    .description("Show Cubis Agent Bot availability")
    .action(() => {
      console.log("Cubis Agent Bot is planned but not wired yet.");
      console.log("Use `cbx workflows` to install and manage workflow bundles.");
    });

  agentsCommand.action(() => {
    agentsCommand.help();
  });

  return program;
}
