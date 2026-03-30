import { describe, expect, it, vi } from "vitest";
import { registerCommands, type CliRegistrationDeps } from "./register.js";

function makeDeps(): CliRegistrationDeps {
  const noop = vi.fn();
  return {
    cliVersion: "0.0.0-test",
    printPlatforms: noop,
    withInstallOptions: (command) => command,
    withWorkflowBaseOptions: (command) => command,
    registerConfigKeysSubcommands: noop,
    runWorkflowInstall: noop,
    runWorkflowRemove: noop,
    runWorkflowRemoveAll: noop,
    runWorkflowPruneSkills: noop,
    runWorkflowSyncRules: noop,
    runWorkflowDoctor: noop,
    runDoctor: noop,
    runWorkflowConfig: noop,
    runInitWizard: noop,
    defaultSkillProfile: "full",
    runMcpServe: noop,
    runMcpToolsSync: noop,
    runMcpToolsList: noop,
    runMcpRuntimeStatus: noop,
    runMcpRuntimeUp: noop,
    runMcpRuntimeDown: noop,
    defaultMcpDockerContainerName: "cbx-mcp-test",
    runRulesInit: noop,
    runRulesTechMd: noop,
    runBuildArchitecture: noop,
    runWorkspaceAdd: noop,
    runWorkspaceSync: noop,
    runContextGenerate: noop,
    runContextDiff: noop,
    runContextValidate: noop,
    runHarnessAudit: noop,
    runLoopStart: noop,
    runLoopStatus: noop,
    runLoopStop: noop,
    runMemoryReview: noop,
    runMemoryApply: noop,
    runMemoryPrune: noop,
    runProfileSet: noop,
    runWorkspaceUpgrade: noop,
    runMcpStatus: noop,
    runMcpTest: noop,
    runMcpProxy: noop,
    runMobileQa: noop,
    runWebQa: noop,
  };
}

describe("registerCommands()", () => {
  it("registers the top-level doctor command", () => {
    const program = registerCommands(makeDeps());

    const doctor = program.commands.find((command) => command.name() === "doctor");

    expect(doctor).toBeDefined();
    expect(doctor?.description()).toContain("health report");
  });

  it("exposes mobile in mcp tool service help surfaces", () => {
    const program = registerCommands(makeDeps());
    const mcp = program.commands.find((command) => command.name() === "mcp");
    const tools = mcp?.commands.find((command) => command.name() === "tools");
    const sync = tools?.commands.find((command) => command.name() === "sync");
    const list = tools?.commands.find((command) => command.name() === "list");

    expect(sync?.helpInformation()).toContain("postman|stitch|mobile|all");
    expect(list?.helpInformation()).toContain("postman|stitch|mobile");
  });

  it("labels the mobile skill profile as a legacy compatibility id in init help", () => {
    const program = registerCommands(makeDeps());
    const init = program.commands.find((command) => command.name() === "init");
    const help = init?.helpInformation() ?? "";

    expect(help).toContain("--skill-profile <profile>");
    expect(help).toContain("skills profile: core|web-backend|mobile-qa");
    expect(help).toContain("(legacy mobile-testing id)|full");
  });
});
