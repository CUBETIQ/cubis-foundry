/**
 * Cubis Foundry MCP Server – cbxConfig types.
 */

export type ConfigScope = "global" | "project";

export interface PostmanConfig {
  mcpUrl?: string;
  defaultWorkspaceId?: string | null;
}

export interface StitchProfile {
  url?: string;
  apiKey?: string;
}

export interface StitchConfig {
  activeProfileName?: string;
  profiles?: Record<string, StitchProfile>;
}

export interface CbxConfig {
  postman?: PostmanConfig;
  stitch?: StitchConfig;
  [key: string]: unknown;
}

export interface EffectiveConfig {
  config: CbxConfig;
  scope: ConfigScope;
  path: string;
}
