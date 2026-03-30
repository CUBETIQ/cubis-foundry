/**
 * Cubis Foundry MCP Server – credential service config normalization.
 *
 * Supports both legacy object-map and current profile-array shapes.
 */

import type { CbxConfig } from "./types.js";

export interface CredentialProfileState {
  name: string;
  apiKeyEnvVar: string;
  workspaceId?: string | null;
  url?: string | null;
  hasInlineApiKey: boolean;
}

export interface CredentialServiceState {
  mcpUrl: string | null;
  activeProfileName: string | null;
  activeProfile: CredentialProfileState | null;
  profiles: CredentialProfileState[];
  useSystemGcloud?: boolean;
}

const DEFAULT_POSTMAN_URL = "https://mcp.postman.com/minimal";
const DEFAULT_STITCH_URL = "https://stitch.googleapis.com/mcp";
const DEFAULT_PLAYWRIGHT_PORT = 8931;
const DEFAULT_PLAYWRIGHT_URL = `http://localhost:${DEFAULT_PLAYWRIGHT_PORT}/mcp`;
const DEFAULT_ANDROID_COMMAND = "npx";
const DEFAULT_ANDROID_PACKAGE = "android-mcp-server@1.3.0";
const DEFAULT_MOBILE_COMMAND = "npx";
const DEFAULT_MOBILE_ARGS = ["-y", "@mobilenext/mobile-mcp@latest"];
const DEFAULT_PROFILE_NAME = "default";
const DEFAULT_POSTMAN_ENV_VAR = "POSTMAN_API_KEY";
const DEFAULT_STITCH_ENV_VAR = "STITCH_API_KEY";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function normalizeName(
  value: unknown,
  fallback = DEFAULT_PROFILE_NAME,
): string {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || fallback;
}

function normalizeEnvVar(value: unknown, fallback: string): string {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || fallback;
}

function normalizeOptionalString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => normalizeOptionalString(entry))
    .filter((entry): entry is string => Boolean(entry));
}

function normalizeEnvRecord(value: unknown): Record<string, string> {
  const record = asRecord(value) ?? {};
  return Object.fromEntries(
    Object.entries(record)
      .map(([key, entry]) => [key, normalizeOptionalString(entry)])
      .filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
}

export function parsePostmanState(config: CbxConfig): CredentialServiceState {
  const section = asRecord(config.postman) ?? {};
  const mcpUrl = normalizeOptionalString(section.mcpUrl) ?? DEFAULT_POSTMAN_URL;
  const fallbackEnvVar = normalizeEnvVar(
    section.apiKeyEnvVar,
    DEFAULT_POSTMAN_ENV_VAR,
  );
  const rawProfiles = Array.isArray(section.profiles) ? section.profiles : [];
  const profiles: CredentialProfileState[] = [];

  for (const rawProfile of rawProfiles) {
    const profile = asRecord(rawProfile);
    if (!profile) continue;
    profiles.push({
      name: normalizeName(profile.name, DEFAULT_PROFILE_NAME),
      apiKeyEnvVar: normalizeEnvVar(profile.apiKeyEnvVar, fallbackEnvVar),
      workspaceId: normalizeOptionalString(
        profile.workspaceId ?? profile.defaultWorkspaceId,
      ),
      hasInlineApiKey:
        typeof profile.apiKey === "string" && profile.apiKey.trim().length > 0,
    });
  }

  if (profiles.length === 0) {
    profiles.push({
      name: DEFAULT_PROFILE_NAME,
      apiKeyEnvVar: fallbackEnvVar,
      workspaceId: normalizeOptionalString(section.defaultWorkspaceId),
      hasInlineApiKey:
        typeof section.apiKey === "string" && section.apiKey.trim().length > 0,
    });
  }

  const requestedActive = normalizeOptionalString(section.activeProfileName);
  const activeProfile =
    profiles.find((profile) => profile.name === requestedActive) ?? profiles[0];

  return {
    mcpUrl,
    activeProfileName: activeProfile?.name ?? null,
    activeProfile: activeProfile ?? null,
    profiles,
  };
}

export function parseStitchState(config: CbxConfig): CredentialServiceState {
  const section = asRecord(config.stitch) ?? {};
  const mcpUrl = normalizeOptionalString(section.mcpUrl) ?? DEFAULT_STITCH_URL;
  const fallbackEnvVar = normalizeEnvVar(
    section.apiKeyEnvVar,
    DEFAULT_STITCH_ENV_VAR,
  );
  const rawProfiles = section.profiles;
  const profiles: CredentialProfileState[] = [];

  if (Array.isArray(rawProfiles)) {
    for (const rawProfile of rawProfiles) {
      const profile = asRecord(rawProfile);
      if (!profile) continue;
      profiles.push({
        name: normalizeName(profile.name, DEFAULT_PROFILE_NAME),
        apiKeyEnvVar: normalizeEnvVar(profile.apiKeyEnvVar, fallbackEnvVar),
        url: normalizeOptionalString(profile.url),
        hasInlineApiKey:
          typeof profile.apiKey === "string" &&
          profile.apiKey.trim().length > 0,
      });
    }
  } else if (asRecord(rawProfiles)) {
    for (const [profileName, rawProfile] of Object.entries(
      rawProfiles as Record<string, unknown>,
    )) {
      const profile = asRecord(rawProfile);
      if (!profile) continue;
      profiles.push({
        name: normalizeName(profileName, DEFAULT_PROFILE_NAME),
        apiKeyEnvVar: normalizeEnvVar(profile.apiKeyEnvVar, fallbackEnvVar),
        url: normalizeOptionalString(profile.url),
        hasInlineApiKey:
          typeof profile.apiKey === "string" &&
          profile.apiKey.trim().length > 0,
      });
    }
  }

  if (profiles.length === 0) {
    profiles.push({
      name: DEFAULT_PROFILE_NAME,
      apiKeyEnvVar: fallbackEnvVar,
      url: normalizeOptionalString(section.url) ?? mcpUrl,
      hasInlineApiKey:
        typeof section.apiKey === "string" && section.apiKey.trim().length > 0,
    });
  }

  const requestedActive = normalizeOptionalString(section.activeProfileName);
  const activeProfile =
    profiles.find((profile) => profile.name === requestedActive) ?? profiles[0];

  return {
    mcpUrl,
    activeProfileName: activeProfile?.name ?? null,
    activeProfile: activeProfile ?? null,
    profiles,
    useSystemGcloud: Boolean(section.useSystemGcloud),
  };
}

export interface PlaywrightServiceState {
  mcpUrl: string;
  port: number;
}

export function parsePlaywrightState(
  config: CbxConfig,
): PlaywrightServiceState {
  const section = asRecord(config.playwright) ?? {};
  const portRaw =
    typeof section.port === "number" ? section.port : DEFAULT_PLAYWRIGHT_PORT;
  const port =
    Number.isFinite(portRaw) && portRaw > 0 && portRaw < 65536
      ? portRaw
      : DEFAULT_PLAYWRIGHT_PORT;
  const envPort = process.env.PLAYWRIGHT_MCP_PORT
    ? Number(process.env.PLAYWRIGHT_MCP_PORT)
    : undefined;
  const effectivePort =
    envPort && Number.isFinite(envPort) && envPort > 0 && envPort < 65536
      ? envPort
      : port;
  const mcpUrl =
    normalizeOptionalString(section.mcpUrl) ??
    `http://localhost:${effectivePort}/mcp`;
  return { mcpUrl, port: effectivePort };
}

export interface AndroidServiceState {
  enabled: boolean;
  command: string;
  args: string[];
  cwd: string | null;
  env: Record<string, string>;
}

export function parseAndroidState(config: CbxConfig): AndroidServiceState {
  const section = asRecord(config.android) ?? {};
  const enabled = Boolean(section.enabled ?? config.android);
  const command =
    normalizeOptionalString(section.command) ?? DEFAULT_ANDROID_COMMAND;
  const packageSpec =
    normalizeOptionalString(section.package) ?? DEFAULT_ANDROID_PACKAGE;
  const args = Array.isArray(section.args)
    ? section.args
        .map((value) => normalizeOptionalString(value))
        .filter((value): value is string => Boolean(value))
    : ["-y", packageSpec];
  const cwd = normalizeOptionalString(section.cwd);
  const envRecord = asRecord(section.env) ?? {};
  const env = Object.fromEntries(
    Object.entries(envRecord)
      .map(([key, value]) => [key, normalizeOptionalString(value)])
      .filter((entry): entry is [string, string] => Boolean(entry[1])),
  );

  return {
    enabled,
    command,
    args: args.length > 0 ? args : ["-y", packageSpec],
    cwd,
    env,
  };
}

export interface MobileProfileState {
  name: string;
  url: string | null;
  command: string;
  args: string[];
  cwd: string | null;
  env: Record<string, string>;
  hasEnv: boolean;
}

export interface MobileServiceState {
  enabled: boolean;
  mcpUrl: string | null;
  activeProfileName: string | null;
  activeProfile: MobileProfileState | null;
  profiles: MobileProfileState[];
}

function buildMobileProfile(
  rawProfile: Record<string, unknown>,
  fallbackName: string,
): MobileProfileState {
  const command =
    normalizeOptionalString(rawProfile.command) ?? DEFAULT_MOBILE_COMMAND;
  const args = normalizeStringArray(rawProfile.args);
  const env = normalizeEnvRecord(rawProfile.env);

  return {
    name: normalizeName(rawProfile.name, fallbackName),
    url: normalizeOptionalString(rawProfile.url ?? rawProfile.mcpUrl),
    command,
    args: args.length > 0 ? args : [...DEFAULT_MOBILE_ARGS],
    cwd: normalizeOptionalString(rawProfile.cwd),
    env,
    hasEnv: Object.keys(env).length > 0,
  };
}

export function parseMobileState(config: CbxConfig): MobileServiceState {
  const section = asRecord(config.mobile) ?? {};
  const rawProfiles = section.profiles;
  const hasProfiles = Array.isArray(rawProfiles)
    ? rawProfiles.length > 0
    : Boolean(asRecord(rawProfiles) && Object.keys(rawProfiles as Record<string, unknown>).length > 0);
  const hasTopLevelConfig = Boolean(
    normalizeOptionalString(section.mcpUrl ?? section.url) ??
      normalizeOptionalString(section.command) ??
      normalizeOptionalString(section.cwd),
  );
  const hasTopLevelArgs = normalizeStringArray(section.args).length > 0;
  const hasTopLevelEnv = Object.keys(normalizeEnvRecord(section.env)).length > 0;
  const enabled =
    typeof section.enabled === "boolean"
      ? section.enabled
      : hasProfiles || hasTopLevelConfig || hasTopLevelArgs || hasTopLevelEnv;
  const profiles: MobileProfileState[] = [];

  if (!enabled) {
    return {
      enabled: false,
      mcpUrl: null,
      activeProfileName: null,
      activeProfile: null,
      profiles: [],
    };
  }

  if (Array.isArray(rawProfiles)) {
    for (const rawProfile of rawProfiles) {
      const profile = asRecord(rawProfile);
      if (!profile) continue;
      profiles.push(buildMobileProfile(profile, DEFAULT_PROFILE_NAME));
    }
  } else if (asRecord(rawProfiles)) {
    for (const [profileName, rawProfile] of Object.entries(
      rawProfiles as Record<string, unknown>,
    )) {
      const profile = asRecord(rawProfile);
      if (!profile) continue;
      profiles.push(buildMobileProfile({ ...profile, name: profileName }, profileName));
    }
  }

  if (profiles.length === 0) {
    profiles.push(
      buildMobileProfile(
        {
          ...section,
          url: section.url ?? section.mcpUrl,
        },
        DEFAULT_PROFILE_NAME,
      ),
    );
  }

  const requestedActive = normalizeOptionalString(section.activeProfileName);
  const activeProfile =
    profiles.find((profile) => profile.name === requestedActive) ?? profiles[0];

  return {
    enabled: true,
    mcpUrl:
      normalizeOptionalString(section.mcpUrl ?? section.url) ??
      activeProfile?.url ??
      null,
    activeProfileName: activeProfile?.name ?? null,
    activeProfile: activeProfile ?? null,
    profiles,
  };
}
