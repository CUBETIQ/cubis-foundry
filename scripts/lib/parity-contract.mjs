import { PATTERN_REGISTRY } from "./platform-parity.mjs";

export const PATTERN_REGISTRY_FILE = "pattern-registry.json";
export const PLATFORM_CAPABILITIES_FILE = "platform-capabilities.json";
export const UPSTREAM_CAPABILITY_AUDIT_FILE = "upstream-capability-audit.json";

export const MANAGED_PARITY_DOC_FILES = Object.freeze([
  "platform-support-matrix.md",
  "cross-platform-pattern-catalog.md",
  "platform-capability-details.md",
]);

export const EXPECTED_PARITY_PLATFORM_IDS = Object.freeze([
  "codex",
  "antigravity",
  "copilot",
  "claude",
  "gemini",
]);

export const EXPECTED_PARITY_PATTERN_IDS = Object.freeze(
  PATTERN_REGISTRY.map((item) => item.pattern_id),
);

export function buildBlockingSummary(platformCapabilityContracts) {
  return Object.fromEntries(
    Object.entries(platformCapabilityContracts).map(([platformId, contract]) => [
      platformId,
      {
        native: contract.pattern_support.filter(
          (item) => item.support_level === "native",
        ).length,
        degraded: contract.pattern_support.filter(
          (item) => item.support_level === "degraded",
        ).length,
        blocked: contract.pattern_support.filter(
          (item) => item.support_level === "blocked",
        ).length,
      },
    ]),
  );
}

export function buildParityArtifactPointers() {
  return {
    patternRegistry: `generated/${PATTERN_REGISTRY_FILE}`,
    platformCapabilities: `generated/${PLATFORM_CAPABILITIES_FILE}`,
    upstreamCapabilityAudit: `generated/${UPSTREAM_CAPABILITY_AUDIT_FILE}`,
    docs: MANAGED_PARITY_DOC_FILES.map((file) => `docs/${file}`),
  };
}
