import path from "node:path";
import { fileURLToPath } from "node:url";
import { promises as fs } from "node:fs";
import {
  deriveDescriptor,
  getMetadataBlock,
  parseFrontmatter,
} from "./skill-catalog.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ROOT = path.resolve(__dirname, "..", "..");
export const SKILLS_ROOT = path.join(ROOT, "workflows", "skills");
export const SKILLS_GENERATED_ROOT = path.join(SKILLS_ROOT, "generated");
export const SKILL_PROFILE_FILES = {
  core: path.join(SKILLS_ROOT, "catalogs", "core.json"),
  "web-backend": path.join(SKILLS_ROOT, "catalogs", "web-backend.json"),
};
export const EXCLUDED_TOP_LEVEL_SKILL_DIRS = new Set(["catalogs", "generated"]);

export async function pathExists(target) {
  try {
    await fs.stat(target);
    return true;
  } catch {
    return false;
  }
}

export async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

export async function listSkillDirs(rootDir) {
  if (!(await pathExists(rootDir))) return [];
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

export async function listTopLevelSkillDirs(rootDir = SKILLS_ROOT) {
  const entries = await listSkillDirs(rootDir);
  return entries.filter((name) => !EXCLUDED_TOP_LEVEL_SKILL_DIRS.has(name));
}

export async function listFilesRecursive(rootDir, predicate = () => true) {
  const files = [];
  const queue = [rootDir];
  while (queue.length > 0) {
    const current = queue.pop();
    if (!current || !(await pathExists(current))) continue;
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }
      if (entry.isFile() && predicate(fullPath, entry.name)) {
        files.push(fullPath);
      }
    }
  }
  return files.sort((a, b) => a.localeCompare(b));
}

export async function collectSkillFiles(skillRoot) {
  const files = await listFilesRecursive(
    skillRoot,
    (_filePath, fileName) => fileName === "SKILL.md",
  );
  const skillFiles = [];
  for (const filePath of files) {
    skillFiles.push({
      skillDir: path.dirname(filePath),
      filePath,
      rawContent: await fs.readFile(filePath, "utf8"),
    });
  }
  return skillFiles.sort((a, b) => a.filePath.localeCompare(b.filePath));
}

export async function listMarkdownFiles(rootDir) {
  return listFilesRecursive(
    rootDir,
    (_filePath, fileName) => fileName.endsWith(".md"),
  );
}

export async function readSkillProfiles() {
  const core = await readJson(SKILL_PROFILE_FILES.core);
  const webBackend = await readJson(SKILL_PROFILE_FILES["web-backend"]);
  return {
    coreIds: new Set((core.skills || []).map((item) => String(item))),
    webBackendIds: new Set((webBackend.skills || []).map((item) => String(item))),
  };
}

function normalizeLower(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function isWrapperSkill(skillId, metadata = {}) {
  const lowerId = normalizeLower(skillId);
  if (lowerId.startsWith("workflow-") || lowerId.startsWith("agent-")) {
    return true;
  }

  const wrapperKind = normalizeLower(metadata.wrapper);
  return wrapperKind === "workflow" || wrapperKind === "agent";
}

export async function buildCanonicalSkillSourceMap(roots = [SKILLS_ROOT]) {
  const sourceById = new Map();

  for (const root of roots) {
    if (!(await pathExists(root))) continue;
    const ids = await listSkillDirs(root);
    for (const skillId of ids) {
      const source = path.join(root, skillId);
      const skillFile = path.join(source, "SKILL.md");
      if (!(await pathExists(skillFile))) continue;
      sourceById.set(skillId.toLowerCase(), { id: skillId, source });
    }
  }

  return sourceById;
}

export async function collectCanonicalDescriptors() {
  const { coreIds, webBackendIds } = await readSkillProfiles();
  const descriptors = [];

  for (const skillId of await listTopLevelSkillDirs()) {
    const skillRoot = path.join(SKILLS_ROOT, skillId);
    const files = await collectSkillFiles(skillRoot);
    for (const file of files) {
      descriptors.push(
        deriveDescriptor({
          skillFile: file,
          skillsRoot: SKILLS_ROOT,
          coreProfileIds: coreIds,
          webBackendProfileIds: webBackendIds,
        }),
      );
    }
  }

  return descriptors;
}

export async function buildSkillsIndexRows({ roots, indexPathPrefix }) {
  const rowById = new Map();
  const { coreIds, webBackendIds } = await readSkillProfiles();
  const canonicalSourceById = await buildCanonicalSkillSourceMap([SKILLS_ROOT]);
  const canonicalRoot = path.resolve(SKILLS_ROOT);

  for (const skillsRoot of roots) {
    if (!(await pathExists(skillsRoot))) continue;
    const resolvedSkillsRoot = path.resolve(skillsRoot);
    const useCanonicalDescriptor = resolvedSkillsRoot !== canonicalRoot;

    for (const skillFile of await listFilesRecursive(
      skillsRoot,
      (_filePath, fileName) => fileName === "SKILL.md",
    )) {
      const skillDir = path.dirname(skillFile);
      const skillId = path.basename(skillDir);
      const rawContent = await fs.readFile(skillFile, "utf8");
      let descriptorFile = {
        skillDir,
        filePath: skillFile,
        rawContent,
      };

      if (useCanonicalDescriptor) {
        const canonicalSource = canonicalSourceById.get(skillId.toLowerCase());
        if (canonicalSource) {
          const canonicalSkillFile = path.join(canonicalSource.source, "SKILL.md");
          if (await pathExists(canonicalSkillFile)) {
            descriptorFile = {
              skillDir: canonicalSource.source,
              filePath: canonicalSkillFile,
              rawContent: await fs.readFile(canonicalSkillFile, "utf8"),
            };
          }
        }
      }

      const metadata = getMetadataBlock(parseFrontmatter(descriptorFile.rawContent).raw);

      if (isWrapperSkill(skillId, metadata)) {
        continue;
      }

      const descriptor = deriveDescriptor({
        skillFile: descriptorFile,
        skillsRoot: useCanonicalDescriptor ? SKILLS_ROOT : skillsRoot,
        coreProfileIds: coreIds,
        webBackendProfileIds: webBackendIds,
      });

      rowById.set(String(skillId).toLowerCase(), {
        id: skillId,
        package_id: descriptor.package_id,
        catalog_id: descriptor.catalog_id,
        kind: descriptor.kind,
        name: descriptor.name,
        canonical: descriptor.canonical,
        canonical_id: descriptor.canonical_id,
        deprecated: descriptor.deprecated,
        replaced_by: descriptor.replaced_by,
        aliases: descriptor.aliases,
        category: descriptor.category,
        layer: descriptor.layer,
        maturity: descriptor.maturity,
        tier: descriptor.tier,
        tags: descriptor.tags,
        path: `${indexPathPrefix}/${path.relative(skillsRoot, skillFile).replaceAll(path.sep, "/")}`,
        description: descriptor.description,
        triggers: descriptor.triggers,
      });
    }
  }

  return [...rowById.values()].sort((a, b) => {
    const nameCmp = a.name.localeCompare(b.name);
    if (nameCmp !== 0) return nameCmp;
    return a.path.localeCompare(b.path);
  });
}
