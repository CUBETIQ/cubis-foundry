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
const DEFAULT_PROFILE_NAME = "default";
const DEFAULT_POSTMAN_ENV_VAR = "POSTMAN_API_KEY";
const DEFAULT_STITCH_ENV_VAR = "STITCH_API_KEY";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function normalizeName(value: unknown, fallback = DEFAULT_PROFILE_NAME): string {
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
          typeof profile.apiKey === "string" && profile.apiKey.trim().length > 0,
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
          typeof profile.apiKey === "string" && profile.apiKey.trim().length > 0,
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
