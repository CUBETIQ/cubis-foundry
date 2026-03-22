#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { promises as fs } from "node:fs";
import { checkPlatformAssets } from "./generate-platform-assets.mjs";
import { normalizeSkillId } from "./lib/legacy-skill-map.mjs";
import {
  AUDITED_REFERENCES,
  ORCHESTRATION_SUBTYPES,
  PATTERN_REGISTRY,
  buildPlatformCapabilityContracts,
  buildPlatformSurfaceSpec,
} from "./lib/platform-parity.mjs";
import {
  EXPECTED_PARITY_PLATFORM_IDS,
  EXPECTED_PARITY_PATTERN_IDS,
  MANAGED_PARITY_DOC_FILES,
  PATTERN_REGISTRY_FILE,
  PLATFORM_CAPABILITIES_FILE,
  PLATFORM_SURFACE_SPEC_FILE,
  UPSTREAM_CAPABILITY_AUDIT_FILE,
  buildBlockingSummary,
  buildParityArtifactPointers,
} from "./lib/parity-contract.mjs";

const ROOT = process.cwd();
const ASSETS_ROOT = path.join(ROOT, "workflows");
const BUNDLE_ROOT = path.join(
  ASSETS_ROOT,
  "workflows",
  "agent-environment-setup",
);
const SHARED_ROOT = path.join(BUNDLE_ROOT, "shared");
const SHARED_AGENTS_DIR = path.join(SHARED_ROOT, "agents");
const SHARED_WORKFLOWS_DIR = path.join(SHARED_ROOT, "workflows");
const MANIFEST_PATH = path.join(BUNDLE_ROOT, "manifest.json");
const GENERATED_PATTERN_REGISTRY_PATH = path.join(
  BUNDLE_ROOT,
  "generated",
  PATTERN_REGISTRY_FILE,
);
const GENERATED_PLATFORM_CAPABILITIES_PATH = path.join(
  BUNDLE_ROOT,
  "generated",
  PLATFORM_CAPABILITIES_FILE,
);
const GENERATED_PLATFORM_SURFACE_SPEC_PATH = path.join(
  BUNDLE_ROOT,
  "generated",
  PLATFORM_SURFACE_SPEC_FILE,
);
const GENERATED_UPSTREAM_AUDIT_PATH = path.join(
  BUNDLE_ROOT,
  "generated",
  UPSTREAM_CAPABILITY_AUDIT_FILE,
);
const GENERATE_PLATFORM_ASSETS_SCRIPT = path.join(
  ROOT,
  "scripts",
  "generate-platform-assets.mjs",
);
const SKILLS_INDEX_PATH = path.join(ASSETS_ROOT, "skills", "skills_index.json");
const CANONICAL_SKILLS_ROOT = path.join(ASSETS_ROOT, "skills");
const MIRROR_SKILL_ROOTS = {
  antigravity: path.join(BUNDLE_ROOT, "platforms", "antigravity", "skills"),
  codex: path.join(BUNDLE_ROOT, "platforms", "codex", "skills"),
  copilot: path.join(BUNDLE_ROOT, "platforms", "copilot", "skills"),
  claude: path.join(BUNDLE_ROOT, "platforms", "claude", "skills"),
  gemini: path.join(BUNDLE_ROOT, "platforms", "gemini", "skills"),
};

const CLI_ARGS = new Set(process.argv.slice(2));
const STRICT_MODE = CLI_ARGS.has("--strict");

const COPILOT_ALLOWED_SKILL_KEYS = new Set([
  "argument-hint",
  "compatibility",
  "description",
  "disable-model-invocation",
  "license",
  "metadata",
  "name",
  "user-invocable",
]);

const CLAUDE_ALLOWED_SKILL_KEYS = new Set([
  "name",
  "description",
  "keywords",
  "displayName",
  "triggers",
  "compatibility",
  "license",
  "metadata",
  "allowed-tools",
  "author",
  "version",
  "priority",
  "context",
  "agent",
  "user-invocable",
  "argument-hint",
]);

const COPILOT_ALLOWED_AGENT_KEYS = new Set([
  "agents",
  "name",
  "description",
  "tools",
  "target",
  "infer",
  "mcp-servers",
  "metadata",
  "model",
  "handoffs",
  "argument-hint",
]);

const WORKFLOW_REQUIRED_SECTIONS = [
  "When to use",
  "Workflow steps",
  "Context notes",
  "Verification",
];

const platforms = {
  antigravity: {
    workflowDir: null,
    agentDir: null,
    generatedSkillsDir: null,
    commandsDir: "commands",
    rulesFile: "rules/GEMINI.md",
    expectsGeneratedAgents: false,
  },
  codex: {
    workflowDir: null,
    agentDir: "agents",
    agentFormat: "toml",
    generatedSkillsDir: "generated-skills",
    rulesFile: "rules/AGENTS.md",
  },
  copilot: {
    workflowDir: null,
    agentDir: "agents",
    generatedSkillsDir: null,
    promptsDir: "prompts",
    rulesFile: "rules/AGENTS.md",
  },
  claude: {
    workflowDir: null,
    agentDir: "agents",
    generatedSkillsDir: "generated-skills",
    rulesFile: "rules/CLAUDE.md",
  },
  gemini: {
    workflowDir: null,
    generatedSkillsDir: null,
    commandsDir: "commands",
    rulesFile: "rules/GEMINI.md",
    expectsGeneratedAgents: false,
  },
};

function normalizeMarkdownId(fileName) {
  return path.basename(fileName, ".md");
}

function toCopilotAgentFileName(fileName) {
  return `${normalizeMarkdownId(fileName)}.agent.md`;
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return null;
  return {
    raw: match[1],
    body: markdown.slice(match[0].length),
  };
}

function collectTopLevelKeys(frontmatterRaw) {
  const keys = [];
  for (const line of frontmatterRaw.split(/\r?\n/)) {
    if (!line || /^\s/.test(line)) continue;
    const m = line.match(/^([A-Za-z0-9_-]+)\s*:/);
    if (m) keys.push(m[1]);
  }
  return [...new Set(keys)];
}

function getScalar(frontmatterRaw, key) {
  const m = frontmatterRaw.match(new RegExp(`^\\s*${key}\\s*:\\s*(.+)$`, "m"));
  if (!m) return null;
  return m[1].trim().replace(/^['\"]|['\"]$/g, "");
}

function parseInlineList(text) {
  if (!text) return [];
  const trimmed = text.trim();
  const inner =
    trimmed.startsWith("[") && trimmed.endsWith("]")
      ? trimmed.slice(1, -1)
      : trimmed;
  return inner
    .split(",")
    .map((item) => item.trim().replace(/^['\"]|['\"]$/g, ""))
    .filter(Boolean);
}

function getList(frontmatterRaw, key) {
  const lines = frontmatterRaw.split(/\r?\n/);
  const out = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const keyMatch = line.match(new RegExp(`^${key}\\s*:\\s*(.*)$`));
    if (!keyMatch) continue;

    const rest = keyMatch[1].trim();
    if (rest) {
      out.push(...parseInlineList(rest));
      return [...new Set(out)];
    }

    for (let j = i + 1; j < lines.length; j += 1) {
      const next = lines[j];
      if (!next.trim()) continue;
      if (/^[A-Za-z0-9_-]+\s*:/.test(next)) break;

      const bullet = next.match(/^\s*-\s*(.+)$/);
      if (!bullet) continue;
      out.push(bullet[1].trim().replace(/^['\"]|['\"]$/g, ""));
    }

    return [...new Set(out)];
  }

  return [];
}

function parseMetadata(frontmatterRaw) {
  const lines = frontmatterRaw.split(/\r?\n/);
  const metadata = {};
  let inMetadata = false;
  for (const line of lines) {
    if (/^metadata\s*:\s*$/.test(line)) {
      inMetadata = true;
      continue;
    }
    if (!inMetadata) continue;
    if (!line.trim()) continue;
    if (!/^\s+/.test(line)) break;
    const kv = line.match(/^\s+([A-Za-z0-9_-]+)\s*:\s*(.+)\s*$/);
    if (!kv) continue;
    metadata[kv[1]] = kv[2].trim().replace(/^['\"]|['\"]$/g, "");
  }
  return metadata;
}

function toBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "yes" || normalized === "1";
}

async function validateParityManifest(manifest, errors) {
  const parity = manifest?.parity;
  if (!parity || typeof parity !== "object") {
    error(errors, MANIFEST_PATH, "manifest missing parity section");
    return;
  }

  const auditedReferences = Array.isArray(parity.auditedReferences)
    ? parity.auditedReferences
    : [];
  if (auditedReferences.length !== AUDITED_REFERENCES.length) {
    error(
      errors,
      MANIFEST_PATH,
      `auditedReferences count mismatch: expected ${AUDITED_REFERENCES.length}, found ${auditedReferences.length}`,
    );
  }

  for (const reference of AUDITED_REFERENCES) {
    const match = auditedReferences.find(
      (item) =>
        item?.runtime === reference.runtime &&
        item?.audited_commit === reference.audited_commit,
    );
    if (!match) {
      error(
        errors,
        MANIFEST_PATH,
        `auditedReferences missing ${reference.runtime}@${reference.audited_commit}`,
      );
    }
  }

  const orchestrationSubtypes = Array.isArray(parity.orchestrationSubtypes)
    ? parity.orchestrationSubtypes
    : [];
  if (orchestrationSubtypes.length !== ORCHESTRATION_SUBTYPES.length) {
    error(
      errors,
      MANIFEST_PATH,
      `orchestrationSubtypes count mismatch: expected ${ORCHESTRATION_SUBTYPES.length}, found ${orchestrationSubtypes.length}`,
    );
  }

  for (const subtype of ORCHESTRATION_SUBTYPES) {
    const match = orchestrationSubtypes.find((item) => item?.id === subtype.id);
    if (!match) {
      error(errors, MANIFEST_PATH, `missing orchestration subtype '${subtype.id}'`);
    }
  }

  const artifacts =
    parity.artifacts && typeof parity.artifacts === "object" ? parity.artifacts : {};
  const expectedArtifacts = buildParityArtifactPointers();
  for (const [key, expectedValue] of Object.entries(expectedArtifacts)) {
    if (key === "docs") continue;
    if (artifacts[key] !== expectedValue) {
      error(
        errors,
        MANIFEST_PATH,
        `parity.artifacts.${key} must equal '${expectedValue}'`,
      );
    }
  }

  const expectedDocArtifacts = MANAGED_PARITY_DOC_FILES.map(
    (fileName) => `docs/${fileName}`,
  );
  const actualDocArtifacts = Array.isArray(artifacts.docs) ? artifacts.docs : [];
  if (actualDocArtifacts.length !== expectedDocArtifacts.length) {
    error(
      errors,
      MANIFEST_PATH,
      `parity.artifacts.docs count mismatch: expected ${expectedDocArtifacts.length}, found ${actualDocArtifacts.length}`,
    );
  }
  for (const expectedDoc of expectedDocArtifacts) {
    if (!actualDocArtifacts.includes(expectedDoc)) {
      error(
        errors,
        MANIFEST_PATH,
        `parity.artifacts.docs missing '${expectedDoc}'`,
      );
    }
  }

  const summary = parity.summary && typeof parity.summary === "object" ? parity.summary : {};
  if (summary.totalPatterns !== PATTERN_REGISTRY.length) {
    error(
      errors,
      MANIFEST_PATH,
      `parity.summary.totalPatterns mismatch: expected ${PATTERN_REGISTRY.length}, found ${summary.totalPatterns}`,
    );
  }
  if (summary.totalPlatforms !== EXPECTED_PARITY_PLATFORM_IDS.length) {
    error(
      errors,
      MANIFEST_PATH,
      `parity.summary.totalPlatforms mismatch: expected ${EXPECTED_PARITY_PLATFORM_IDS.length}, found ${summary.totalPlatforms}`,
    );
  }

  const expectedContracts = buildPlatformCapabilityContracts();
  const expectedBlockingSummary = buildBlockingSummary(expectedContracts);
  for (const platformId of EXPECTED_PARITY_PLATFORM_IDS) {
    const actualCounts = summary.blockingSummary?.[platformId];
    const expectedCounts = expectedBlockingSummary[platformId];
    if (
      !actualCounts ||
      actualCounts.native !== expectedCounts.native ||
      actualCounts.degraded !== expectedCounts.degraded ||
      actualCounts.blocked !== expectedCounts.blocked
    ) {
      error(
        errors,
        MANIFEST_PATH,
        `parity.summary.blockingSummary mismatch for '${platformId}'`,
      );
    }
  }

  let generatedPatternRegistry;
  let generatedPlatformCapabilities;
  let generatedPlatformSurfaceSpec;
  let generatedUpstreamAudit;
  try {
    generatedPatternRegistry = JSON.parse(
      await fs.readFile(GENERATED_PATTERN_REGISTRY_PATH, "utf8"),
    );
  } catch (err) {
    error(
      errors,
      GENERATED_PATTERN_REGISTRY_PATH,
      `failed to read generated pattern registry: ${err.message || err}`,
    );
    generatedPatternRegistry = null;
  }
  try {
    generatedPlatformCapabilities = JSON.parse(
      await fs.readFile(GENERATED_PLATFORM_CAPABILITIES_PATH, "utf8"),
    );
  } catch (err) {
    error(
      errors,
      GENERATED_PLATFORM_CAPABILITIES_PATH,
      `failed to read generated platform capabilities: ${err.message || err}`,
    );
    generatedPlatformCapabilities = null;
  }
  try {
    generatedPlatformSurfaceSpec = JSON.parse(
      await fs.readFile(GENERATED_PLATFORM_SURFACE_SPEC_PATH, "utf8"),
    );
  } catch (err) {
    error(
      errors,
      GENERATED_PLATFORM_SURFACE_SPEC_PATH,
      `failed to read generated platform surface spec: ${err.message || err}`,
    );
    generatedPlatformSurfaceSpec = null;
  }
  try {
    generatedUpstreamAudit = JSON.parse(
      await fs.readFile(GENERATED_UPSTREAM_AUDIT_PATH, "utf8"),
    );
  } catch (err) {
    error(
      errors,
      GENERATED_UPSTREAM_AUDIT_PATH,
      `failed to read generated upstream audit: ${err.message || err}`,
    );
    generatedUpstreamAudit = null;
  }

  const patternRegistry = Array.isArray(generatedPatternRegistry?.patterns)
    ? generatedPatternRegistry.patterns
    : [];
  if (patternRegistry.length !== PATTERN_REGISTRY.length) {
    error(
      errors,
      GENERATED_PATTERN_REGISTRY_PATH,
      `patterns count mismatch: expected ${PATTERN_REGISTRY.length}, found ${patternRegistry.length}`,
    );
  }
  const requiredPatternKeys = [
    "pattern_id",
    "category",
    "canonical_surface",
    "source_repos",
    "required_capabilities",
    "degraded_projection_policy",
    "acceptance_contract",
    "docs_contract",
    "test_contract",
  ];
  const expectedPatternIds = new Set(EXPECTED_PARITY_PATTERN_IDS);

  for (const item of patternRegistry) {
    if (!item || typeof item !== "object") {
      error(errors, GENERATED_PATTERN_REGISTRY_PATH, "patternRegistry contains a non-object entry");
      continue;
    }
    const patternId = String(item.pattern_id || "").trim();
    if (!patternId) {
      error(errors, GENERATED_PATTERN_REGISTRY_PATH, "patternRegistry entry missing pattern_id");
      continue;
    }
    if (!expectedPatternIds.has(patternId)) {
      error(
        errors,
        GENERATED_PATTERN_REGISTRY_PATH,
        `patternRegistry contains unknown pattern '${patternId}'`,
      );
    }
    for (const key of requiredPatternKeys) {
      if (!(key in item)) {
        error(
          errors,
          GENERATED_PATTERN_REGISTRY_PATH,
          `patternRegistry entry '${patternId}' missing key '${key}'`,
        );
      }
    }
  }

  if (
    !Array.isArray(generatedPatternRegistry?.auditedReferences) ||
    generatedPatternRegistry.auditedReferences.length !== AUDITED_REFERENCES.length
  ) {
    error(
      errors,
      GENERATED_PATTERN_REGISTRY_PATH,
      "generated pattern registry auditedReferences mismatch",
    );
  }
  if (
    !Array.isArray(generatedPatternRegistry?.orchestrationSubtypes) ||
    generatedPatternRegistry.orchestrationSubtypes.length !== ORCHESTRATION_SUBTYPES.length
  ) {
    error(
      errors,
      GENERATED_PATTERN_REGISTRY_PATH,
      "generated pattern registry orchestrationSubtypes mismatch",
    );
  }

  const platformContracts =
    generatedPlatformCapabilities?.platforms &&
    typeof generatedPlatformCapabilities.platforms === "object"
      ? generatedPlatformCapabilities.platforms
      : {};
  const platformSurfaceSpec =
    generatedPlatformSurfaceSpec?.platforms &&
    typeof generatedPlatformSurfaceSpec.platforms === "object"
      ? generatedPlatformSurfaceSpec.platforms
      : {};
  const expectedSurfaceSpec = buildPlatformSurfaceSpec();
  for (const platformId of EXPECTED_PARITY_PLATFORM_IDS) {
    const contract = platformContracts?.[platformId];
    if (!contract || typeof contract !== "object") {
      error(
        errors,
        GENERATED_PLATFORM_CAPABILITIES_PATH,
        `platform capabilities missing platform '${platformId}'`,
      );
      continue;
    }

    for (const section of [
      "platform_id",
      "runtime_family",
      "instruction_capabilities",
      "config_capabilities",
      "agent_capabilities",
      "skill_capabilities",
      "session_capabilities",
      "mcp_capabilities",
      "safety_capabilities",
      "pattern_support",
    ]) {
      if (!(section in contract)) {
        error(
          errors,
          GENERATED_PLATFORM_CAPABILITIES_PATH,
          `platform capabilities ${platformId} missing '${section}'`,
        );
      }
    }

    const supportEntries = Array.isArray(contract.pattern_support)
      ? contract.pattern_support
      : [];
    if (supportEntries.length !== PATTERN_REGISTRY.length) {
      error(
        errors,
        GENERATED_PLATFORM_CAPABILITIES_PATH,
        `platform '${platformId}' pattern_support count mismatch: expected ${PATTERN_REGISTRY.length}, found ${supportEntries.length}`,
      );
    }

    const seenPatternIds = new Set();
    for (const entry of supportEntries) {
      const patternId = String(entry?.pattern_id || "").trim();
      if (!patternId) {
        error(
          errors,
          GENERATED_PLATFORM_CAPABILITIES_PATH,
          `platform '${platformId}' has pattern_support entry without pattern_id`,
        );
        continue;
      }
      if (seenPatternIds.has(patternId)) {
        error(
          errors,
          GENERATED_PLATFORM_CAPABILITIES_PATH,
          `platform '${platformId}' duplicates pattern '${patternId}' in pattern_support`,
        );
      }
      seenPatternIds.add(patternId);
      if (!expectedPatternIds.has(patternId) && !PATTERN_REGISTRY.find((item) => item.pattern_id === patternId)) {
        error(
          errors,
          GENERATED_PLATFORM_CAPABILITIES_PATH,
          `platform '${platformId}' references unknown pattern '${patternId}'`,
        );
      }
      if (!["native", "degraded", "blocked"].includes(entry.support_level)) {
        error(
          errors,
          GENERATED_PLATFORM_CAPABILITIES_PATH,
          `platform '${platformId}' pattern '${patternId}' has invalid support_level '${entry.support_level}'`,
        );
      }
      if (!entry.projection_surface) {
        error(
          errors,
          GENERATED_PLATFORM_CAPABILITIES_PATH,
          `platform '${platformId}' pattern '${patternId}' missing projection_surface`,
        );
      }
      if (!entry.behavior_notes) {
        error(
          errors,
          GENERATED_PLATFORM_CAPABILITIES_PATH,
          `platform '${platformId}' pattern '${patternId}' missing behavior_notes`,
        );
      }
      if (!Array.isArray(entry.hard_limits) || entry.hard_limits.length === 0) {
        error(
          errors,
          GENERATED_PLATFORM_CAPABILITIES_PATH,
          `platform '${platformId}' pattern '${patternId}' missing hard_limits`,
        );
      }
      if (
        !Array.isArray(entry.verification_steps) ||
        entry.verification_steps.length === 0
      ) {
        error(
          errors,
          GENERATED_PLATFORM_CAPABILITIES_PATH,
          `platform '${platformId}' pattern '${patternId}' missing verification_steps`,
        );
      }
      if (entry.support_level === "blocked") {
        error(
          errors,
          GENERATED_PLATFORM_CAPABILITIES_PATH,
          `platform '${platformId}' blocks pattern '${patternId}' — semantic parity is expected for all current platforms`,
        );
      }
      if (entry.support_level !== "blocked" && entry.installable !== true) {
        error(
          errors,
          GENERATED_PLATFORM_CAPABILITIES_PATH,
          `platform '${platformId}' pattern '${patternId}' should be installable when support_level is '${entry.support_level}'`,
        );
      }
    }

    for (const patternId of expectedPatternIds) {
      if (!seenPatternIds.has(patternId)) {
        error(
          errors,
          GENERATED_PLATFORM_CAPABILITIES_PATH,
          `platform '${platformId}' missing pattern_support entry for '${patternId}'`,
        );
      }
    }

    const surfaceSpec = platformSurfaceSpec?.[platformId];
    if (!surfaceSpec || typeof surfaceSpec !== "object") {
      error(
        errors,
        GENERATED_PLATFORM_SURFACE_SPEC_PATH,
        `platform surface spec missing platform '${platformId}'`,
      );
      continue;
    }
    for (const key of [
      "platformId",
      "label",
      "hookSupport",
      "workflowSurfaceKind",
      "specialistRouteRenderer",
      "rules",
      "skills",
      "workflows",
      "customAgents",
      "subagents",
      "hooks",
    ]) {
      if (!(key in surfaceSpec)) {
        error(
          errors,
          GENERATED_PLATFORM_SURFACE_SPEC_PATH,
          `platform surface spec '${platformId}' missing '${key}'`,
        );
      }
    }
    for (const surfaceName of [
      "rules",
      "skills",
      "workflows",
      "customAgents",
      "subagents",
      "hooks",
    ]) {
      const surface = surfaceSpec[surfaceName];
      if (!surface || typeof surface !== "object") {
        error(
          errors,
          GENERATED_PLATFORM_SURFACE_SPEC_PATH,
          `platform surface spec '${platformId}.${surfaceName}' missing`,
        );
        continue;
      }
      for (const requiredKey of [
        "vendorSupport",
        "foundryStatus",
        "projectPath",
        "globalPath",
        "format",
        "nativeOrProjected",
        "notes",
      ]) {
        if (!(requiredKey in surface)) {
          error(
            errors,
            GENERATED_PLATFORM_SURFACE_SPEC_PATH,
            `platform surface spec '${platformId}.${surfaceName}' missing '${requiredKey}'`,
          );
        }
      }
      if (
        typeof surface.foundryStatus !== "string" ||
        !["native", "degraded", "experimental", "do-not-ship"].includes(
          surface.foundryStatus,
        )
      ) {
        error(
          errors,
          GENERATED_PLATFORM_SURFACE_SPEC_PATH,
          `platform surface spec '${platformId}.${surfaceName}' has invalid foundryStatus '${surface.foundryStatus}'`,
        );
      }
    }
    if (JSON.stringify(surfaceSpec) !== JSON.stringify(expectedSurfaceSpec[platformId])) {
      error(
        errors,
        GENERATED_PLATFORM_SURFACE_SPEC_PATH,
        `platform surface spec drift detected for '${platformId}'`,
      );
    }
  }

  const audits = Array.isArray(generatedUpstreamAudit?.audits) ? generatedUpstreamAudit.audits : [];
  if (audits.length !== AUDITED_REFERENCES.length) {
    error(
      errors,
      GENERATED_UPSTREAM_AUDIT_PATH,
      `audit count mismatch: expected ${AUDITED_REFERENCES.length}, found ${audits.length}`,
    );
  }
  for (const reference of AUDITED_REFERENCES) {
    const match = audits.find(
      (item) =>
        item?.runtime === reference.runtime &&
        item?.audit_source_id === reference.audit_source_id &&
        item?.audited_commit === reference.audited_commit,
    );
    if (!match) {
      error(
        errors,
        GENERATED_UPSTREAM_AUDIT_PATH,
        `generated upstream audit missing ${reference.runtime}@${reference.audited_commit}`,
      );
    }
  }
}

async function pathExists(targetPath) {
  try {
    await fs.stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readUtf8(filePath) {
  return fs.readFile(filePath, "utf8");
}

async function listMarkdownFiles(dirPath) {
  if (!(await pathExists(dirPath))) return [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith(".md") &&
        !entry.name.startsWith("."),
    )
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function extractSkillIdFromIndexPath(indexPathValue) {
  const raw = String(indexPathValue || "").trim();
  if (!raw) return null;
  const normalized = raw.replace(/\\\\/g, "/");
  const marker = "/skills/";
  const markerIndex = normalized.indexOf(marker);
  if (markerIndex === -1) return null;
  const remainder = normalized.slice(markerIndex + marker.length);
  const [skillId] = remainder.split("/");
  const normalizedSkillId = String(skillId || "").trim();
  return normalizedSkillId || null;
}

async function resolveIndexedTopLevelSkillIds(canonicalMap) {
  if (!(await pathExists(SKILLS_INDEX_PATH))) return [];
  const raw = await readUtf8(SKILLS_INDEX_PATH);
  const parsed = JSON.parse(raw);
  const entries = Array.isArray(parsed) ? parsed : [];
  const candidates = [];

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    if (typeof entry.id === "string" && entry.id.trim()) {
      candidates.push(entry.id.trim());
    }
    if (typeof entry.name === "string" && entry.name.trim()) {
      candidates.push(entry.name.trim());
    }
    const byPath = extractSkillIdFromIndexPath(entry.path);
    if (byPath) candidates.push(byPath);
  }

  const out = [];
  const seen = new Set();
  for (const candidate of candidates) {
    if (!candidate || candidate.startsWith(".")) continue;
    const key = candidate.toLowerCase();
    if (seen.has(key)) continue;
    if (canonicalMap && !canonicalMap.has(key)) continue;
    seen.add(key);
    out.push(canonicalMap?.get(key)?.id || candidate);
  }

  return out.sort((a, b) => a.localeCompare(b));
}

async function listTopLevelSkillIds(skillsRoot) {
  if (!(await pathExists(skillsRoot))) return [];
  const entries = await fs.readdir(skillsRoot, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

async function buildCanonicalSkillMap() {
  const map = new Map();
  for (const root of [CANONICAL_SKILLS_ROOT]) {
    if (!(await pathExists(root))) continue;
    const ids = await listTopLevelSkillIds(root);
    for (const skillId of ids) {
      const skillFile = path.join(root, skillId, "SKILL.md");
      if (!(await pathExists(skillFile))) continue;
      map.set(skillId.toLowerCase(), { id: skillId, root });
    }
  }
  return map;
}

async function findDuplicateSkillNamesInIndex() {
  if (!(await pathExists(SKILLS_INDEX_PATH))) return [];
  const raw = await readUtf8(SKILLS_INDEX_PATH);
  const parsed = JSON.parse(raw);
  const entries = Array.isArray(parsed) ? parsed : [];

  const counts = new Map();
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const name = typeof entry.name === "string" ? entry.name.trim() : "";
    if (!name) continue;
    const key = name.toLowerCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

async function findDuplicateSkillIdsInIndex() {
  if (!(await pathExists(SKILLS_INDEX_PATH))) return [];
  const raw = await readUtf8(SKILLS_INDEX_PATH);
  const parsed = JSON.parse(raw);
  const entries = Array.isArray(parsed) ? parsed : [];

  const counts = new Map();
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const id =
      String(entry.id || "").trim() ||
      extractSkillIdFromIndexPath(entry.path) ||
      "";
    if (!id) continue;
    const key = id.toLowerCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
}

function stripCodeFences(markdown) {
  return markdown.replace(/```[\s\S]*?```/g, "");
}

function extractMarkdownLinks(markdown) {
  const content = stripCodeFences(markdown).replace(/`[^`]*`/g, "");
  const links = [];
  const regex = /\[[^\]]+\]\(([^)]+)\)/g;
  let match;
  while ((match = regex.exec(content))) {
    links.push(match[1].trim());
  }
  return links;
}

function shouldValidateRelativeLink(target) {
  if (!target) return false;
  if (target.startsWith("http://") || target.startsWith("https://"))
    return false;
  if (target.startsWith("mailto:") || target.startsWith("#")) return false;
  if (target.startsWith("/")) return false;
  if (target.includes("{") || target.includes("}")) return false;
  return true;
}

function error(errors, filePath, message) {
  errors.push(`${filePath}: ${message}`);
}

function warn(warnings, filePath, message) {
  const item = `${filePath}: ${message}`;
  if (!warnings.includes(item)) {
    warnings.push(item);
  }
}

function note(notes, filePath, message) {
  const item = `${filePath}: ${message}`;
  if (!notes.includes(item)) {
    notes.push(item);
  }
}

function validateWorkflowRequiredSections(body, filePath, errors) {
  for (const section of WORKFLOW_REQUIRED_SECTIONS) {
    if (!new RegExp(`^##\\s+${section}$`, "m").test(body)) {
      error(errors, filePath, `missing required section '## ${section}'`);
    }
  }
}

function extractSkillRoutingSection(body) {
  const headingMatch = body.match(/^##\s+Skill Routing\s*$/m);
  if (!headingMatch || headingMatch.index === undefined) return "";
  const start = headingMatch.index + headingMatch[0].length;
  const tail = body.slice(start);
  const nextHeading = tail.search(/^##\s+/m);
  if (nextHeading === -1) return tail;
  return tail.slice(0, nextHeading);
}

function collectBacktickSkillIds(markdownSection) {
  const ids = [];
  const seen = new Set();
  const regex = /`([^`]+)`/g;
  for (const match of markdownSection.matchAll(regex)) {
    const raw = String(match[1] || "").trim();
    if (!raw) continue;
    if (raw.startsWith("@") || raw.startsWith("/")) continue;
    if (raw.includes(" ")) continue;
    const normalized = raw.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    ids.push(raw);
  }
  return ids;
}

function validateWorkflowSkillRoutingIds({
  body,
  filePath,
  skillSet,
  subSkillSet,
  errors,
}) {
  const section = extractSkillRoutingSection(body);
  if (!section.trim()) return;
  const skillIds = collectBacktickSkillIds(section);
  for (const skillId of skillIds) {
    const key = normalizeSkillId(skillId).toLowerCase();
    if (skillSet.has(key) || subSkillSet.has(key)) continue;
    error(
      errors,
      filePath,
      `Skill Routing references missing skill '${skillId}'`,
    );
  }
}

async function validateWorkflowFile(
  filePath,
  errors,
  { skillSet = new Set(), subSkillSet = new Set() } = {},
) {
  const raw = await readUtf8(filePath);
  const fm = parseFrontmatter(raw);
  if (!fm) {
    error(errors, filePath, "missing frontmatter");
    return;
  }

  const command = getScalar(fm.raw, "command");
  const description = getScalar(fm.raw, "description");

  if (!command || !command.startsWith("/")) {
    error(
      errors,
      filePath,
      "frontmatter command is missing or invalid (must start with '/')",
    );
  }
  if (!description) {
    error(errors, filePath, "frontmatter description is missing");
  }

  validateWorkflowRequiredSections(fm.body, filePath, errors);
  validateWorkflowSkillRoutingIds({
    body: fm.body,
    filePath,
    skillSet,
    subSkillSet,
    errors,
  });
}

async function validateSkillFile({
  filePath,
  platform,
  errors,
  notes,
  canonicalMap,
}) {
  const raw = await readUtf8(filePath);
  const fm = parseFrontmatter(raw);
  if (!fm) {
    error(errors, filePath, "missing frontmatter");
    return;
  }

  const keys = collectTopLevelKeys(fm.raw);
  const name = getScalar(fm.raw, "name");
  const description = getScalar(fm.raw, "description");
  const metadata = parseMetadata(fm.raw);

  if (!name) error(errors, filePath, "missing required 'name' in frontmatter");
  if (!description)
    error(errors, filePath, "missing required 'description' in frontmatter");

  if (toBoolean(metadata.deprecated)) {
    if (!metadata.replaced_by) {
      error(errors, filePath, "deprecated skill missing metadata.replaced_by");
    }
    if (!metadata.removal_target) {
      error(
        errors,
        filePath,
        "deprecated skill missing metadata.removal_target",
      );
    }
    if (metadata.replaced_by) {
      const replacement = canonicalMap?.get(
        String(metadata.replaced_by).toLowerCase(),
      );
      if (!replacement) {
        error(
          errors,
          filePath,
          `deprecated skill replacement missing: ${metadata.replaced_by}`,
        );
      }
    }
  }

  for (const href of extractMarkdownLinks(raw)) {
    if (!shouldValidateRelativeLink(href)) continue;
    const cleanHref = href.split("#")[0].split("?")[0];
    if (!cleanHref) continue;
    const resolved = path.resolve(path.dirname(filePath), cleanHref);
    if (!(await pathExists(resolved))) {
      error(errors, filePath, `broken local link in SKILL.md: ${href}`);
    }
  }

  if (platform === "copilot") {
    const unsupported = keys.filter(
      (key) => !COPILOT_ALLOWED_SKILL_KEYS.has(key),
    );
    if (unsupported.length > 0) {
      note(
        notes,
        filePath,
        `canonical skill has Copilot-unsupported keys (${unsupported.join(", ")}); installer sanitization remains fallback`,
      );
    }
    return;
  }

  if (platform === "claude") {
    const unexpected = keys.filter(
      (key) => !CLAUDE_ALLOWED_SKILL_KEYS.has(key),
    );
    if (unexpected.length > 0) {
      note(
        notes,
        filePath,
        `unexpected Claude skill keys present: ${unexpected.join(", ")}`,
      );
    }
    return;
  }

  const nonStandard = keys.filter(
    (key) =>
      ![
        "name",
        "description",
        "keywords",
        "displayName",
        "triggers",
        "compatibility",
        "license",
        "metadata",
        "allowed-tools",
        "author",
        "version",
        "priority",
      ].includes(key),
  );
  if (nonStandard.length > 0) {
    note(
      notes,
      filePath,
      `non-standard skill keys present: ${nonStandard.join(", ")}`,
    );
  }
}

async function validateAgentFile({
  filePath,
  platform,
  skillSet,
  subSkillSet,
  errors,
  notes,
}) {
  const raw = await readUtf8(filePath);
  const fm = parseFrontmatter(raw);
  if (!fm) {
    error(errors, filePath, "missing frontmatter");
    return;
  }

  const keys = collectTopLevelKeys(fm.raw);
  const name = getScalar(fm.raw, "name");
  const description = getScalar(fm.raw, "description");

  if (!name) error(errors, filePath, "missing required 'name' in frontmatter");
  if (!description)
    error(errors, filePath, "missing required 'description' in frontmatter");

  if (platform === "copilot") {
    const unsupported = keys.filter(
      (key) => !COPILOT_ALLOWED_AGENT_KEYS.has(key),
    );
    if (unsupported.length > 0) {
      error(
        errors,
        filePath,
        `Copilot agent contains unsupported keys (${unsupported.join(", ")})`,
      );
    }
    return;
  }

  const referencedSkills = getList(fm.raw, "skills");
  for (const skillId of referencedSkills) {
    const normalizedSkillId = normalizeSkillId(skillId).toLowerCase();
    if (skillSet.has(normalizedSkillId) || subSkillSet.has(normalizedSkillId)) {
      continue;
    }
    error(errors, filePath, `references missing skill '${skillId}'`);
  }
}

async function validateCodexAgentToml(filePath, errors) {
  const raw = await readUtf8(filePath);
  if (!/^\s*name\s*=\s*"/m.test(raw)) {
    error(errors, filePath, "missing required TOML field 'name'");
  }
  if (!/^\s*description\s*=\s*"/m.test(raw)) {
    error(errors, filePath, "missing required TOML field 'description'");
  }
  if (!/^\s*developer_instructions\s*=\s*"""/m.test(raw)) {
    error(
      errors,
      filePath,
      "missing required TOML field 'developer_instructions'",
    );
  }
}

async function buildCanonicalSubSkillSet(canonicalMap) {
  const ids = new Set();
  for (const { id: topLevelId, root } of canonicalMap.values()) {
    const nestedRoot = path.join(root, topLevelId, "skills");
    if (!(await pathExists(nestedRoot))) continue;
    const queue = [nestedRoot];
    while (queue.length > 0) {
      const current = queue.pop();
      if (!current || !(await pathExists(current))) continue;
      const nestedEntries = await fs.readdir(current, { withFileTypes: true });
      for (const entry of nestedEntries) {
        if (entry.name.startsWith(".")) continue;
        const fullPath = path.join(current, entry.name);
        if (entry.isDirectory()) {
          queue.push(fullPath);
          continue;
        }
        if (!entry.isFile() || entry.name !== "SKILL.md") continue;
        const relativeDir = path.relative(nestedRoot, path.dirname(fullPath));
        const parts = relativeDir.split(path.sep).filter(Boolean);
        if (parts.length === 0) continue;
        ids.add(parts[parts.length - 1].toLowerCase());
        ids.add(`${topLevelId}/${parts.join("/")}`.toLowerCase());
      }
    }
  }
  return ids;
}

async function validateCanonicalSkillsStructure({ errors, canonicalMap }) {
  const canonicalIds = [...canonicalMap.values()]
    .map((item) => item.id)
    .sort((a, b) => a.localeCompare(b));
  const canonicalSet = new Set(canonicalIds.map((id) => id.toLowerCase()));

  for (const skillId of canonicalIds) {
    const source =
      canonicalMap.get(skillId.toLowerCase())?.root || CANONICAL_SKILLS_ROOT;
    const skillFile = path.join(source, skillId, "SKILL.md");
    if (!(await pathExists(skillFile))) {
      error(
        errors,
        skillFile,
        `top-level canonical skill '${skillId}' is missing SKILL.md`,
      );
    }
  }

  for (const [label, mirrorRoot] of Object.entries(MIRROR_SKILL_ROOTS)) {
    if (!(await pathExists(mirrorRoot))) {
      error(errors, mirrorRoot, `mirror skills root missing for '${label}'`);
      continue;
    }

    const mirrorIds = await listTopLevelSkillIds(mirrorRoot);
    const mirrorSet = new Set(mirrorIds.map((id) => id.toLowerCase()));

    for (const skillId of canonicalIds) {
      if (!mirrorSet.has(skillId.toLowerCase())) {
        error(
          errors,
          mirrorRoot,
          `mirror '${label}' missing canonical skill '${skillId}'`,
        );
      }
      const skillFile = path.join(mirrorRoot, skillId, "SKILL.md");
      if (
        (await pathExists(path.join(mirrorRoot, skillId))) &&
        !(await pathExists(skillFile))
      ) {
        error(
          errors,
          skillFile,
          `mirror '${label}' skill '${skillId}' missing SKILL.md`,
        );
      }
    }

    for (const mirrorId of mirrorIds) {
      if (!canonicalSet.has(mirrorId.toLowerCase())) {
        error(
          errors,
          mirrorRoot,
          `mirror '${label}' has non-canonical skill '${mirrorId}'`,
        );
      }
    }
  }
}

function normalizedSet(values) {
  return new Set(
    values
      .map((value) =>
        String(value || "")
          .trim()
          .toLowerCase(),
      )
      .filter(Boolean),
  );
}

function assertFileSetParity({ label, expected, actual, errors, contextPath }) {
  const expectedSet = normalizedSet(expected);
  const actualSet = normalizedSet(actual);

  for (const item of expectedSet) {
    if (!actualSet.has(item)) {
      error(errors, contextPath, `${label} missing '${item}'`);
    }
  }

  for (const item of actualSet) {
    if (!expectedSet.has(item)) {
      error(errors, contextPath, `${label} has unexpected '${item}'`);
    }
  }
}

async function validateSharedSourceAndGeneratedParity({
  manifest,
  errors,
  notes,
  skillSet,
  subSkillSet,
}) {
  if (!(await pathExists(SHARED_AGENTS_DIR))) {
    error(errors, SHARED_AGENTS_DIR, "shared agents directory missing");
    return;
  }
  if (!(await pathExists(SHARED_WORKFLOWS_DIR))) {
    error(errors, SHARED_WORKFLOWS_DIR, "shared workflows directory missing");
    return;
  }

  const sharedAgents = await listMarkdownFiles(SHARED_AGENTS_DIR);
  const sharedWorkflows = await listMarkdownFiles(SHARED_WORKFLOWS_DIR);
  const workflowIds = sharedWorkflows.map((fileName) =>
    normalizeMarkdownId(fileName),
  );
  const workflowCommandFiles = workflowIds.map((id) => `${id}.toml`);
  const copilotPromptFiles = workflowIds.map((id) => `${id}.prompt.md`);
  const codexAgentFiles = sharedAgents.map(
    (fileName) => `${normalizeMarkdownId(fileName)}.toml`,
  );
  const copilotAgentFiles = sharedAgents.map((fileName) =>
    toCopilotAgentFileName(fileName),
  );
  const agentCommandFiles = sharedAgents.map(
    (fileName) => `agent-${normalizeMarkdownId(fileName)}.toml`,
  );

  if (sharedAgents.length === 0) {
    error(errors, SHARED_AGENTS_DIR, "no shared agent markdown files found");
  }
  if (sharedWorkflows.length === 0) {
    error(
      errors,
      SHARED_WORKFLOWS_DIR,
      "no shared workflow markdown files found",
    );
  }

  for (const fileName of sharedWorkflows) {
    await validateWorkflowFile(
      path.join(SHARED_WORKFLOWS_DIR, fileName),
      errors,
      { skillSet, subSkillSet },
    );
  }

  for (const platformId of [
    "codex",
    "antigravity",
    "copilot",
    "claude",
    "gemini",
  ]) {
    const spec = manifest.platforms?.[platformId];
    if (!spec) {
      error(errors, MANIFEST_PATH, `manifest missing platform '${platformId}'`);
      continue;
    }

    const platformRoot = path.join(BUNDLE_ROOT, "platforms", platformId);
    const workflowFiles = Array.isArray(spec.workflows) ? spec.workflows : [];
    const agentFiles = Array.isArray(spec.agents) ? spec.agents : [];
    const generatedSkills = Array.isArray(spec.generatedSkills)
      ? spec.generatedSkills
      : [];
    const expectsGeneratedAgents =
      platforms[platformId].expectsGeneratedAgents !== false;
    const expectedAgentFiles =
      platformId === "codex"
        ? codexAgentFiles
        : platformId === "copilot"
          ? copilotAgentFiles
        : expectsGeneratedAgents
          ? sharedAgents
          : [];
    const expectedGeneratedSkills =
      platformId === "codex" || platformId === "claude" ? workflowIds : [];

    assertFileSetParity({
      label: `${platformId} workflow list`,
      expected: [],
      actual: workflowFiles,
      errors,
      contextPath: MANIFEST_PATH,
    });

    assertFileSetParity({
      label: `${platformId} agent list`,
      expected: expectedAgentFiles,
      actual: agentFiles,
      errors,
      contextPath: MANIFEST_PATH,
    });

    assertFileSetParity({
      label: `${platformId} generated skill list`,
      expected: expectedGeneratedSkills,
      actual: generatedSkills,
      errors,
      contextPath: MANIFEST_PATH,
    });

    for (const skillId of expectedGeneratedSkills) {
      const generatedSkillFile = path.join(
        platformRoot,
        platforms[platformId].generatedSkillsDir,
        skillId,
        "SKILL.md",
      );
      if (!(await pathExists(generatedSkillFile))) {
        error(errors, generatedSkillFile, "generated workflow skill missing");
      }
    }

    for (const fileName of expectedAgentFiles) {
      if (!platforms[platformId].agentDir) continue;
      const platformAgent = path.join(
        platformRoot,
        platforms[platformId].agentDir,
        fileName,
      );
      if (!(await pathExists(platformAgent))) {
        error(errors, platformAgent, "generated agent missing");
      }
    }
  }

  const antigravitySpec = manifest.platforms?.antigravity || {};
  const antCommands = Array.isArray(antigravitySpec.commands)
    ? antigravitySpec.commands
    : [];
  if (antCommands.length !== workflowCommandFiles.length + agentCommandFiles.length) {
    error(
      errors,
      MANIFEST_PATH,
      `antigravity commands count mismatch: expected ${workflowCommandFiles.length + agentCommandFiles.length}, found ${antCommands.length}`,
    );
  }
  for (const commandFile of antCommands) {
    const filePath = path.join(
      BUNDLE_ROOT,
      "platforms",
      "antigravity",
      "commands",
      commandFile,
    );
    if (!(await pathExists(filePath))) {
      error(
        errors,
        filePath,
        "antigravity command file listed in manifest is missing",
      );
    }
  }

  const geminiSpec = manifest.platforms?.gemini || {};
  const geminiCommands = Array.isArray(geminiSpec.commands)
    ? geminiSpec.commands
    : [];
  if (geminiCommands.length !== workflowCommandFiles.length + agentCommandFiles.length) {
    error(
      errors,
      MANIFEST_PATH,
      `gemini commands count mismatch: expected ${workflowCommandFiles.length + agentCommandFiles.length}, found ${geminiCommands.length}`,
    );
  }
  for (const commandFile of geminiCommands) {
    const filePath = path.join(
      BUNDLE_ROOT,
      "platforms",
      "gemini",
      "commands",
      commandFile,
    );
    if (!(await pathExists(filePath))) {
      error(
        errors,
        filePath,
        "gemini command file listed in manifest is missing",
      );
    }
  }

  const copilotSpec = manifest.platforms?.copilot || {};
  const copilotPrompts = Array.isArray(copilotSpec.prompts)
    ? copilotSpec.prompts
    : [];
  if (copilotPrompts.length !== workflowIds.length) {
    error(
      errors,
      MANIFEST_PATH,
      `copilot prompts count mismatch: expected ${workflowIds.length}, found ${copilotPrompts.length}`,
    );
  }
  assertFileSetParity({
    label: "copilot prompt list",
    expected: copilotPromptFiles,
    actual: copilotPrompts,
    errors,
    contextPath: MANIFEST_PATH,
  });
  for (const promptFile of copilotPrompts) {
    const filePath = path.join(
      BUNDLE_ROOT,
      "platforms",
      "copilot",
      "prompts",
      promptFile,
    );
    if (!(await pathExists(filePath))) {
      error(
        errors,
        filePath,
        "copilot prompt file listed in manifest is missing",
      );
    }
  }

  if (!(await pathExists(GENERATE_PLATFORM_ASSETS_SCRIPT))) {
    error(
      errors,
      GENERATE_PLATFORM_ASSETS_SCRIPT,
      "platform asset generator script is missing",
    );
    return;
  }

  try {
    const checkResult = await checkPlatformAssets();
    if (checkResult.drift.length === 0) {
      return;
    }
    const detail = checkResult.drift
      .map((item) => {
        const parts = [];
        if (item.diff.missing.length > 0) parts.push("missing");
        if (item.diff.changed.length > 0) parts.push("changed");
        if (item.diff.extra.length > 0) parts.push("extra");
        return `${item.label}: ${parts.join("/")}`;
      })
      .join("; ");
    error(
      errors,
      GENERATE_PLATFORM_ASSETS_SCRIPT,
      `generated assets drift detected (${detail})`,
    );
  } catch (runError) {
    error(
      errors,
      GENERATE_PLATFORM_ASSETS_SCRIPT,
      `generated assets validation failed (${runError.message || runError})`,
    );
  }
}

async function main() {
  const errors = [];
  const warnings = [];
  const notes = [];

  if (!(await pathExists(MANIFEST_PATH))) {
    console.error(`Manifest not found: ${MANIFEST_PATH}`);
    process.exit(1);
  }

  const manifest = JSON.parse(await readUtf8(MANIFEST_PATH));
  await validateParityManifest(manifest, errors);
  const canonicalMap = await buildCanonicalSkillMap();
  const canonicalSubSkillSet = await buildCanonicalSubSkillSet(canonicalMap);
  const indexedSkillIds = await resolveIndexedTopLevelSkillIds(canonicalMap);
  const indexedSkillSet = new Set(
    indexedSkillIds.map((id) => String(id).toLowerCase()),
  );
  if (indexedSkillSet.size === 0) {
    error(errors, SKILLS_INDEX_PATH, "no indexed top-level skills resolved");
  }

  const duplicateSkillNames = await findDuplicateSkillNamesInIndex();
  for (const duplicate of duplicateSkillNames) {
    error(
      errors,
      SKILLS_INDEX_PATH,
      `duplicate skill name '${duplicate.name}' found ${duplicate.count} times`,
    );
  }
  const duplicateSkillIds = await findDuplicateSkillIdsInIndex();
  for (const duplicate of duplicateSkillIds) {
    error(
      errors,
      SKILLS_INDEX_PATH,
      `duplicate skill id '${duplicate.id}' found ${duplicate.count} times`,
    );
  }

  for (const [platformId, spec] of Object.entries(manifest.platforms || {})) {
    const platformCfg = platforms[platformId];
    if (!platformCfg) {
      error(
        errors,
        MANIFEST_PATH,
        `unknown platform in manifest: '${platformId}'`,
      );
      continue;
    }

    const platformRoot = path.join(BUNDLE_ROOT, "platforms", platformId);
    const workflowFiles = Array.isArray(spec.workflows) ? spec.workflows : [];
    const agentFiles = Array.isArray(spec.agents) ? spec.agents : [];
    const generatedSkills = Array.isArray(spec.generatedSkills)
      ? spec.generatedSkills
      : [];
    const skills = Array.isArray(spec.skills) ? spec.skills : [];

    for (const rel of workflowFiles) {
      if (!platformCfg.workflowDir) {
        error(
          errors,
          MANIFEST_PATH,
          `platform '${platformId}' defines workflows but has no workflowDir mapping`,
        );
        break;
      }
      const filePath = path.join(platformRoot, platformCfg.workflowDir, rel);
      if (!(await pathExists(filePath))) {
        error(errors, filePath, "workflow file listed in manifest is missing");
        continue;
      }
      await validateWorkflowFile(filePath, errors, {
        skillSet: indexedSkillSet,
        subSkillSet: canonicalSubSkillSet,
      });
    }

    for (const rel of agentFiles) {
      if (!platformCfg.agentDir) {
        error(
          errors,
          MANIFEST_PATH,
          `platform '${platformId}' defines agents but has no agentDir mapping`,
        );
        break;
      }
      const filePath = path.join(platformRoot, platformCfg.agentDir, rel);
      if (!(await pathExists(filePath))) {
        error(errors, filePath, "agent file listed in manifest is missing");
        continue;
      }
      if (platformCfg.agentFormat === "toml") {
        await validateCodexAgentToml(filePath, errors);
      } else {
        await validateAgentFile({
          filePath,
          platform: platformId,
          skillSet: indexedSkillSet,
          subSkillSet: canonicalSubSkillSet,
          errors,
          notes,
        });
      }
    }

    for (const rel of generatedSkills) {
      if (!platformCfg.generatedSkillsDir) {
        error(
          errors,
          MANIFEST_PATH,
          `platform '${platformId}' defines generatedSkills but has no generatedSkillsDir mapping`,
        );
        break;
      }
      const filePath = path.join(
        platformRoot,
        platformCfg.generatedSkillsDir,
        rel,
        "SKILL.md",
      );
      if (!(await pathExists(filePath))) {
        error(
          errors,
          filePath,
          "generated skill listed in manifest is missing",
        );
        continue;
      }
      await validateSkillFile({
        filePath,
        platform: platformId,
        errors,
        notes,
        canonicalMap,
      });
    }

    if (Array.isArray(spec.commands)) {
      if (!platformCfg.commandsDir) {
        error(
          errors,
          MANIFEST_PATH,
          `platform '${platformId}' defines commands but has no commandsDir mapping`,
        );
      }
      for (const rel of spec.commands) {
        const filePath = path.join(
          platformRoot,
          platformCfg.commandsDir || "commands",
          rel,
        );
        if (!(await pathExists(filePath))) {
          error(errors, filePath, "command file listed in manifest is missing");
        }
      }
    }

    if (Array.isArray(spec.prompts)) {
      if (!platformCfg.promptsDir) {
        error(
          errors,
          MANIFEST_PATH,
          `platform '${platformId}' defines prompts but has no promptsDir mapping`,
        );
      }
      for (const rel of spec.prompts) {
        const filePath = path.join(
          platformRoot,
          platformCfg.promptsDir || "prompts",
          rel,
        );
        if (!(await pathExists(filePath))) {
          error(errors, filePath, "prompt file listed in manifest is missing");
        }
      }
    }

    for (const skillId of skills) {
      const normalizedSkillId = normalizeSkillId(skillId);
      const canonicalSkill = canonicalMap.get(
        String(normalizedSkillId).toLowerCase(),
      );
      if (!canonicalSkill) {
        error(
          errors,
          MANIFEST_PATH,
          `skill '${skillId}' listed in manifest for ${platformId} is missing`,
        );
        continue;
      }
      const mirrorRoot = MIRROR_SKILL_ROOTS[platformId];
      const skillDir =
        mirrorRoot
          ? path.join(mirrorRoot, canonicalSkill.id)
          : path.join(canonicalSkill.root, canonicalSkill.id);
      const skillFile = path.join(skillDir, "SKILL.md");
      if (!(await pathExists(skillFile))) {
        error(errors, skillFile, `SKILL.md missing for skill '${skillId}'`);
        continue;
      }

      await validateSkillFile({
        filePath: skillFile,
        platform: platformId,
        errors,
        notes,
        canonicalMap,
      });
    }

    if (spec.rulesTemplate) {
      const rulesPath = path.join(BUNDLE_ROOT, spec.rulesTemplate);
      if (!(await pathExists(rulesPath))) {
        error(errors, rulesPath, "rulesTemplate path is missing");
      } else {
        const rulesRaw = await fs.readFile(rulesPath, "utf8");
        const headerMatch = rulesRaw.match(/^# Generated from (.+)$/m);
        if (headerMatch) {
          const sharedSources = headerMatch[1]
            .split("+")
            .map((item) => item.trim())
            .filter(Boolean);
          for (const sourcePath of sharedSources) {
            const resolved = path.join(BUNDLE_ROOT, sourcePath);
            if (!(await pathExists(resolved))) {
              error(
                errors,
                rulesPath,
                `generated rule header references missing source '${sourcePath}'`,
              );
            }
          }
        }
      }
    } else {
      error(
        errors,
        MANIFEST_PATH,
        `rulesTemplate missing for platform '${platformId}'`,
      );
    }

    const hookEntries = Array.isArray(spec.hooks) ? spec.hooks : [];
    for (const hookEntry of hookEntries) {
      const hookFile =
        typeof hookEntry === "string"
          ? hookEntry
          : typeof hookEntry?.file === "string"
            ? hookEntry.file
            : null;
      if (!hookFile) continue;
      const hookPath = path.join(
        BUNDLE_ROOT,
        "platforms",
        platformId,
        "hooks",
        hookFile,
      );
      if (!(await pathExists(hookPath))) {
        error(errors, hookPath, `hook template '${hookFile}' is missing`);
      }
    }
  }

  await validateSharedSourceAndGeneratedParity({
    manifest,
    errors,
    notes,
    skillSet: indexedSkillSet,
    subSkillSet: canonicalSubSkillSet,
  });
  await validateCanonicalSkillsStructure({ errors, canonicalMap });

  const summary = {
    manifest: MANIFEST_PATH,
    platforms: Object.keys(manifest.platforms || {}),
    skillCount: indexedSkillSet.size,
    strict: STRICT_MODE,
    errors: errors.length,
    warnings: warnings.length,
    notes: notes.length,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (warnings.length > 0) {
    console.log("\nWarnings:");
    for (const item of warnings.slice(0, 40)) {
      console.log(`- ${item}`);
    }
    if (warnings.length > 40) {
      console.log(`- ...and ${warnings.length - 40} more`);
    }
  }

  if (notes.length > 0) {
    console.log("\nNotes:");
    for (const item of notes.slice(0, 30)) {
      console.log(`- ${item}`);
    }
    if (notes.length > 30) {
      console.log(`- ...and ${notes.length - 30} more`);
    }
  }

  if (errors.length > 0) {
    console.error("\nErrors:");
    for (const item of errors) {
      console.error(`- ${item}`);
    }
    process.exit(1);
  }

  if (STRICT_MODE && warnings.length > 0) {
    console.error(`\nStrict mode failed: ${warnings.length} warning(s) found.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
