/**
 * Cubis Foundry MCP Server – cbxConfig types.
 */

export type ConfigScope = "global" | "project";

export interface ServiceProfile {
  name?: string;
  mcpUrl?: string;
  url?: string;
  workspaceId?: string | null;
  defaultWorkspaceId?: string | null;
  apiKey?: string;
  apiKeyEnvVar?: string;
  tokenEnvVar?: string;
}

export interface PostmanConfig {
  mcpUrl?: string;
  defaultWorkspaceId?: string | null;
  activeProfileName?: string;
  apiKeyEnvVar?: string;
  tokenEnvVar?: string;
  profiles?: ServiceProfile[] | Record<string, ServiceProfile>;
}

export interface StitchConfig {
  mcpUrl?: string;
  activeProfileName?: string;
  apiKeyEnvVar?: string;
  profiles?: ServiceProfile[] | Record<string, ServiceProfile>;
}

export interface PlaywrightConfig {
  mcpUrl?: string;
  port?: number;
}

export interface AndroidConfig {
  enabled?: boolean;
  server?: string;
  package?: string;
  transport?: "stdio";
  command?: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
}

export interface CbxConfig {
  postman?: PostmanConfig;
  stitch?: StitchConfig;
  playwright?: PlaywrightConfig;
  android?: AndroidConfig | boolean;
  [key: string]: unknown;
}

export interface EffectiveConfig {
  config: CbxConfig;
  scope: ConfigScope;
  path: string;
}
