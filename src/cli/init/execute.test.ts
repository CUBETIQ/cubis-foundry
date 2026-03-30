import { describe, expect, it } from "vitest";
import { formatInitSummary } from "./execute.js";

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
});
