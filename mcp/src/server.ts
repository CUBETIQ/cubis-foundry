/**
 * Cubis Foundry MCP Server – server factory.
 *
 * Creates and configures the McpServer instance with built-in tools plus
 * dynamic Postman/Stitch passthrough namespaces.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ServerConfig } from "./config/schema.js";
import type { ConfigScope } from "./cbxConfig/types.js";
import type { VaultManifest } from "./vault/types.js";
import {
  // Skill tools
  skillListCategoriesName,
  skillListCategoriesDescription,
  skillListCategoriesSchema,
  handleSkillListCategories,
  skillBrowseCategoryName,
  skillBrowseCategoryDescription,
  skillBrowseCategorySchema,
  handleSkillBrowseCategory,
  skillSearchName,
  skillSearchDescription,
  skillSearchSchema,
  handleSkillSearch,
  skillGetName,
  skillGetDescription,
  skillGetSchema,
  handleSkillGet,
  skillBudgetReportName,
  skillBudgetReportDescription,
  skillBudgetReportSchema,
  handleSkillBudgetReport,
  // Postman tools
  postmanGetModeName,
  postmanGetModeDescription,
  postmanGetModeSchema,
  handlePostmanGetMode,
  postmanSetModeName,
  postmanSetModeDescription,
  postmanSetModeSchema,
  handlePostmanSetMode,
  postmanGetStatusName,
  postmanGetStatusDescription,
  postmanGetStatusSchema,
  handlePostmanGetStatus,
  // Stitch tools
  stitchGetModeName,
  stitchGetModeDescription,
  stitchGetModeSchema,
  handleStitchGetMode,
  stitchSetProfileName,
  stitchSetProfileDescription,
  stitchSetProfileSchema,
  handleStitchSetProfile,
  stitchGetStatusName,
  stitchGetStatusDescription,
  stitchGetStatusSchema,
  handleStitchGetStatus,
} from "./tools/index.js";
import {
  callUpstreamTool,
  discoverUpstreamCatalogs,
} from "./upstream/passthrough.js";

export interface CreateServerOptions {
  config: ServerConfig;
  manifest: VaultManifest;
  defaultConfigScope?: ConfigScope | "auto";
}

function toolCallErrorResult({
  service,
  namespacedName,
  error,
}: {
  service: "postman" | "stitch";
  namespacedName: string;
  error: unknown;
}) {
  return {
    isError: true as const,
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            service,
            tool: namespacedName,
            error: String(error),
          },
          null,
          2,
        ),
      },
    ],
  };
}

export async function createServer({
  config,
  manifest,
  defaultConfigScope = "auto",
}: CreateServerOptions): McpServer {
  const server = new McpServer({
    name: config.server.name,
    version: config.server.version,
  });

  const maxLen = config.vault.summaryMaxLength;
  const charsPerToken = config.telemetry?.charsPerToken ?? 4;
  const withDefaultScope = (
    args: Record<string, unknown> | undefined,
  ): Record<string, unknown> => {
    const safeArgs = args ?? {};
    return {
      ...safeArgs,
      scope:
        typeof safeArgs.scope === "string" ? safeArgs.scope : defaultConfigScope,
    };
  };

  // ─── Skill vault tools ───────────────────────────────────────

  server.tool(
    skillListCategoriesName,
    skillListCategoriesDescription,
    skillListCategoriesSchema.shape,
    async () => handleSkillListCategories(manifest, charsPerToken),
  );

  server.tool(
    skillBrowseCategoryName,
    skillBrowseCategoryDescription,
    skillBrowseCategorySchema.shape,
    async (args) =>
      handleSkillBrowseCategory(args, manifest, maxLen, charsPerToken),
  );

  server.tool(
    skillSearchName,
    skillSearchDescription,
    skillSearchSchema.shape,
    async (args) => handleSkillSearch(args, manifest, maxLen, charsPerToken),
  );

  server.tool(
    skillGetName,
    skillGetDescription,
    skillGetSchema.shape,
    async (args) => handleSkillGet(args, manifest, charsPerToken),
  );

  server.tool(
    skillBudgetReportName,
    skillBudgetReportDescription,
    skillBudgetReportSchema.shape,
    async (args) => handleSkillBudgetReport(args, manifest, charsPerToken),
  );

  // ─── Postman tools ──────────────────────────────────────────

  server.tool(
    postmanGetModeName,
    postmanGetModeDescription,
    postmanGetModeSchema.shape,
    async (args) =>
      handlePostmanGetMode(
        withDefaultScope(args as Record<string, unknown>) as z.infer<
          typeof postmanGetModeSchema
        >,
      ),
  );

  server.tool(
    postmanSetModeName,
    postmanSetModeDescription,
    postmanSetModeSchema.shape,
    async (args) =>
      handlePostmanSetMode(
        withDefaultScope(args as Record<string, unknown>) as z.infer<
          typeof postmanSetModeSchema
        >,
      ),
  );

  server.tool(
    postmanGetStatusName,
    postmanGetStatusDescription,
    postmanGetStatusSchema.shape,
    async (args) =>
      handlePostmanGetStatus(
        withDefaultScope(args as Record<string, unknown>) as z.infer<
          typeof postmanGetStatusSchema
        >,
      ),
  );

  // ─── Stitch tools ──────────────────────────────────────────

  server.tool(
    stitchGetModeName,
    stitchGetModeDescription,
    stitchGetModeSchema.shape,
    async (args) =>
      handleStitchGetMode(
        withDefaultScope(args as Record<string, unknown>) as z.infer<
          typeof stitchGetModeSchema
        >,
      ),
  );

  server.tool(
    stitchSetProfileName,
    stitchSetProfileDescription,
    stitchSetProfileSchema.shape,
    async (args) =>
      handleStitchSetProfile(
        withDefaultScope(args as Record<string, unknown>) as z.infer<
          typeof stitchSetProfileSchema
        >,
      ),
  );

  server.tool(
    stitchGetStatusName,
    stitchGetStatusDescription,
    stitchGetStatusSchema.shape,
    async (args) =>
      handleStitchGetStatus(
        withDefaultScope(args as Record<string, unknown>) as z.infer<
          typeof stitchGetStatusSchema
        >,
      ),
  );

  // ─── Dynamic upstream passthrough tools ────────────────────
  const upstreamCatalogs = await discoverUpstreamCatalogs();
  const dynamicArgsShape = z.object({}).passthrough().shape;

  for (const catalog of [upstreamCatalogs.postman, upstreamCatalogs.stitch]) {
    for (const tool of catalog.tools) {
      const namespaced = tool.namespacedName;
      server.tool(
        namespaced,
        `[${catalog.service} passthrough] ${tool.description || tool.name}`,
        dynamicArgsShape,
        async (args) => {
          try {
            const result = await callUpstreamTool({
              service: catalog.service,
              name: tool.name,
              argumentsValue:
                args && typeof args === "object" ? args : ({} as Record<string, unknown>),
            });
            return {
              content: result.content ?? [],
              structuredContent: result.structuredContent,
              isError: Boolean(result.isError),
            };
          } catch (error) {
            return toolCallErrorResult({
              service: catalog.service,
              namespacedName: namespaced,
              error,
            });
          }
        },
      );
    }
  }

  return server;
}
