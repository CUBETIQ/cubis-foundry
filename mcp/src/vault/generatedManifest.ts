import { readFile } from "node:fs/promises";
import path from "node:path";
import type { SkillPointer } from "./types.js";
import { logger } from "../utils/logger.js";

interface GeneratedSkillManifestEntry {
  id: string;
  category: string;
  description?: string;
  keywords?: string[];
  triggers?: string[];
}

interface GeneratedSkillManifest {
  skills?: GeneratedSkillManifestEntry[];
}

function normalizeStringArray(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

export async function loadGeneratedSkillManifest(
  mcpPackageRoot: string,
): Promise<GeneratedSkillManifest | null> {
  const filePath = path.resolve(mcpPackageRoot, "generated", "mcp-manifest.json");

  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as GeneratedSkillManifest;
    if (!Array.isArray(parsed.skills)) {
      throw new Error("missing skills array");
    }
    return parsed;
  } catch (error) {
    logger.warn(
      `Generated skill manifest unavailable at ${filePath}: ${String(error)}`,
    );
    return null;
  }
}

export function mergeGeneratedSkillMetadata(
  scannedSkills: SkillPointer[],
  generatedManifest: GeneratedSkillManifest | null,
): SkillPointer[] {
  if (!generatedManifest?.skills?.length) {
    return scannedSkills;
  }

  const generatedById = new Map(
    generatedManifest.skills.map((entry) => [entry.id.toLowerCase(), entry]),
  );
  const missingIds = scannedSkills
    .filter((skill) => !generatedById.has(skill.id.toLowerCase()))
    .map((skill) => skill.id)
    .sort((a, b) => a.localeCompare(b));

  if (missingIds.length > 0) {
    logger.warn(
      `Generated skill manifest is missing ${missingIds.length} scanned skill(s): ${missingIds.slice(0, 8).join(", ")}${missingIds.length > 8 ? ", ..." : ""}. Run node scripts/generate-mcp-manifest.mjs to refresh the runtime index.`,
    );
  }

  return scannedSkills.map((skill) => {
    const generated = generatedById.get(skill.id.toLowerCase());
    if (!generated) return skill;

    return {
      ...skill,
      category: generated.category || skill.category,
      description: generated.description || skill.description,
      keywords: normalizeStringArray(generated.keywords),
      triggers: normalizeStringArray(generated.triggers),
    };
  });
}
