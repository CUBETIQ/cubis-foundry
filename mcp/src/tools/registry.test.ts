import { describe, expect, it } from "vitest";
import {
  TOOL_REGISTRY,
  getToolsByCategory,
  getRegisteredToolNames,
  buildRegistrySummary,
  type ToolRegistryEntry,
  type ToolRuntimeContext,
} from "./registry.js";
import type { VaultManifest } from "../vault/types.js";

function createTestContext(): ToolRuntimeContext {
  const manifest: VaultManifest = {
    categories: ["frontend", "backend"],
    skills: [
      {
        id: "react-expert",
        category: "frontend",
        path: "/tmp/react-expert/SKILL.md",
        fileBytes: 100,
      },
    ],
    fullCatalogBytes: 100,
    fullCatalogEstimatedTokens: 25,
  };

  return {
    manifest,
    charsPerToken: 4,
    summaryMaxLength: 200,
    defaultConfigScope: "auto",
  };
}

describe("tool registry", () => {
  it("contains all expected built-in tools", () => {
    const names = getRegisteredToolNames();
    expect(names).toContain("skill_list_categories");
    expect(names).toContain("skill_browse_category");
    expect(names).toContain("skill_search");
    expect(names).toContain("skill_validate");
    expect(names).toContain("skill_get");
    expect(names).toContain("skill_get_reference");
    expect(names).toContain("skill_budget_report");
    expect(names).toContain("postman_get_mode");
    expect(names).toContain("postman_set_mode");
    expect(names).toContain("postman_get_status");
    expect(names).toContain("stitch_get_mode");
    expect(names).toContain("stitch_set_profile");
    expect(names).toContain("stitch_get_status");
  });

  it("has exactly 13 built-in tools", () => {
    expect(TOOL_REGISTRY).toHaveLength(13);
  });

  it("has no duplicate tool names", () => {
    const names = getRegisteredToolNames();
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it("every entry has required fields", () => {
    for (const entry of TOOL_REGISTRY) {
      expect(entry.name).toBeTruthy();
      expect(entry.description).toBeTruthy();
      expect(entry.schema).toBeTruthy();
      expect(entry.category).toMatch(/^(skill|postman|stitch)$/);
      expect(typeof entry.createHandler).toBe("function");
    }
  });

  it("filters by category", () => {
    const skillTools = getToolsByCategory("skill");
    expect(skillTools).toHaveLength(7);
    expect(skillTools.every((t) => t.category === "skill")).toBe(true);

    const postmanTools = getToolsByCategory("postman");
    expect(postmanTools).toHaveLength(3);

    const stitchTools = getToolsByCategory("stitch");
    expect(stitchTools).toHaveLength(3);
  });

  it("creates handlers from runtime context", () => {
    const ctx = createTestContext();
    for (const entry of TOOL_REGISTRY) {
      const handler = entry.createHandler(ctx);
      expect(typeof handler).toBe("function");
    }
  });

  it("skill_list_categories handler returns valid result from registry", async () => {
    const ctx = createTestContext();
    const entry = TOOL_REGISTRY.find(
      (t) => t.name === "skill_list_categories",
    )!;
    const handler = entry.createHandler(ctx);
    const result = (await handler({})) as {
      content: Array<{ text: string }>;
    };
    const data = JSON.parse(result.content[0].text);
    expect(data.totalSkills).toBe(1);
  });

  it("buildRegistrySummary produces correct structure", () => {
    const summary = buildRegistrySummary();
    expect(summary.totalTools).toBe(13);
    expect(summary.categories).toHaveProperty("skill");
    expect(summary.categories).toHaveProperty("postman");
    expect(summary.categories).toHaveProperty("stitch");
    expect(summary.categories.skill.tools).toHaveLength(7);
    expect(summary.categories.postman.tools).toHaveLength(3);
    expect(summary.categories.stitch.tools).toHaveLength(3);
  });

  it("each schema has a valid .shape property", () => {
    for (const entry of TOOL_REGISTRY) {
      expect(entry.schema.shape).toBeDefined();
      expect(typeof entry.schema.shape).toBe("object");
    }
  });
});
