/**
 * Cubis Foundry MCP Server – generated route manifest types.
 */

export interface RoutePlatformArtifacts {
  skillDir?: string;
  workflowFile?: string;
  promptFile?: string;
  commandFile?: string;
  agentFile?: string;
  compatibilityAlias?: string;
}

export interface RouteEntry {
  kind: "workflow" | "agent";
  id: string;
  command: string | null;
  displayName: string;
  description: string;
  triggers: string[];
  primaryAgent: string;
  supportingAgents: string[];
  primarySkills: string[];
  supportingSkills: string[];
  artifacts: {
    codex?: RoutePlatformArtifacts;
    copilot?: RoutePlatformArtifacts;
    antigravity?: RoutePlatformArtifacts;
    claude?: RoutePlatformArtifacts;
  };
}

export interface RouteManifest {
  $schema: string;
  generatedAt: string;
  contentHash: string;
  summary: {
    totalRoutes: number;
    workflows: number;
    agents: number;
  };
  routes: RouteEntry[];
}
