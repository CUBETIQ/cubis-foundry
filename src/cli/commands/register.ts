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
import { registerBuildCommands } from "../build/commands.js";
import { registerMobileCommands } from "../mobile/commands.js";
import { registerWebCommands } from "../web/commands.js";

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
  runBuildArchitecture: WorkflowAction;
  runWorkspaceAdd: WorkflowTargetAction;
  runWorkspaceSync: WorkflowDoctorAction;
  runContextGenerate: WorkflowAction;
  runContextDiff: WorkflowAction;
  runContextValidate: WorkflowAction;
  runHarnessAudit: WorkflowAction;
  runLoopStart: WorkflowAction;
  runLoopStatus: WorkflowAction;
  runLoopStop: WorkflowAction;
  runMemoryReview: WorkflowAction;
  runMemoryApply: WorkflowAction;
  runMemoryPrune: WorkflowAction;
  runProfileSet: WorkflowAction;
  runWorkspaceUpgrade: WorkflowAction;
  runMcpStatus: WorkflowAction;
  runMcpTest: WorkflowTargetAction;
  runMcpProxy: WorkflowAction;
  runMobileQa: WorkflowAction;
  runWebQa: WorkflowAction;
}

export function registerCommands(deps: CliRegistrationDeps) {
  const program = new Command();
  program
    .name("cbx")
    .description("Cubis Foundry CLI for workflow-first AI agent environments")
    .version(deps.cliVersion);

  program
    .command("init")
    .description("Bootstrap a secure AI workspace and harness in the current project")
    .option("-y, --yes", "accept defaults and apply without confirmation")
    .option("--dry-run", "preview wizard execution without writing files")
    .option("--overwrite", "overwrite existing files where supported")
    .option("--target <path>", "run against target project directory")
    .option("--bundle <bundleId>", "workflow bundle id")
    .option("--stack <stack>", "workspace stack: web|api|cli|mobile|ml|fullstack|monorepo")
    .option("--profile <profile>", "workspace profile: core|developer|security|research|full")
    .option("--template <template>", "optional organization template name")
    .option("--authoring-ai <platform>", "AI used for context docs: codex|claude|gemini|copilot")
    .option("--skip-context", "skip automatic context generation after install")
    .option(
      "--capability-packs <items>",
      "comma-separated packs: frontend,backend,database,devops,security,playwright,research,agentic",
    )
    .option(
      "--platforms <items>",
      "comma-separated platforms: codex,antigravity,copilot,claude,gemini",
    )
    .option(
      "--skill-profile <profile>",
      "skills profile: core|web-backend|mobile-qa|full",
    )
    .option(
      "--skills-scope <scope>",
      "deprecated for init: installs are workspace-only",
    )
    .option(
      "--mcp-scope <scope>",
      "deprecated for init: MCP config installs in workspace scope",
    )
    .option(
      "--mcps <items>",
      "comma-separated MCP selections: cubis-foundry,postman,stitch,playwright,android",
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

  program
    .command("add <platform>")
    .description("Add one platform projection to the current workspace")
    .option("--target <path>", "target project directory")
    .option("--overwrite", "overwrite existing managed files where supported")
    .option("--dry-run", "preview without writing files")
    .option("-y, --yes", "skip confirmation")
    .action(deps.runWorkspaceAdd);

  program
    .command("sync [platform]")
    .description("Detect drift and re-apply managed workspace assets")
    .option("--target <path>", "target project directory")
    .option("--check", "exit 1 if drift is detected")
    .option("--overwrite", "overwrite managed files during sync")
    .option("--dry-run", "preview sync without writing files")
    .action(deps.runWorkspaceSync);

  const contextCommand = program
    .command("context")
    .description("Generate and validate AI-readable workspace context docs");

  contextCommand
    .command("generate")
    .description("Generate or refresh foundation docs and platform rules")
    .option("--platform <platform>", "authoring AI: codex|claude|gemini|copilot")
    .option("--research <mode>", "research mode: auto|always|never", "auto")
    .option("--overwrite", "overwrite managed context scaffolding")
    .option("--watch", "reserved for future watch mode")
    .option("--dry-run", "preview generation invocation without writing files")
    .option("--json", "output JSON")
    .action(deps.runContextGenerate);

  contextCommand
    .command("diff")
    .description("Show context freshness and drift against current code")
    .option("--json", "output JSON")
    .action(deps.runContextDiff);

  contextCommand
    .command("validate")
    .description("Validate context completeness and freshness")
    .option("--json", "output JSON")
    .action(deps.runContextValidate);

  contextCommand.action(() => {
    contextCommand.help();
  });

  const harnessCommand = program
    .command("harness")
    .description("Inspect and manage workspace harness runtime state");

  harnessCommand
    .command("audit")
    .description("Run deterministic harness security and safety audit")
    .option("--scope <scope>", "repo|hooks|skills|commands|agents", "repo")
    .option("--format <format>", "text|json", "text")
    .action(deps.runHarnessAudit);

  harnessCommand.action(() => {
    harnessCommand.help();
  });

  const loopCommand = program
    .command("loop")
    .description("Manage bounded autonomous loop runs");

  loopCommand
    .command("start")
    .description("Create a managed loop run with explicit criteria")
    .requiredOption("--task <task>", "task description")
    .requiredOption("--completion-criteria <text>", "completion criteria")
    .option("--max-iterations <count>", "maximum iterations", "20")
    .option("--platform <platform>", "execution platform")
    .option("--validate-command <command>", "verification command to run between iterations")
    .option("--dry-run", "preview without writing runtime state")
    .action(deps.runLoopStart);

  loopCommand
    .command("status")
    .description("Show current or recent loop runs")
    .option("--id <id>", "specific loop run id")
    .option("--json", "output JSON")
    .action(deps.runLoopStatus);

  loopCommand
    .command("stop")
    .description("Stop a managed loop run")
    .requiredOption("--id <id>", "loop run id")
    .option("--reason <text>", "stop reason", "stopped by operator")
    .action(deps.runLoopStop);

  loopCommand.action(() => {
    loopCommand.help();
  });

  const memoryCommand = program
    .command("memory")
    .description("Review and apply staged continuous-learning artifacts");

  memoryCommand
    .command("review")
    .description("List staged learning candidates")
    .option("--json", "output JSON")
    .action(deps.runMemoryReview);

  memoryCommand
    .command("apply")
    .description("Apply a staged memory candidate to managed workspace memory")
    .requiredOption("--id <id>", "candidate file id")
    .option("--target <target>", "memory|context-pack|skill-note", "memory")
    .action(deps.runMemoryApply);

  memoryCommand
    .command("prune")
    .description("Remove stale staged learning candidates")
    .option("--all", "remove all staged candidates")
    .option("--id <id>", "remove a specific candidate")
    .action(deps.runMemoryPrune);

  memoryCommand.action(() => {
    memoryCommand.help();
  });

  const profileCommand = program
    .command("profile")
    .description("Manage workspace harness safety profiles");

  profileCommand
    .command("set <profile>")
    .description("Set hook/autonomy profile: minimal|standard|strict|autonomous")
    .option("--target <path>", "target project directory")
    .action(deps.runProfileSet);

  profileCommand.action(() => {
    profileCommand.help();
  });

  program
    .command("upgrade")
    .description("Upgrade managed workspace assets to the latest Foundry catalog")
    .option("--platform <platform>", "upgrade only one platform")
    .option("--dry-run", "preview upgrade without writing files")
    .option("--check", "report upgrade drift and exit 1 when changes are needed")
    .option("--changelog", "print managed areas that will be refreshed")
    .action(deps.runWorkspaceUpgrade);

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
    runMcpStatus: deps.runMcpStatus,
    runMcpTest: deps.runMcpTest,
    runMcpProxy: deps.runMcpProxy,
  });

  registerRulesCommands(program, {
    runRulesInit: deps.runRulesInit,
    runRulesTechMd: deps.runRulesTechMd,
  });

  registerBuildCommands(program, {
    runBuildArchitecture: deps.runBuildArchitecture,
  });

  registerMobileCommands(program, {
    runMobileQa: deps.runMobileQa,
  });

  registerWebCommands(program, {
    runWebQa: deps.runWebQa,
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


