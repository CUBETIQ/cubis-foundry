import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = resolve(import.meta.dirname, "../../..");

function readRelative(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), "utf8");
}

describe("platform asset bundle", () => {
  it("projects the canonical workflow and agent surfaces into the bundle manifest", () => {
    const manifest = JSON.parse(
      readRelative("workflows/workflows/agent-environment-setup/manifest.json"),
    ) as {
      platforms: Record<
        string,
        {
          agents?: string[];
          generatedSkills?: string[];
          commands?: string[];
        }
      >;
    };

    expect(manifest.platforms.codex.agents).toEqual([
      "debugger.toml",
      "explorer.toml",
      "implementer.toml",
      "orchestrator.toml",
      "planner.toml",
      "researcher.toml",
      "reviewer.toml",
      "tester.toml",
    ]);

    expect(manifest.platforms.codex.generatedSkills).toEqual([
      "workflow-debug",
      "workflow-deploy",
      "workflow-design-audit",
      "workflow-design-screen",
      "workflow-design-system",
      "workflow-implement",
      "workflow-loop",
      "workflow-plan",
      "workflow-review",
      "workflow-test",
    ]);

    expect(manifest.platforms.antigravity.commands).not.toContain(
      "design-refresh.toml",
    );
    expect(manifest.platforms.antigravity.commands).not.toContain(
      "mobile-testing.toml",
    );
    expect(manifest.platforms.antigravity.commands).not.toContain(
      "ui-testing.toml",
    );
  });

  it("builds route metadata from canonical workflow frontmatter", () => {
    const routeManifest = JSON.parse(
      readRelative(
        "workflows/workflows/agent-environment-setup/generated/route-manifest.json",
      ),
    ) as {
      summary: { workflows: number; agents: number };
      routes: Array<{
        kind: string;
        id: string;
        primaryAgent?: string;
        primarySkills?: string[];
        supportingSkills?: string[];
      }>;
    };

    expect(routeManifest.summary.workflows).toBe(10);
    expect(routeManifest.summary.agents).toBe(8);

    const planRoute = routeManifest.routes.find(
      (route) => route.kind === "workflow" && route.id === "plan",
    );
    expect(planRoute).toBeDefined();
    expect(planRoute?.primaryAgent).toBe("explorer");
    expect(planRoute?.primarySkills).toEqual([
      "spec-driven-delivery",
      "system-design",
    ]);
    expect(planRoute?.supportingSkills).toEqual(["deep-research"]);
  });

  it("emits the generated platform source tree needed by init", () => {
    const expectedPaths = [
      "workflows/workflows/agent-environment-setup/platforms/codex/rules/AGENTS.md",
      "workflows/workflows/agent-environment-setup/platforms/codex/agents/researcher.toml",
      "workflows/workflows/agent-environment-setup/platforms/codex/generated-skills/plan/SKILL.md",
      "workflows/workflows/agent-environment-setup/platforms/claude/rules/CLAUDE.md",
      "workflows/workflows/agent-environment-setup/platforms/claude/hooks/scripts/pre-tool-example.mjs",
      "workflows/workflows/agent-environment-setup/platforms/copilot/rules/copilot-instructions.md",
      "workflows/workflows/agent-environment-setup/platforms/gemini/rules/GEMINI.md",
      "workflows/workflows/agent-environment-setup/platforms/antigravity/rules/GEMINI.md",
      "workflows/workflows/agent-environment-setup/platforms/antigravity/commands/agent-researcher.toml",
    ];

    for (const relativePath of expectedPaths) {
      expect(existsSync(resolve(REPO_ROOT, relativePath))).toBe(true);
    }
  });

  it("tracks parity docs and upstream audits with explicit provenance", () => {
    const manifest = JSON.parse(
      readRelative("workflows/workflows/agent-environment-setup/manifest.json"),
    ) as {
      parity: {
        auditedReferences: Array<{ runtime: string }>;
        artifacts: { docs: string[] };
      };
    };
    const audit = JSON.parse(
      readRelative(
        "workflows/workflows/agent-environment-setup/generated/upstream-capability-audit.json",
      ),
    ) as {
      audits: Array<{
        runtime: string;
        source_type: string;
        evidence: Array<{ kind: string; stability: string }>;
      }>;
    };

    expect(manifest.parity.artifacts.docs).toContain(
      "docs/platform-capability-audit.md",
    );
    expect(
      manifest.parity.auditedReferences.map((entry) => entry.runtime).sort(),
    ).toEqual(["antigravity", "claude", "codex", "copilot", "gemini"]);
    expect(audit.audits.map((entry) => entry.runtime).sort()).toEqual([
      "antigravity",
      "claude",
      "codex",
      "copilot",
      "gemini",
    ]);
    expect(
      audit.audits.find((entry) => entry.runtime === "antigravity"),
    ).toMatchObject({
      source_type: "inferred-compatibility",
      evidence: [{ kind: "inferred", stability: "inferred" }],
    });
  });

  it("publishes surface provenance and corrected platform support claims", () => {
    const surfaceSpec = JSON.parse(
      readRelative(
        "workflows/workflows/agent-environment-setup/generated/platform-surface-spec.json",
      ),
    ) as {
      platforms: Record<
        string,
        {
          workflows: Record<string, unknown>;
          hooks: Record<string, unknown>;
          subagents: Record<string, unknown>;
        }
      >;
    };

    expect(surfaceSpec.platforms.codex.hooks).toMatchObject({
      vendorSupport: expect.stringContaining("native"),
      foundryStatus: "gated",
      projectPath: ".codex/hooks/*.json + .codex/config.toml",
      evidenceKinds: ["official-doc", "local-cli"],
      surfaceScope: "repo",
      stability: "experimental",
    });

    expect(surfaceSpec.platforms.claude.workflows).toMatchObject({
      vendorSupport: expect.stringContaining("slash commands"),
      nativeOrProjected: "projected workflow skill",
      surfaceScope: "repo",
    });

    expect(surfaceSpec.platforms.gemini.subagents).toMatchObject({
      vendorSupport: expect.stringContaining("experimental"),
      foundryStatus: "do-not-ship",
      projectPath: ".gemini/agents/*.md",
      evidenceKinds: ["official-doc"],
      surfaceScope: "repo",
      stability: "experimental",
    });
  });
});
