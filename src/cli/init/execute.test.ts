import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import {
  __executeInitContextGenerationForTests,
  __resetArchitectureCommandCaptureForTests,
  __setArchitectureCommandCaptureForTests,
  performWorkflowInstall,
} from "../core.js";
import { formatInitSummary } from "./execute.js";

function makeTempRepo(prefix: string) {
  const dir = join(
    tmpdir(),
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  );
  mkdirSync(dir, { recursive: true });
  execFileSync("git", ["init", dir], { stdio: "ignore" });
  return dir;
}

describe("formatInitSummary()", () => {
  afterEach(() => {
    __resetArchitectureCommandCaptureForTests();
  });

  it("labels mobile-testing as the canonical mobile profile in the init summary", () => {
    const summary = formatInitSummary({
      bundleId: "starter",
      platforms: ["codex"],
      skillProfile: "mobile-testing",
      timeoutMs: 0,
      skillsScope: "project",
      mcpScope: "project",
      mcpRuntime: "local",
      mcpBuildLocal: false,
      selectedMcps: [],
      postmanMode: "workspace",
      postmanWorkspaceId: null,
    });

    expect(summary).toContain("- Skill profile: mobile-testing");
    expect(summary).toContain("- Context timeout: disabled");
  });

  it("installs all project rule and platform surfaces for a non-interactive init plan", async () => {
    const target = makeTempRepo("foundry-init-regression");
    const sharedOptions = {
      scope: "project",
      bundle: "agent-environment-setup",
      skillProfile: "web-backend",
      dryRun: false,
      overwrite: false,
      yes: true,
      target,
      foundryMcp: true,
      playwright: true,
      stitch: false,
      postman: false,
      stitchDefaultForAntigravity: false,
      mcpScope: "project",
      mcpToolSync: false,
      mcpRuntime: "local",
      mcpFallback: "local",
      mcpBuildLocal: false,
      initWizardMode: true,
      authoringAi: "codex",
      skipContext: true,
    };

    for (const platform of [
      "codex",
      "antigravity",
      "copilot",
      "claude",
      "gemini",
    ]) {
      const result = await performWorkflowInstall({
        ...sharedOptions,
        platform,
      });
      expect(result.cancelled).toBe(false);
    }

    const expectedPaths = [
      "AGENTS.md",
      "CLAUDE.md",
      ".gemini/GEMINI.md",
      "GEMINI.md",
      ".agents/rules/GEMINI.md",
      ".github/copilot-instructions.md",
      ".codex/agents/debugger.toml",
      ".claude/agents/debugger.md",
      ".github/agents/debugger.agent.md",
      ".gemini/commands/agent-debugger.toml",
      ".agents/skills/api-design/SKILL.md",
      ".claude/skills/api-design/SKILL.md",
      ".github/skills/api-design/SKILL.md",
      ".agents/skills/workflow-plan/SKILL.md",
      ".claude/skills/workflow-plan/SKILL.md",
      ".github/prompts/plan.prompt.md",
    ];

    for (const relativePath of expectedPaths) {
      expect(existsSync(join(target, relativePath)), relativePath).toBe(true);
    }
  });

  it("downgrades init context-generation timeouts to warnings", async () => {
    const target = makeTempRepo("foundry-init-context-timeout");
    __setArchitectureCommandCaptureForTests({
      execFileCapture: async (command, args) => {
        if (command === "codex" && args[0] === "exec" && args[1] === "--help") {
          return {
            ok: true,
            stdout: "Usage: codex exec [options] <prompt>\n  --skip-git-repo-check",
            stderr: "",
          };
        }
        throw new Error(`Unexpected execFileCapture: ${command} ${args.join(" ")}`);
      },
      spawnCapture: async () => ({
        ok: false,
        stdout: "",
        stderr: "Process timed out after 180000ms.\n",
        code: 124,
      }),
    });

    const outcome = await __executeInitContextGenerationForTests({
      platform: "codex",
      research: "auto",
      overwrite: false,
      dryRun: false,
      quiet: true,
      target,
    });

    expect(outcome.contextResult).toBeNull();
    expect(outcome.warning).toContain("timed out during init");
    expect(outcome.warning).toContain("cbx build architecture --platform codex");
    expect(outcome.warning).toContain("cbx init --skip-context");
  });

  it("passes timeout-ms=0 through as an unlimited architecture build timeout", async () => {
    const target = makeTempRepo("foundry-context-no-timeout");
    const observed: { timeoutMs?: number } = {};

    __setArchitectureCommandCaptureForTests({
      execFileCapture: async (command, args) => {
        if (command === "codex" && args[0] === "exec" && args[1] === "--help") {
          return {
            ok: true,
            stdout: "Usage: codex exec [options] <prompt>\n  --skip-git-repo-check",
            stderr: "",
          };
        }
        throw new Error(`Unexpected execFileCapture: ${command} ${args.join(" ")}`);
      },
      spawnCapture: async (_command, _args, options) => {
        observed.timeoutMs = options.timeoutMs;
        return {
          ok: true,
          stdout:
            '{"files_written":[],"research_used":false,"gaps":[],"next_actions":[]}\n',
          stderr: "",
          code: 0,
        };
      },
    });

    const outcome = await __executeInitContextGenerationForTests({
      platform: "codex",
      research: "auto",
      overwrite: false,
      dryRun: false,
      quiet: true,
      target,
      timeoutMs: 0,
    });

    expect(outcome.warning).toBeNull();
    expect(outcome.contextResult?.timeoutMs).toBe(0);
    expect(observed.timeoutMs).toBe(0);
  });
});
