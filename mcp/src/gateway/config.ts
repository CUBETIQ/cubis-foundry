/**
 * Cubis Foundry MCP Server – upstream gateway config resolution.
 */

import { parseAndroidState, readEffectiveConfig } from "../cbxConfig/index.js";
import type {
  ConfigScope,
  ServiceProfile,
  PostmanConfig,
  StitchConfig,
  PlaywrightConfig,
  AndroidConfig,
} from "../cbxConfig/types.js";
import type { UpstreamConfig, UpstreamProvider } from "./types.js";

const STITCH_DEFAULT_MCP_URL = "https://stitch.googleapis.com/mcp";
const PLAYWRIGHT_DEFAULT_PORT = 8931;

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

  const mcpUrl = firstString(
    postman?.mcpUrl,
    active?.profile.mcpUrl,
    active?.profile.url,
  );
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
    warnings.push(
      "Postman profile apiKey is ignored; configure apiKeyEnvVar/tokenEnvVar alias instead.",
    );
  }

  if (!authEnvVar) {
    warnings.push(
      "Postman auth env var alias is missing (active profile apiKeyEnvVar/tokenEnvVar).",
    );
    return {
      provider: "postman",
      transport: "http",
      mcpUrl,
      authHeader: null,
      authEnvVar: null,
      command: null,
      args: [],
      env: {},
      cwd: null,
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
      transport: "http",
      mcpUrl,
      authHeader: null,
      authEnvVar,
      command: null,
      args: [],
      env: {},
      cwd: null,
      scope,
      configPath,
      warnings,
    };
  }

  return {
    provider: "postman",
    transport: "http",
    mcpUrl,
    authHeader: { Authorization: `Bearer ${token}` },
    authEnvVar,
    command: null,
    args: [],
    env: {},
    cwd: null,
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

  const authEnvVar = firstString(
    active?.profile.apiKeyEnvVar,
    stitch?.apiKeyEnvVar,
  );

  const rawApiKeySet = !!firstString(active?.profile.apiKey);
  if (rawApiKeySet) {
    warnings.push(
      "Stitch profile apiKey is ignored; configure apiKeyEnvVar alias instead.",
    );
  }

  if (!authEnvVar) {
    warnings.push(
      "Stitch auth env var alias is missing (active profile apiKeyEnvVar).",
    );
    return {
      provider: "stitch",
      transport: "http",
      mcpUrl,
      authHeader: null,
      authEnvVar: null,
      command: null,
      args: [],
      env: {},
      cwd: null,
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
      transport: "http",
      mcpUrl,
      authHeader: null,
      authEnvVar,
      command: null,
      args: [],
      env: {},
      cwd: null,
      scope,
      configPath,
      warnings,
    };
  }

  return {
    provider: "stitch",
    transport: "http",
    mcpUrl,
    authHeader: { "X-Goog-Api-Key": apiKey },
    authEnvVar,
    command: null,
    args: [],
    env: {},
    cwd: null,
    scope,
    configPath,
    warnings,
  };
}

function buildPlaywrightConfig(
  playwright: PlaywrightConfig | undefined,
  scope: ConfigScope | null,
  configPath: string | null,
): UpstreamConfig {
  const warnings: string[] = [];
  const portRaw = playwright?.port ?? PLAYWRIGHT_DEFAULT_PORT;
  const envPort = process.env.PLAYWRIGHT_MCP_PORT
    ? Number(process.env.PLAYWRIGHT_MCP_PORT)
    : undefined;
  const effectivePort =
    envPort && Number.isFinite(envPort) && envPort > 0 && envPort < 65536
      ? envPort
      : Number.isFinite(portRaw) && portRaw > 0 && portRaw < 65536
        ? portRaw
        : PLAYWRIGHT_DEFAULT_PORT;
  const mcpUrl =
    firstString(playwright?.mcpUrl) ?? `http://localhost:${effectivePort}/mcp`;

  return {
    provider: "playwright",
    transport: "http",
    mcpUrl,
    authHeader: {},
    authEnvVar: null,
    command: null,
    args: [],
    env: {},
    cwd: null,
    scope,
    configPath,
    warnings,
  };
}

function buildAndroidConfig(
  android: AndroidConfig | boolean | undefined,
  scope: ConfigScope | null,
  configPath: string | null,
): UpstreamConfig {
  const warnings: string[] = [];
  const state = parseAndroidState({ android });
  if (!state.enabled) {
    warnings.push("Android MCP is not enabled in cbx_config.json.");
  }
  return {
    provider: "android",
    transport: "stdio",
    mcpUrl: null,
    authHeader: {},
    authEnvVar: null,
    command: state.command,
    args: state.args,
    env: state.env,
    cwd: state.cwd,
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
          transport: "http",
          mcpUrl: null,
          authHeader: null,
          authEnvVar: null,
          command: null,
          args: [],
          env: {},
          cwd: null,
          scope: null,
          configPath: null,
          warnings: [warning],
        },
        stitch: {
          provider: "stitch",
          transport: "http",
          mcpUrl: STITCH_DEFAULT_MCP_URL,
          authHeader: null,
          authEnvVar: null,
          command: null,
          args: [],
          env: {},
          cwd: null,
          scope: null,
          configPath: null,
          warnings: [warning],
        },
        playwright: buildPlaywrightConfig(undefined, null, null),
        android: buildAndroidConfig(undefined, null, null),
      },
    };
  }

  return {
    scope: effective.scope,
    configPath: effective.path,
    providers: {
      postman: buildPostmanConfig(
        effective.config.postman,
        effective.scope,
        effective.path,
      ),
      stitch: buildStitchConfig(
        effective.config.stitch,
        effective.scope,
        effective.path,
      ),
      playwright: buildPlaywrightConfig(
        effective.config.playwright,
        effective.scope,
        effective.path,
      ),
      android: buildAndroidConfig(
        effective.config.android,
        effective.scope,
        effective.path,
      ),
    },
  };
}

export { STITCH_DEFAULT_MCP_URL };

