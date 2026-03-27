import { existsSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import type { CompilationContext, ValidateStageOutput } from "../types.js";
import { readUtf8 } from "../projectors/utils.js";

const SKILL_REFERENCE_PATTERNS = [
  /`((?:\.\.?\/|references\/|agents\/)[^`\n]+?\.md)`/g,
  /\[[^\]]+\]\(((?:\.\.?\/|references\/|agents\/)[^)\n]+?\.md)\)/g,
];

function collectSkillMarkdownReferences(content: string): string[] {
  const references = new Set<string>();
  for (const pattern of SKILL_REFERENCE_PATTERNS) {
    for (const match of content.matchAll(pattern)) {
      if (match[1]) references.add(match[1]);
    }
  }
  return [...references];
}

function shouldValidateModuleFile(relativePath: string): boolean {
  return (
    relativePath === "SKILL.md" ||
    relativePath.startsWith("templates/") ||
    relativePath.startsWith("references/") ||
    relativePath.startsWith("agents/")
  );
}

function collectModuleAuthoringFiles(moduleDir: string): string[] {
  const files: string[] = [];
  const queue = [moduleDir];

  while (queue.length > 0) {
    const currentDir = queue.pop()!;
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      const entryPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        queue.push(entryPath);
        continue;
      }

      const relativePath = relative(moduleDir, entryPath).replace(/\\/g, "/");
      if (shouldValidateModuleFile(relativePath)) {
        files.push(entryPath);
      }
    }
  }

  return files;
}

function resolveReferenceBaseDir(moduleDir: string, authoringFile: string): string {
  const relativePath = relative(moduleDir, authoringFile).replace(/\\/g, "/");
  if (relativePath.startsWith("templates/")) {
    return moduleDir;
  }
  return dirname(authoringFile);
}

/**
 * Stage 2 — Validate the compilation context.
 */
export async function validateStage(
  ctx: CompilationContext,
): Promise<ValidateStageOutput> {
  if (!ctx.repoRoot) return { errors: [] };

  const modulesDir = join(ctx.repoRoot, "foundry", "modules");
  const errors = new Set<string>();

  for (const module of ctx.modules) {
    const moduleDir = join(modulesDir, module.id);
    const skillPath = join(moduleDir, "SKILL.md");
    if (!existsSync(skillPath)) continue;

    for (const authoringFile of collectModuleAuthoringFiles(moduleDir)) {
      const authoringDir = resolveReferenceBaseDir(moduleDir, authoringFile);
      const references = collectSkillMarkdownReferences(readUtf8(authoringFile));
      for (const referencePath of references) {
        const targetPath = resolve(authoringDir, referencePath);
        if (!existsSync(targetPath)) {
          errors.add(
            `Broken module reference in ${relative(ctx.repoRoot, authoringFile).replace(/\\/g, "/")}: ${referencePath}`,
          );
        }
      }
    }
  }

  return { errors: [...errors] };
}
