import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = resolve(import.meta.dirname, "../../..");
const REMOVED_SKILLS = [
  "qa",
  "unit-testing",
  "integration-testing",
  "playwright-interactive",
  "stitch",
  "flutter-mobile-qa",
  "playwright-web-qa",
  "ui-testing-harness",
  "stitch-design-orchestrator",
  "stitch-design-system",
  "stitch-implementation-handoff",
  "stitch-prompt-enhancement",
  "mcp-core",
  "research-core",
  "rules-core",
];

function readRelative(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), "utf8");
}

describe("shared workflow bundle", () => {
  it("does not advertise removed skills in the shared agent and workflow docs", () => {
    const files = [
      "workflows/workflows/agent-environment-setup/shared/agents/tester.md",
      "workflows/workflows/agent-environment-setup/shared/workflows/test.md",
      "workflows/workflows/agent-environment-setup/shared/workflows/web-testing.md",
      "workflows/workflows/agent-environment-setup/shared/workflows/implement.md",
      "workflows/workflows/agent-environment-setup/shared/workflows/ui-testing.md",
      "workflows/workflows/agent-environment-setup/shared/workflows/design-screen.md",
      "workflows/workflows/agent-environment-setup/shared/workflows/design-refresh.md",
      "workflows/workflows/agent-environment-setup/shared/rules/STEERING.md",
    ];

    for (const file of files) {
      const content = readRelative(file);
      for (const removedSkill of REMOVED_SKILLS) {
        expect(content).not.toContain(`\`${removedSkill}\``);
      }
    }
  });

  it("removes deleted skill IDs from the shared workflow manifest", () => {
    const manifest = JSON.parse(
      readRelative("workflows/workflows/agent-environment-setup/manifest.json"),
    ) as {
      platforms: Record<string, { skills?: string[] }>;
    };

    for (const platform of Object.values(manifest.platforms)) {
      const skills = platform.skills ?? [];
      for (const removedSkill of REMOVED_SKILLS) {
        expect(skills).not.toContain(removedSkill);
      }
    }
  });
});
