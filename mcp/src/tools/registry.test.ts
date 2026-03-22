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
import type { RouteManifest } from "../routes/types.js";
import type { GatewayManager } from "../gateway/manager.js";

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
  const routeManifest: RouteManifest = {
    $schema: "cubis-foundry-route-manifest-v1",
    generatedAt: new Date(0).toISOString(),
    contentHash: "test",
    summary: { totalRoutes: 1, workflows: 1, agents: 0 },
    routes: [
      {
        kind: "workflow",
        id: "mobile",
        command: "/mobile",
        displayName: "mobile",
        description: "Mobile workflow",
        triggers: ["mobile", "flutter"],
        primaryAgent: "mobile-developer",
        supportingAgents: [],
        primarySkills: ["flutter-expert"],
        supportingSkills: [],
        artifacts: {
          codex: {
            workflowFile: "mobile.md",
            compatibilityAlias: "$workflow-mobile",
          },
          copilot: {
            workflowFile: "mobile.md",
            promptFile: "workflow-mobile.prompt.md",
          },
          antigravity: {
            workflowFile: "mobile.md",
            commandFile: "mobile.toml",
          },
          claude: { workflowFile: "mobile.md" },
        },
      },
    ],
  };

  return {
    manifest,
    routeManifest,
    gatewayManager: {
      getStatus: () => ({
        scope: "auto",
        configPath: null,
        catalogDir: "/tmp/catalog",
        generatedAt: new Date(0).toISOString(),
        providers: {
          postman: {
            provider: "postman",
            transport: "http",
            mcpUrl: null,
            authEnvVar: null,
            authConfigured: false,
            available: false,
            warnings: [],
            lastError: null,
            syncedAt: null,
            tools: [],
          },
          stitch: {
            provider: "stitch",
            transport: "http",
            mcpUrl: null,
            authEnvVar: null,
            authConfigured: false,
            available: false,
            warnings: [],
            lastError: null,
            syncedAt: null,
            tools: [],
          },
          playwright: {
            provider: "playwright",
            transport: "http",
            mcpUrl: null,
            authEnvVar: null,
            authConfigured: false,
            available: false,
            warnings: [],
            lastError: null,
            syncedAt: null,
            tools: [],
          },
          android: {
            provider: "android",
            transport: "stdio",
            mcpUrl: null,
            authEnvVar: null,
            authConfigured: false,
            command: null,
            available: false,
            warnings: [],
            lastError: null,
            syncedAt: null,
            tools: [],
          },
        },
      }),
      listEnabledTools: (provider) => ({
        provider,
        transport: provider === "android" ? "stdio" : "http",
        available: false,
        enabledCount: 0,
        enabledTools: [],
        upstreamTools: [],
        warnings: [],
        lastError: null,
        syncedAt: null,
        mcpUrl: null,
        command: null,
        authEnvVar: null,
        authConfigured: false,
        catalogDir: "/tmp/catalog",
      }),
    } as unknown as GatewayManager,
    charsPerToken: 4,
    summaryMaxLength: 200,
    defaultConfigScope: "auto",
  };
}

describe("tool registry", () => {
  it("contains all expected built-in tools", () => {
    const names = getRegisteredToolNames();
    expect(names).toContain("route_resolve");
    expect(names).toContain("mcp_gateway_status");
    expect(names).toContain("postman_list_enabled_tools");
    expect(names).toContain("stitch_list_enabled_tools");
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
    expect(names).toContain("stitch_execute");
    expect(names).toContain("playwright_get_status");
    expect(names).toContain("mobile_qa_run");
    expect(names).toContain("web_qa_run");
  });

  it("has exactly 21 built-in tools", () => {
    expect(TOOL_REGISTRY).toHaveLength(21);
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
      expect(entry.category).toMatch(
        /^(skill|route|postman|stitch|playwright|gateway|mobile)$/,
      );
      expect(typeof entry.createHandler).toBe("function");
    }
  });

  it("filters by category", () => {
    const routeTools = getToolsByCategory("route");
    expect(routeTools).toHaveLength(1);

    const gatewayTools = getToolsByCategory("gateway");
    expect(gatewayTools).toHaveLength(3);

    const skillTools = getToolsByCategory("skill");
    expect(skillTools).toHaveLength(7);
    expect(skillTools.every((t) => t.category === "skill")).toBe(true);

    const postmanTools = getToolsByCategory("postman");
    expect(postmanTools).toHaveLength(3);

    const stitchTools = getToolsByCategory("stitch");
    expect(stitchTools).toHaveLength(4);

    const mobileTools = getToolsByCategory("mobile");
    expect(mobileTools).toHaveLength(1);

    const playwrightTools = getToolsByCategory("playwright");
    expect(playwrightTools).toHaveLength(2);
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
    const result = (await (
      handler as unknown as (
        args: Record<string, never>,
      ) => Promise<{ content: Array<{ text: string }> }>
    )({})) as {
      content: Array<{ text: string }>;
    };
    const data = JSON.parse(result.content[0].text);
    expect(data.totalSkills).toBe(1);
  });

  it("buildRegistrySummary produces correct structure", () => {
    const summary = buildRegistrySummary();
    expect(summary.totalTools).toBe(21);
    expect(summary.categories).toHaveProperty("route");
    expect(summary.categories).toHaveProperty("gateway");
    expect(summary.categories).toHaveProperty("skill");
    expect(summary.categories).toHaveProperty("postman");
    expect(summary.categories).toHaveProperty("stitch");
    expect(summary.categories).toHaveProperty("playwright");
    expect(summary.categories).toHaveProperty("mobile");
    expect(summary.categories.route.tools).toHaveLength(1);
    expect(summary.categories.gateway.tools).toHaveLength(3);
    expect(summary.categories.skill.tools).toHaveLength(7);
    expect(summary.categories.postman.tools).toHaveLength(3);
    expect(summary.categories.stitch.tools).toHaveLength(4);
    expect(summary.categories.playwright.tools).toHaveLength(2);
    expect(summary.categories.mobile.tools).toHaveLength(1);
  });

  it("each schema has a valid .shape property", () => {
    for (const entry of TOOL_REGISTRY) {
      expect(entry.schema.shape).toBeDefined();
      expect(typeof entry.schema.shape).toBe("object");
    }
  });
});






