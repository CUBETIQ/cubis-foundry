/**
 * Cubis Foundry MCP Server – tool registry.
 *
 * Central registry exporting all tool metadata and handlers.
 * Used by server.ts to register tools with McpServer.
 *
 * The declarative registry (registry.ts) is the preferred way to register
 * new tools. Individual tool exports are kept for backward compatibility
 * and direct unit testing.
 */

export {
  TOOL_REGISTRY,
  getToolsByCategory,
  getRegisteredToolNames,
  buildRegistrySummary,
  type ToolCategory,
  type ToolRegistryEntry,
  type ToolRuntimeContext,
} from "./registry.js";

export {
  mcpGatewayStatusName,
  mcpGatewayStatusDescription,
  mcpGatewayStatusSchema,
  handleMcpGatewayStatus,
  postmanListEnabledToolsName,
  postmanListEnabledToolsDescription,
  postmanListEnabledToolsSchema,
  handlePostmanListEnabledTools,
  stitchListEnabledToolsName,
  stitchListEnabledToolsDescription,
  stitchListEnabledToolsSchema,
  handleStitchListEnabledTools,
} from "./mcpGateway.js";

export {
  routeResolveName,
  routeResolveDescription,
  routeResolveSchema,
  handleRouteResolve,
} from "./routeResolve.js";

export {
  skillListCategoriesName,
  skillListCategoriesDescription,
  skillListCategoriesSchema,
  handleSkillListCategories,
} from "./skillListCategories.js";

export {
  skillBrowseCategoryName,
  skillBrowseCategoryDescription,
  skillBrowseCategorySchema,
  handleSkillBrowseCategory,
} from "./skillBrowseCategory.js";

export {
  skillSearchName,
  skillSearchDescription,
  skillSearchSchema,
  handleSkillSearch,
} from "./skillSearch.js";

export {
  skillValidateName,
  skillValidateDescription,
  skillValidateSchema,
  handleSkillValidate,
} from "./skillValidate.js";

export {
  skillGetName,
  skillGetDescription,
  skillGetSchema,
  handleSkillGet,
} from "./skillGet.js";

export {
  skillGetReferenceName,
  skillGetReferenceDescription,
  skillGetReferenceSchema,
  handleSkillGetReference,
} from "./skillGetReference.js";

export {
  skillBudgetReportName,
  skillBudgetReportDescription,
  skillBudgetReportSchema,
  handleSkillBudgetReport,
} from "./skillBudgetReport.js";

export {
  postmanGetModeName,
  postmanGetModeDescription,
  postmanGetModeSchema,
  handlePostmanGetMode,
} from "./postmanGetMode.js";

export {
  postmanSetModeName,
  postmanSetModeDescription,
  postmanSetModeSchema,
  handlePostmanSetMode,
} from "./postmanSetMode.js";

export {
  postmanGetStatusName,
  postmanGetStatusDescription,
  postmanGetStatusSchema,
  handlePostmanGetStatus,
} from "./postmanGetStatus.js";

export {
  stitchGetModeName,
  stitchGetModeDescription,
  stitchGetModeSchema,
  handleStitchGetMode,
} from "./stitchGetMode.js";

export {
  stitchSetProfileName,
  stitchSetProfileDescription,
  stitchSetProfileSchema,
  handleStitchSetProfile,
} from "./stitchSetProfile.js";

export {
  stitchGetStatusName,
  stitchGetStatusDescription,
  stitchGetStatusSchema,
  handleStitchGetStatus,
} from "./stitchGetStatus.js";
