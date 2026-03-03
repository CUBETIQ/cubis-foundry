/**
 * Cubis Foundry MCP Server – upstream gateway config resolution.
 */

import { readEffectiveConfig } from "../cbxConfig/index.js";
import type {
  ConfigScope,
  ServiceProfile,
  PostmanConfig,
  StitchConfig,
} from "../cbxConfig/types.js";
import type { UpstreamConfig, UpstreamProvider } from "./types.js";

const STITCH_DEFAULT_MCP_URL = "https://stitch.googleapis.com/mcp";

interface ResolvedGatewayConfig {
  scope: ConfigScope | null;
  configPath: string | null;
  providers: Record<UpstreamProvider, UpstreamConfig>;
}

interface NamedProfile {
  name: string;
  profile: ServiceProfile;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function firstString(...values: Array<unknown>): string | null {
  for (const value of values) {
    if (isNonEmptyString(value)) {
      return value.trim();
    }
  }
  return null;
}

function normalizeProfiles(
  profiles?: ServiceProfile[] | Record<string, ServiceProfile>,
): NamedProfile[] {
  if (!profiles) {
    return [];
  }

  if (Array.isArray(profiles)) {
    return profiles
      .map((profile, index) => ({
        name: firstString(profile.name) ?? `profile_${index + 1}`,
        profile,
      }))
      .filter((entry) => !!entry.profile);
  }

  return Object.entries(profiles).map(([name, profile]) => ({
    name,
    profile,
  }));
}

function selectActiveProfile(
  profiles: NamedProfile[],
  activeProfileName?: string,
): NamedProfile | null {
  if (profiles.length === 0) {
    return null;
  }

  const active = firstString(activeProfileName);
  if (active) {
    const hit = profiles.find((profile) => profile.name === active);
    if (hit) {
      return hit;
    }
  }

  return profiles[0];
}

function buildPostmanConfig(
  postman: PostmanConfig | undefined,
  scope: ConfigScope | null,
  configPath: string | null,
): UpstreamConfig {
  const warnings: string[] = [];
  const profiles = normalizeProfiles(postman?.profiles);
  const active = selectActiveProfile(profiles, postman?.activeProfileName);

  const mcpUrl = firstString(postman?.mcpUrl, active?.profile.mcpUrl, active?.profile.url);
  if (!mcpUrl) {
    warnings.push("Postman MCP URL is not configured (postman.mcpUrl).");
  }

  const authEnvVar = firstString(
    active?.profile.tokenEnvVar,
    active?.profile.apiKeyEnvVar,
    postman?.tokenEnvVar,
    postman?.apiKeyEnvVar,
  );

  const rawApiKeySet = !!firstString(active?.profile.apiKey);
  if (rawApiKeySet) {
    warnings.push("Postman profile apiKey is ignored; configure apiKeyEnvVar/tokenEnvVar alias instead.");
  }

  if (!authEnvVar) {
    warnings.push("Postman auth env var alias is missing (active profile apiKeyEnvVar/tokenEnvVar).");
    return {
      provider: "postman",
      mcpUrl,
      authHeader: null,
      authEnvVar: null,
      scope,
      configPath,
      warnings,
    };
  }

  const token = process.env[authEnvVar];
  if (!isNonEmptyString(token)) {
    warnings.push(`Postman auth env var \"${authEnvVar}\" is not set.`);
    return {
      provider: "postman",
      mcpUrl,
      authHeader: null,
      authEnvVar,
      scope,
      configPath,
      warnings,
    };
  }

  return {
    provider: "postman",
    mcpUrl,
    authHeader: { Authorization: `Bearer ${token}` },
    authEnvVar,
    scope,
    configPath,
    warnings,
  };
}

function buildStitchConfig(
  stitch: StitchConfig | undefined,
  scope: ConfigScope | null,
  configPath: string | null,
): UpstreamConfig {
  const warnings: string[] = [];
  const profiles = normalizeProfiles(stitch?.profiles);
  const active = selectActiveProfile(profiles, stitch?.activeProfileName);

  const mcpUrl =
    firstString(stitch?.mcpUrl, active?.profile.mcpUrl, active?.profile.url) ??
    STITCH_DEFAULT_MCP_URL;

  const authEnvVar = firstString(active?.profile.apiKeyEnvVar, stitch?.apiKeyEnvVar);

  const rawApiKeySet = !!firstString(active?.profile.apiKey);
  if (rawApiKeySet) {
    warnings.push("Stitch profile apiKey is ignored; configure apiKeyEnvVar alias instead.");
  }

  if (!authEnvVar) {
    warnings.push("Stitch auth env var alias is missing (active profile apiKeyEnvVar).");
    return {
      provider: "stitch",
      mcpUrl,
      authHeader: null,
      authEnvVar: null,
      scope,
      configPath,
      warnings,
    };
  }

  const apiKey = process.env[authEnvVar];
  if (!isNonEmptyString(apiKey)) {
    warnings.push(`Stitch auth env var \"${authEnvVar}\" is not set.`);
    return {
      provider: "stitch",
      mcpUrl,
      authHeader: null,
      authEnvVar,
      scope,
      configPath,
      warnings,
    };
  }

  return {
    provider: "stitch",
    mcpUrl,
    authHeader: { "X-Goog-Api-Key": apiKey },
    authEnvVar,
    scope,
    configPath,
    warnings,
  };
}

export function resolveGatewayConfig(
  scope: ConfigScope | "auto" = "auto",
): ResolvedGatewayConfig {
  const effective = readEffectiveConfig(scope);

  if (!effective) {
    const warning =
      "cbx_config.json not found. Configure Postman/Stitch profiles to enable upstream passthrough.";
    return {
      scope: null,
      configPath: null,
      providers: {
        postman: {
          provider: "postman",
          mcpUrl: null,
          authHeader: null,
          authEnvVar: null,
          scope: null,
          configPath: null,
          warnings: [warning],
        },
        stitch: {
          provider: "stitch",
          mcpUrl: STITCH_DEFAULT_MCP_URL,
          authHeader: null,
          authEnvVar: null,
          scope: null,
          configPath: null,
          warnings: [warning],
        },
      },
    };
  }

  return {
    scope: effective.scope,
    configPath: effective.path,
    providers: {
      postman: buildPostmanConfig(effective.config.postman, effective.scope, effective.path),
      stitch: buildStitchConfig(effective.config.stitch, effective.scope, effective.path),
    },
  };
}

export { STITCH_DEFAULT_MCP_URL };
