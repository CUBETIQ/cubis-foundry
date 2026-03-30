import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { packageRoot } from "./pathing.js";

async function pathExists(targetPath: string) {
  try {
    await readFile(targetPath);
    return true;
  } catch {
    try {
      await readdir(targetPath);
      return true;
    } catch {
      return false;
    }
  }
}

export async function listCanonicalSkillIds(repoRoot = packageRoot()) {
  const modulesRoot = path.join(repoRoot, "foundry", "modules");
  if (!(await pathExists(modulesRoot))) return [];
  const entries = await readdir(modulesRoot, { withFileTypes: true });
  const skillIds: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const skillFile = path.join(modulesRoot, entry.name, "SKILL.md");
    if (!(await pathExists(skillFile))) continue;
    skillIds.push(entry.name);
  }
  return skillIds.sort((a, b) => a.localeCompare(b));
}

export async function resolveSkillProfileIds(
  profile: string,
  repoRoot = packageRoot(),
) {
  const canonicalSkillIds = await listCanonicalSkillIds(repoRoot);
  const canonicalSet = new Set(canonicalSkillIds.map((item) => item.toLowerCase()));

  if (profile === "full") {
    return canonicalSkillIds;
  }

  const profilePath = path.join(
    repoRoot,
    "foundry",
    "catalogs",
    "skill-profiles",
    `${profile}.json`,
  );
  if (!(await pathExists(profilePath))) return [];

  let parsed: { skills?: string[] } | null = null;
  try {
    parsed = JSON.parse(await readFile(profilePath, "utf8"));
  } catch {
    return [];
  }

  const deduped: string[] = [];
  const seen = new Set<string>();
  for (const rawSkillId of parsed?.skills || []) {
    const skillId = String(rawSkillId || "").trim();
    if (!skillId) continue;
    const lowered = skillId.toLowerCase();
    if (!canonicalSet.has(lowered) || seen.has(lowered)) continue;
    seen.add(lowered);
    deduped.push(skillId);
  }

  return deduped;
}
