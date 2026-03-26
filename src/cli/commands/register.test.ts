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
});
