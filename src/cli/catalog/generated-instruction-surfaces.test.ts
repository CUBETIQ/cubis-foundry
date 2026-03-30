import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = resolve(import.meta.dirname, "../../..");

function readRelative(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), "utf8");
}

describe("generated instruction surfaces", () => {
  it("does not advertise deleted stitch skill routes in platform asset generation", () => {
    const generatorSource = readRelative("scripts/generate-platform-assets.mjs");

    expect(generatorSource).toContain(
      "deep-research|design|web-ui-design|mobile-ui-design|design-system|skill-creator|api-design|database-design",
    );
    expect(generatorSource).not.toContain(
      "deep-research|stitch|design|web-ui-design|mobile-ui-design|design-system|skill-creator|api-design|database-design",
    );
    expect(generatorSource).toContain("Playwright MCP for web flows");
    expect(generatorSource).toContain("prefer `mobile-mcp` for semantic mobile flows");
    expect(generatorSource).toContain("CLI fallback for deterministic logs");
  });

  it("stops treating stitch as a valid skill in smoke and mirror scripts", () => {
    const smokeScript = readRelative("scripts/mcp-http-smoke.mjs");
    const mirrorSyncScript = readRelative("scripts/sync-skill-mirrors.mjs");

    expect(smokeScript).toContain('args: { id: "design" }');
    expect(smokeScript).not.toContain('args: { id: "stitch" }');
    expect(mirrorSyncScript).not.toContain('skillId === "stitch"');
    expect(mirrorSyncScript).not.toContain('skillId === "stitch-design-orchestrator"');
    expect(mirrorSyncScript).not.toContain('skillId === "stitch-prompt-enhancement"');
    expect(mirrorSyncScript).not.toContain('skillId === "stitch-design-system"');
    expect(mirrorSyncScript).not.toContain('skillId === "stitch-implementation-handoff"');
  });

  it("keeps hook guidance aligned to runtime boundaries and verification policy", () => {
    const preToolGuide = readRelative("foundry/modules/hooks-core/hooks/pre-tool.md");
    const postToolGuide = readRelative("foundry/modules/hooks-core/hooks/post-tool.md");

    expect(preToolGuide).toContain("Playwright MCP");
    expect(preToolGuide).toContain("`mobile-mcp`");
    expect(preToolGuide).toContain("CLI fallback");
    expect(postToolGuide).toContain("verification step");
    expect(postToolGuide).toContain("Playwright MCP");
    expect(postToolGuide).toContain("`mobile-mcp`");
  });
});
