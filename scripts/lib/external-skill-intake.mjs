import path from "node:path";
import { promises as fs } from "node:fs";
import {
  ROOT,
  SKILLS_GENERATED_ROOT,
  pathExists,
} from "./skill-inventory.mjs";

export const ANTHROPIC_INTAKE_SOURCE_FILE = path.join(
  ROOT,
  "workflows",
  "skills",
  "catalogs",
  "anthropic-intake.json",
);

export const ANTHROPIC_INTAKE_REPORT_FILE = path.join(
  SKILLS_GENERATED_ROOT,
  "anthropic-skill-intake.json",
);

export const ANTHROPIC_SKILL_INTAKE_OUTPUT = ANTHROPIC_INTAKE_REPORT_FILE;

const ALLOWED_INTAKE_STATUSES = new Set([
  "keep",
  "adapt",
  "reject",
  "legal-review",
]);

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeStatus(value) {
  return normalizeString(value).toLowerCase();
}

function normalizeCanonicalSkillId(value) {
  const normalized = normalizeString(value);
  return normalized || null;
}

function normalizeEntry(entry, index) {
  if (!entry || typeof entry !== "object") {
    throw new Error(`Anthropic intake entry ${index} must be an object.`);
  }

  const externalId = normalizeString(entry.external_id);
  const status = normalizeStatus(entry.status);
  const canonicalSkillId = normalizeCanonicalSkillId(entry.canonical_skill_id);
  const sourcePath = normalizeString(entry.source_path);
  const reason = normalizeString(entry.reason);
  const license = normalizeString(entry.license);

  if (!externalId) {
    throw new Error(`Anthropic intake entry ${index} is missing external_id.`);
  }
  if (!ALLOWED_INTAKE_STATUSES.has(status)) {
    throw new Error(
      `Anthropic intake entry '${externalId}' has invalid status '${entry.status}'.`,
    );
  }
  if ((status === "keep" || status === "adapt") && !canonicalSkillId) {
    throw new Error(
      `Anthropic intake entry '${externalId}' must set canonical_skill_id for status '${status}'.`,
    );
  }
  if ((status === "reject" || status === "legal-review") && canonicalSkillId) {
    throw new Error(
      `Anthropic intake entry '${externalId}' must not set canonical_skill_id for status '${status}'.`,
    );
  }
  if (!sourcePath) {
    throw new Error(`Anthropic intake entry '${externalId}' is missing source_path.`);
  }
  if (!reason) {
    throw new Error(`Anthropic intake entry '${externalId}' is missing reason.`);
  }

  return {
    external_id: externalId,
    status,
    canonical_skill_id: canonicalSkillId,
    source_path: sourcePath,
    license,
    reason,
  };
}

export async function readAnthropicSkillIntakeManifest() {
  if (!(await pathExists(ANTHROPIC_INTAKE_SOURCE_FILE))) {
    return {
      source: null,
      entries: [],
    };
  }

  const parsed = JSON.parse(await fs.readFile(ANTHROPIC_INTAKE_SOURCE_FILE, "utf8"));
  const rawEntries = Array.isArray(parsed.entries) ? parsed.entries : [];
  const normalizedEntries = rawEntries.map((entry, index) =>
    normalizeEntry(entry, index),
  );

  const seen = new Set();
  for (const entry of normalizedEntries) {
    const key = entry.external_id.toLowerCase();
    if (seen.has(key)) {
      throw new Error(`Duplicate Anthropic intake entry '${entry.external_id}'.`);
    }
    seen.add(key);

    const absoluteSourcePath = path.join(ROOT, entry.source_path);
    if (!(await pathExists(absoluteSourcePath))) {
      throw new Error(
        `Anthropic intake entry '${entry.external_id}' points to a missing source file: ${entry.source_path}`,
      );
    }
  }

  return {
    source:
      parsed.source && typeof parsed.source === "object"
        ? {
            id: normalizeString(parsed.source.id),
            label: normalizeString(parsed.source.label),
            root: normalizeString(parsed.source.root),
            notes: normalizeString(parsed.source.notes),
          }
        : null,
    entries: normalizedEntries,
  };
}

export async function readAnthropicSkillIntake() {
  return readAnthropicSkillIntakeManifest();
}

function mergeUniqueStrings(baseValues = [], extraValues = []) {
  return [...new Set([...baseValues, ...extraValues].filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function aliasSignalsForExternalId(externalId) {
  const normalized = normalizeString(externalId).toLowerCase();
  if (!normalized) return [];
  const signals = [normalized];
  if (normalized.includes("-")) {
    signals.push(normalized.replace(/-/g, " "));
  }
  return [...new Set(signals)];
}

export function buildAnthropicAliasMap(intakeManifest) {
  const aliasMap = new Map();
  const manifestEntries = Array.isArray(intakeManifest?.entries)
    ? intakeManifest.entries
    : [];

  for (const entry of manifestEntries) {
    if (entry.status !== "keep" && entry.status !== "adapt") continue;
    const canonicalId = normalizeString(entry.canonical_skill_id).toLowerCase();
    if (!canonicalId) continue;
    if (normalizeString(entry.external_id).toLowerCase() === canonicalId) continue;
    aliasMap.set(
      canonicalId,
      mergeUniqueStrings(
        aliasMap.get(canonicalId) || [],
        aliasSignalsForExternalId(entry.external_id),
      ),
    );
  }

  return aliasMap;
}

export function applyAnthropicSkillIntake(items, intakeManifest) {
  const aliasMap = buildAnthropicAliasMap(intakeManifest);
  if (aliasMap.size === 0) return items;

  const targetById = new Map();
  for (const item of items) {
    const key = normalizeString(item.package_id || item.id).toLowerCase();
    if (!key) continue;
    targetById.set(key, item);
  }

  for (const [canonicalKey, aliasSignals] of aliasMap.entries()) {
    const target = targetById.get(canonicalKey);
    if (!target) {
      throw new Error(
        `Anthropic intake mapping references missing canonical skill '${canonicalKey}'.`,
      );
    }
    target.aliases = mergeUniqueStrings(target.aliases, aliasSignals);
    if (Array.isArray(target.tags)) {
      target.tags = mergeUniqueStrings(target.tags, aliasSignals);
    }
    if (Array.isArray(target.triggers)) {
      target.triggers = mergeUniqueStrings(target.triggers, aliasSignals);
    }
  }

  return items;
}

export function applyAnthropicAliasesToRows(rows, intakeManifest) {
  return applyAnthropicSkillIntake(rows, intakeManifest);
}

export function applyAnthropicAliasesToDescriptors(descriptors, intakeManifest) {
  return applyAnthropicSkillIntake(descriptors, intakeManifest);
}

export function buildAnthropicSkillIntakeReport(input) {
  let intakeManifest = null;
  let canonicalSkillIds = [];

  if (input && typeof input === "object" && Array.isArray(input.entries)) {
    intakeManifest = input;
  } else if (input && typeof input === "object") {
    intakeManifest = input.intakeManifest || null;
    canonicalSkillIds = Array.isArray(input.canonicalSkillIds)
      ? input.canonicalSkillIds
      : [];
  }

  const entries = Array.isArray(intakeManifest?.entries)
    ? intakeManifest.entries
    : [];
  const canonicalIds = new Set(
    [...(canonicalSkillIds || [])].map((item) => normalizeString(item).toLowerCase()),
  );

  const normalizedEntries = entries.map((entry) => {
    const canonicalId = entry.canonical_skill_id;
    const canonicalExists = canonicalId
      ? canonicalIds.has(canonicalId.toLowerCase())
      : true;
    const aliasApplied =
      (entry.status === "keep" || entry.status === "adapt") &&
      canonicalId &&
      entry.external_id.toLowerCase() !== canonicalId.toLowerCase() &&
      canonicalExists;

    return {
      external_id: entry.external_id,
      status: entry.status,
      canonical_skill_id: canonicalId,
      source_path: entry.source_path,
      license: entry.license,
      reason: entry.reason,
      source_exists: true,
      canonical_skill_exists: canonicalExists,
      action:
        entry.status === "reject" || entry.status === "legal-review"
          ? "not-imported"
          : aliasApplied
            ? "alias-added"
            : "kept-no-alias-needed",
    };
  });

  const summary = normalizedEntries.reduce(
    (acc, entry) => {
      acc[entry.status] += 1;
      if (entry.action === "alias-added") acc.aliasApplied += 1;
      return acc;
    },
    {
      total: normalizedEntries.length,
      keep: 0,
      adapt: 0,
      reject: 0,
      "legal-review": 0,
      aliasApplied: 0,
      adoptedAliases: 0,
    },
  );
  summary.adoptedAliases = summary.aliasApplied;

  return {
    $schema: "cubis-foundry-external-skill-intake-v1",
    generatedAt: "1970-01-01T00:00:00.000Z",
    source: intakeManifest?.source || null,
    summary,
    entries: normalizedEntries.sort((a, b) =>
      a.external_id.localeCompare(b.external_id),
    ),
  };
}
