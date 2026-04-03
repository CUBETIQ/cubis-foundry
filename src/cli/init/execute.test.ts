import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { performWorkflowInstall } from "../core.js";
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
  it("labels mobile-testing as the canonical mobile profile in the init summary", () => {
    const summary = formatInitSummary({
      bundleId: "starter",
      platforms: ["codex"],
      skillProfile: "mobile-testing",
      skillsScope: "project",
      mcpScope: "project",
      mcpRuntime: "local",
      mcpBuildLocal: false,
      selectedMcps: [],
      postmanMode: "workspace",
      postmanWorkspaceId: null,
    });

    expect(summary).toContain("- Skill profile: mobile-testing");
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
});
