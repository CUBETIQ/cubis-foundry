/**
 * Cubis Foundry MCP Server – declarative tool registry.
 *
 * Defines all built-in tools in a single registry array.
 * Server.ts reads from this registry to auto-register tools,
 * eliminating per-tool import boilerplate.
 *
 * When adding a new tool:
 *   1. Create toolName.ts with name/description/schema/handler exports
 *   2. Add a ToolRegistryEntry here
 *   3. Done — server.ts picks it up automatically.
 */

import { z } from "zod";
import type { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { VaultManifest } from "../vault/types.js";
import type { RouteManifest } from "../routes/types.js";
import type { ConfigScope } from "../cbxConfig/types.js";

// ─── Core types ─────────────────────────────────────────────

export type ToolCategory =
  | "skill"
  | "route"
  | "postman"
  | "stitch"
  | "playwright";

export interface ToolRegistryEntry {
  /** Tool name exposed to MCP clients. */
  name: string;
  /** One-line description for MCP discovery. */
  description: string;
  /** Zod schema (the `.shape` is extracted at registration time). */
  schema: z.ZodObject<z.ZodRawShape>;
  /** Tool category for grouping and documentation. */
  category: ToolCategory;
  /**
   * Handler factory.  Receives shared runtime context and returns the
   * concrete async handler that server.tool() expects.
   */
  createHandler: (
    ctx: ToolRuntimeContext,
  ) => ToolCallback<z.ZodObject<z.ZodRawShape>>;
}

export interface ToolRuntimeContext {
  manifest: VaultManifest;
  routeManifest: RouteManifest;
  charsPerToken: number;
  summaryMaxLength: number;
  defaultConfigScope: ConfigScope | "auto";
}

// ─── Tool imports ───────────────────────────────────────────

import {
  routeResolveName,
  routeResolveDescription,
  routeResolveSchema,
  handleRouteResolve,
} from "./routeResolve.js";

import {
  skillListCategoriesName,
  skillListCategoriesDescription,
  skillListCategoriesSchema,
  handleSkillListCategories,
} from "./skillListCategories.js";

import {
  skillBrowseCategoryName,
  skillBrowseCategoryDescription,
  skillBrowseCategorySchema,
  handleSkillBrowseCategory,
} from "./skillBrowseCategory.js";

import {
  skillSearchName,
  skillSearchDescription,
  skillSearchSchema,
  handleSkillSearch,
} from "./skillSearch.js";

import {
  skillValidateName,
  skillValidateDescription,
  skillValidateSchema,
  handleSkillValidate,
} from "./skillValidate.js";

import {
  skillGetName,
  skillGetDescription,
  skillGetSchema,
  handleSkillGet,
} from "./skillGet.js";

import {
  skillGetReferenceName,
  skillGetReferenceDescription,
  skillGetReferenceSchema,
  handleSkillGetReference,
} from "./skillGetReference.js";

import {
  skillBudgetReportName,
  skillBudgetReportDescription,
  skillBudgetReportSchema,
  handleSkillBudgetReport,
} from "./skillBudgetReport.js";

import {
  postmanGetModeName,
  postmanGetModeDescription,
  postmanGetModeSchema,
  handlePostmanGetMode,
} from "./postmanGetMode.js";

import {
  postmanSetModeName,
  postmanSetModeDescription,
  postmanSetModeSchema,
  handlePostmanSetMode,
} from "./postmanSetMode.js";

import {
  postmanGetStatusName,
  postmanGetStatusDescription,
  postmanGetStatusSchema,
  handlePostmanGetStatus,
} from "./postmanGetStatus.js";

import {
  stitchGetModeName,
  stitchGetModeDescription,
  stitchGetModeSchema,
  handleStitchGetMode,
} from "./stitchGetMode.js";

import {
  stitchSetProfileName,
  stitchSetProfileDescription,
  stitchSetProfileSchema,
  handleStitchSetProfile,
} from "./stitchSetProfile.js";

import {
  stitchGetStatusName,
  stitchGetStatusDescription,
  stitchGetStatusSchema,
  handleStitchGetStatus,
} from "./stitchGetStatus.js";

import {
  playwrightGetStatusName,
  playwrightGetStatusDescription,
  playwrightGetStatusSchema,
  handlePlaywrightGetStatus,
} from "./playwrightGetStatus.js";

// ─── Scope helper ───────────────────────────────────────────

function withDefaultScope(
  args: unknown,
  defaultScope: ConfigScope | "auto",
): Record<string, unknown> {
  const safeArgs =
    args && typeof args === "object" ? (args as Record<string, unknown>) : {};
  return {
    ...safeArgs,
    scope: typeof safeArgs.scope === "string" ? safeArgs.scope : defaultScope,
  };
}

// ─── Registry ───────────────────────────────────────────────

export const TOOL_REGISTRY: readonly ToolRegistryEntry[] = [
  // ── Route tools ───────────────────────────────────────────
  {
    name: routeResolveName,
    description: routeResolveDescription,
    schema: routeResolveSchema,
    category: "route",
    createHandler: (ctx) => async (args) =>
      handleRouteResolve(
        args as z.infer<typeof routeResolveSchema>,
        ctx.routeManifest,
      ),
  },

  // ── Skill vault tools ─────────────────────────────────────
  {
    name: skillListCategoriesName,
    description: skillListCategoriesDescription,
    schema: skillListCategoriesSchema,
    category: "skill",
    createHandler: (ctx) => async () =>
      handleSkillListCategories(ctx.manifest, ctx.charsPerToken),
  },
  {
    name: skillBrowseCategoryName,
    description: skillBrowseCategoryDescription,
    schema: skillBrowseCategorySchema,
    category: "skill",
    createHandler: (ctx) => async (args) =>
      handleSkillBrowseCategory(
        args as z.infer<typeof skillBrowseCategorySchema>,
        ctx.manifest,
        ctx.summaryMaxLength,
        ctx.charsPerToken,
      ),
  },
  {
    name: skillSearchName,
    description: skillSearchDescription,
    schema: skillSearchSchema,
    category: "skill",
    createHandler: (ctx) => async (args) =>
      handleSkillSearch(
        args as z.infer<typeof skillSearchSchema>,
        ctx.manifest,
        ctx.summaryMaxLength,
        ctx.charsPerToken,
      ),
  },
  {
    name: skillValidateName,
    description: skillValidateDescription,
    schema: skillValidateSchema,
    category: "skill",
    createHandler: (ctx) => async (args) =>
      handleSkillValidate(
        args as z.infer<typeof skillValidateSchema>,
        ctx.manifest,
        ctx.charsPerToken,
      ),
  },
  {
    name: skillGetName,
    description: skillGetDescription,
    schema: skillGetSchema,
    category: "skill",
    createHandler: (ctx) => async (args) =>
      handleSkillGet(
        args as z.infer<typeof skillGetSchema>,
        ctx.manifest,
        ctx.charsPerToken,
      ),
  },
  {
    name: skillGetReferenceName,
    description: skillGetReferenceDescription,
    schema: skillGetReferenceSchema,
    category: "skill",
    createHandler: (ctx) => async (args) =>
      handleSkillGetReference(
        args as z.infer<typeof skillGetReferenceSchema>,
        ctx.manifest,
        ctx.charsPerToken,
      ),
  },
  {
    name: skillBudgetReportName,
    description: skillBudgetReportDescription,
    schema: skillBudgetReportSchema,
    category: "skill",
    createHandler: (ctx) => async (args) =>
      handleSkillBudgetReport(
        args as z.infer<typeof skillBudgetReportSchema>,
        ctx.manifest,
        ctx.charsPerToken,
      ),
  },

  // ── Postman tools ─────────────────────────────────────────
  {
    name: postmanGetModeName,
    description: postmanGetModeDescription,
    schema: postmanGetModeSchema,
    category: "postman",
    createHandler: (ctx) => async (args) =>
      handlePostmanGetMode(
        withDefaultScope(args, ctx.defaultConfigScope) as z.infer<
          typeof postmanGetModeSchema
        >,
      ),
  },
  {
    name: postmanSetModeName,
    description: postmanSetModeDescription,
    schema: postmanSetModeSchema,
    category: "postman",
    createHandler: (ctx) => async (args) =>
      handlePostmanSetMode(
        withDefaultScope(args, ctx.defaultConfigScope) as z.infer<
          typeof postmanSetModeSchema
        >,
      ),
  },
  {
    name: postmanGetStatusName,
    description: postmanGetStatusDescription,
    schema: postmanGetStatusSchema,
    category: "postman",
    createHandler: (ctx) => async (args) =>
      handlePostmanGetStatus(
        withDefaultScope(args, ctx.defaultConfigScope) as z.infer<
          typeof postmanGetStatusSchema
        >,
      ),
  },

  // ── Stitch tools ──────────────────────────────────────────
  {
    name: stitchGetModeName,
    description: stitchGetModeDescription,
    schema: stitchGetModeSchema,
    category: "stitch",
    createHandler: (ctx) => async (args) =>
      handleStitchGetMode(
        withDefaultScope(args, ctx.defaultConfigScope) as z.infer<
          typeof stitchGetModeSchema
        >,
      ),
  },
  {
    name: stitchSetProfileName,
    description: stitchSetProfileDescription,
    schema: stitchSetProfileSchema,
    category: "stitch",
    createHandler: (ctx) => async (args) =>
      handleStitchSetProfile(
        withDefaultScope(args, ctx.defaultConfigScope) as z.infer<
          typeof stitchSetProfileSchema
        >,
      ),
  },
  {
    name: stitchGetStatusName,
    description: stitchGetStatusDescription,
    schema: stitchGetStatusSchema,
    category: "stitch",
    createHandler: (ctx) => async (args) =>
      handleStitchGetStatus(
        withDefaultScope(args, ctx.defaultConfigScope) as z.infer<
          typeof stitchGetStatusSchema
        >,
      ),
  },

  // ── Playwright tools ──────────────────────────────────────
  {
    name: playwrightGetStatusName,
    description: playwrightGetStatusDescription,
    schema: playwrightGetStatusSchema,
    category: "playwright",
    createHandler: (ctx) => async (args) =>
      handlePlaywrightGetStatus(
        withDefaultScope(args, ctx.defaultConfigScope) as z.infer<
          typeof playwrightGetStatusSchema
        >,
      ),
  },
];

// ─── Helpers ────────────────────────────────────────────────

/** Get tools filtered by category. */
export function getToolsByCategory(
  category: ToolCategory,
): ToolRegistryEntry[] {
  return TOOL_REGISTRY.filter((t) => t.category === category);
}

/** Get all registered tool names. */
export function getRegisteredToolNames(): string[] {
  return TOOL_REGISTRY.map((t) => t.name);
}

/** Build a summary of the registry for documentation/rule-file generation. */
export function buildRegistrySummary(): {
  categories: Record<
    string,
    { tools: Array<{ name: string; description: string }> }
  >;
  totalTools: number;
} {
  const categories: Record<
    string,
    { tools: Array<{ name: string; description: string }> }
  > = {};

  for (const tool of TOOL_REGISTRY) {
    if (!categories[tool.category]) {
      categories[tool.category] = { tools: [] };
    }
    categories[tool.category].tools.push({
      name: tool.name,
      description: tool.description,
    });
  }

  return { categories, totalTools: TOOL_REGISTRY.length };
}
