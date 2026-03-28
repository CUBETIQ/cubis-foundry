import { existsSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import type { CompilationContext, ResolveStageOutput, TransformStageOutput } from "../types.js";
import type { Catalog, Module, ModuleOutput } from "../../catalog/types.js";
import { renderTemplate } from "../templates/renderer.js";
import {
  bool,
  checksum,
  idFromMarkdownFile,
  listFilesRecursive,
  parseMarkdownDocument,
  readUtf8,
  renderOutputPattern,
  stringifyMarkdownDocument,
} from "../projectors/utils.js";
import { projectCodexAgent } from "../projectors/codex-agent.js";
import { projectGeminiCommand } from "../projectors/gemini-command.js";
import { projectCopilotAgent } from "../projectors/copilot-agent.js";
import { projectRules } from "../projectors/rules.js";
import { projectHooks } from "../projectors/hooks.js";

/**
 * Convert a catalog's Map fields into plain objects so templates
 * can access them via dot notation (e.g. catalog.package.version).
 */
function catalogToPlain(catalog: Catalog): Record<string, unknown> {
  return {
    package: Object.fromEntries(
      Object.entries(catalog.package).map(([k, v]) => [
        k,
        v instanceof Map ? Object.fromEntries(v) : v,
      ]),
    ),
    modules: Object.fromEntries(catalog.modules),
    adapters: Object.fromEntries(catalog.adapters),
    schemaVersion: catalog.schemaVersion,
  };
}

/**
 * Render a single output entry using the adapter's template registry.
 *
 * @param repoRoot   Absolute path to the foundry workspace root.
 * @param module     The module owning this output.
 * @param output     The output descriptor (path + platforms).
 * @param adapter    The platform adapter (provides template registry).
 * @param catalog    The compilation catalog (used as template context).
 * @param platform   Current runtime platform ID.
 * @returns An Asset, or null if the output doesn't apply to this platform.
 */
function renderOutput(
  repoRoot: string,
  module: Module,
  output: ModuleOutput,
  adapter: CompilationContext["adapter"],
  catalog: Catalog,
  platform: CompilationContext["platform"],
): { asset: { path: string; content: string; checksum: string } } | null {
  // Only generate for the current platform.
  if (!output.platforms.includes(platform)) return null;

  // Find the matching template entry in the adapter's registry.
  const templateEntry = adapter.contextDocs.templates.find(
    (t) => t.output === output.path,
  );
  if (!templateEntry) return null;

  // Read the template file from disk.
  // Source paths may be relative to repo root (e.g. foundry/modules/.../foo.md.j2)
  // or absolute (e.g. in test fixtures). Use isAbsolute() to disambiguate.
  const templatePath = templateEntry.source.startsWith("/")
    ? templateEntry.source
    : join(repoRoot, templateEntry.source);
  let templateSource: string;
  try {
    templateSource = readUtf8(templatePath);
  } catch {
    // Template file not found — skip this output with a warning.
    // A missing template is a configuration error; surfacing it helps
    // users diagnose why a module compiles but produces no output.
    console.warn(
      `[cbx compiler] WARNING: template not found: ${templatePath} ` +
        `(template "${templateEntry.source}" for output "${output.path}")`,
    );
    return null;
  }

  // Build the rendering context.
  const renderCtx = {
    module,
    catalog: catalogToPlain(catalog),
    platform,
  };

  const renderedContent = renderTemplate(templateSource, renderCtx);

  return {
    asset: {
      path: output.path,
      content: renderedContent,
      checksum: checksum(renderedContent),
    },
  };
}

function moduleOwnerId(modulesDir: string, filePath: string): string {
  return relative(modulesDir, filePath).replace(/\\/g, "/").split("/")[0]!;
}

type CanonicalSkill = {
  id: string;
  raw: string;
  ownerModuleId: string;
  moduleDir: string;
  frontmatter: Record<string, unknown>;
};

function discoverCanonicalSkills(
  repoRoot: string,
): CanonicalSkill[] {
  const modulesDir = join(repoRoot, "foundry", "modules");
  return listFilesRecursive(modulesDir, (filePath) => {
    if (!filePath.endsWith("SKILL.md")) return false;
    return dirname(filePath) !== join(modulesDir, "workflows");
  }).map((filePath) => ({
    id: basename(dirname(filePath)),
    raw: readUtf8(filePath),
    ownerModuleId: moduleOwnerId(modulesDir, filePath),
    moduleDir: dirname(filePath),
    frontmatter: parseMarkdownDocument(readUtf8(filePath)).frontmatter,
  }));
}

function extractSkillAliases(skill: CanonicalSkill): string[] {
  const metadata = skill.frontmatter.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return [];
  }

  const aliases = (metadata as Record<string, unknown>).aliases;
  if (!Array.isArray(aliases)) return [];

  const seen = new Set<string>();
  const values: string[] = [];
  for (const alias of aliases) {
    if (typeof alias !== "string") continue;
    const normalized = alias.trim();
    if (!normalized || normalized === skill.id || seen.has(normalized)) continue;
    seen.add(normalized);
    values.push(normalized);
  }
  return values;
}

function extractStringList(
  frontmatter: Record<string, unknown>,
  key: string,
): string[] | undefined {
  const value = frontmatter[key];
  if (!Array.isArray(value)) return undefined;
  const list = value.filter((item): item is string => typeof item === "string");
  return list.length > 0 ? list : undefined;
}

function buildAliasSkillMarkdown(skill: CanonicalSkill, aliasId: string): string {
  const description =
    `Compatibility alias for \`${skill.id}\`. Prefer \`${skill.id}\` for current guidance.`;
  const canonicalName =
    typeof skill.frontmatter.name === "string" && skill.frontmatter.name.trim()
      ? skill.frontmatter.name.trim()
      : skill.id;
  const title = aliasId
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  const frontmatter: Record<string, unknown> = {
    name: aliasId,
    description,
    triggers: [aliasId],
    whenToUse: `When older docs or prompts explicitly name ${aliasId}.`,
    priority: "secondary",
    metadata: {
      deprecated: true,
      replaced_by: skill.id,
      alias_of: skill.id,
    },
  };
  const domains = extractStringList(skill.frontmatter, "domains");
  if (domains) frontmatter.domains = domains;
  const compatibility = extractStringList(skill.frontmatter, "compatibility");
  if (compatibility) frontmatter.compatibility = compatibility;

  const body = [
    `# ${title}`,
    "",
    `This skill is now a compatibility alias. Use \`${canonicalName}\` for the current canonical flow.`,
    "",
    "## References",
    "",
    `- \`../${skill.id}/SKILL.md\``,
  ].join("\n");

  return stringifyMarkdownDocument(frontmatter, body);
}

function discoverSkillReferences(
  skill: CanonicalSkill,
): Array<{ relativePath: string; raw: string }> {
  const referencesDir = join(skill.moduleDir, "references");
  if (!existsSync(referencesDir)) return [];

  return listFilesRecursive(referencesDir, () => true).map((filePath) => ({
    relativePath: `references/${relative(referencesDir, filePath).replace(/\\/g, "/")}`,
    raw: readUtf8(filePath),
  }));
}

function discoverCanonicalWorkflows(
  repoRoot: string,
): Array<{ id: string; raw: string; ownerModuleId: string }> {
  const workflowRoot = join(repoRoot, "foundry", "modules", "workflows");
  return listFilesRecursive(workflowRoot, (filePath) => filePath.endsWith("workflow.md")).map(
    (filePath) => ({
      id: basename(dirname(filePath)),
      raw: readUtf8(filePath),
      ownerModuleId: "workflows-core",
    }),
  );
}

function discoverNestedAgents(
  repoRoot: string,
): Array<{ id: string; raw: string; ownerModuleId: string }> {
  const modulesDir = join(repoRoot, "foundry", "modules");
  return listFilesRecursive(modulesDir, (filePath) => {
    if (!filePath.endsWith(".md")) return false;
    return filePath.includes("/agents/");
  }).map((filePath) => ({
    id: idFromMarkdownFile(filePath),
    raw: readUtf8(filePath),
    ownerModuleId: moduleOwnerId(modulesDir, filePath),
  }));
}

function discoverRootAgents(
  repoRoot: string,
): Array<{ id: string; raw: string; ownerModuleId: string }> {
  const modulesDir = join(repoRoot, "foundry", "modules");
  return listFilesRecursive(modulesDir, (filePath) => filePath.endsWith("/agent.md")).map(
    (filePath) => ({
      id: basename(dirname(filePath)),
      raw: readUtf8(filePath),
      ownerModuleId: moduleOwnerId(modulesDir, filePath),
    }),
  );
}

function skillOutputDir(platform: CompilationContext["platform"], id: string): string | null {
  switch (platform) {
    case "claude":
      return `.claude/skills/${id}`;
    case "codex":
      return `.agents/skills/${id}`;
    case "gemini":
      return `.gemini/skills/${id}`;
    case "antigravity":
      return `.agents/skills/${id}`;
    case "copilot":
      return `.github/skills/${id}`;
    default:
      return null;
  }
}

function projectMarkdownRule(
  format: string,
  raw: string,
  id: string,
): string {
  switch (format) {
    case "markdown-copy":
    case "skill-markdown":
      return raw;
    case "codex-agent-toml":
      return projectCodexAgent(raw, id);
    case "copilot-agent-markdown":
      return projectCopilotAgent(raw);
    case "copilot-prompt-markdown": {
      const document = parseMarkdownDocument(raw);
      return `# Workflow Prompt: /${id}\n\n${document.body.trim()}\n`;
    }
    case "gemini-command-toml":
      return projectGeminiCommand(raw, id);
    default:
      throw new Error(`Unsupported projection format: ${format}`);
  }
}

function pushAsset(
  assets: TransformStageOutput["assets"],
  seen: Map<string, string>,
  path: string,
  content: string,
): void {
  const digest = checksum(content);
  const existing = seen.get(path);
  if (existing && existing !== digest) {
    throw new Error(`Duplicate asset path generated with conflicting content: ${path}`);
  }
  if (existing) return;
  seen.set(path, digest);
  assets.push({
    path,
    content,
    checksum: digest,
  });
}

function shouldProjectOwnedModule(
  activeModuleIds: Set<string>,
  ownerModuleId: string,
  umbrellaModuleId?: string,
): boolean {
  if (activeModuleIds.has(ownerModuleId)) return true;
  return umbrellaModuleId ? activeModuleIds.has(umbrellaModuleId) : false;
}

/**
 * Stage 4 — Transform resolved modules into platform-specific assets using
 * adapter templates and configuration.
 *
 * For each module with a `capability`, iterate its `outputs`.  When an
 * output's `platforms` list includes the current platform, look up the
 * matching template in the adapter's `contextDocs.templates`, read it from
 * disk, render it with `{ module, catalog, platform }` context, and emit
 * an `Asset`.
 */
export async function transformStage(
  ctx: CompilationContext,
  resolved: ResolveStageOutput,
  // repoRoot is not part of CompilationContext, so we accept it as an
  // optional parameter resolved by the pipeline layer.
  options?: { repoRoot?: string },
): Promise<TransformStageOutput> {
  const assets: TransformStageOutput["assets"] = [];
  const seenAssets = new Map<string, string>();
  const activeModuleIds = new Set(resolved.orderedModules.map((mod) => mod.id));

  // repoRoot is derived from the pipeline's call site; when not provided
  // we fall back to the current working directory.
  const repoRoot = options?.repoRoot ?? process.cwd();

  for (const mod of resolved.orderedModules) {
    if (!mod.capability) continue;

    for (const output of mod.capability.outputs) {
      const result = renderOutput(repoRoot, mod, output, ctx.adapter, ctx.catalog, ctx.platform);
      if (result) {
        pushAsset(assets, seenAssets, result.asset.path, result.asset.content);
      }
    }
  }

  for (const skill of discoverCanonicalSkills(repoRoot)) {
    if (!shouldProjectOwnedModule(activeModuleIds, skill.ownerModuleId, "skills-core")) continue;
    const outputDir = skillOutputDir(ctx.platform, skill.id);
    if (!outputDir) continue;
    pushAsset(assets, seenAssets, `${outputDir}/SKILL.md`, skill.raw);
    for (const reference of discoverSkillReferences(skill)) {
      pushAsset(
        assets,
        seenAssets,
        `${outputDir}/${reference.relativePath}`,
        reference.raw,
      );
    }

    for (const aliasId of extractSkillAliases(skill)) {
      const aliasOutputDir = skillOutputDir(ctx.platform, aliasId);
      if (!aliasOutputDir) continue;
      pushAsset(
        assets,
        seenAssets,
        `${aliasOutputDir}/SKILL.md`,
        buildAliasSkillMarkdown(skill, aliasId),
      );
    }
  }

  for (const workflow of discoverCanonicalWorkflows(repoRoot)) {
    if (!shouldProjectOwnedModule(activeModuleIds, workflow.ownerModuleId)) continue;
    for (const rawRule of ctx.adapter.workflows.projection) {
      const rule = rawRule as {
        format: string;
        outputPattern?: string;
        enabled?: boolean;
      };
      if (!bool(rule.enabled, true) || !rule.outputPattern) continue;
      const content = projectMarkdownRule(rule.format, workflow.raw, workflow.id);
      pushAsset(
        assets,
        seenAssets,
        renderOutputPattern(rule.outputPattern, workflow.id),
        content,
      );
    }
  }

  for (const agent of discoverNestedAgents(repoRoot)) {
    if (!shouldProjectOwnedModule(activeModuleIds, agent.ownerModuleId, "agents-core")) continue;
    for (const rawRule of ctx.adapter.specialists.projection) {
      const rule = rawRule as {
        format: string;
        outputPattern?: string;
        enabled?: boolean;
      };
      if (!bool(rule.enabled, true) || !rule.outputPattern) continue;
      const content = projectMarkdownRule(rule.format, agent.raw, agent.id);
      pushAsset(
        assets,
        seenAssets,
        renderOutputPattern(rule.outputPattern, agent.id),
        content,
      );
    }
  }

  for (const agent of discoverRootAgents(repoRoot)) {
    if (!shouldProjectOwnedModule(activeModuleIds, agent.ownerModuleId, "agents-core")) continue;
    for (const rawRule of ctx.adapter.agents?.projection ?? []) {
      const rule = rawRule as {
        format: string;
        outputPattern?: string;
        enabled?: boolean;
      };
      if (!bool(rule.enabled, true) || !rule.outputPattern) continue;
      const content = projectMarkdownRule(rule.format, agent.raw, agent.id);
      pushAsset(
        assets,
        seenAssets,
        renderOutputPattern(rule.outputPattern, agent.id),
        content,
      );
    }
  }

  if (
    activeModuleIds.has("rules-core")
    && ctx.adapter.rules.generate?.type === "markdown-merge"
  ) {
    const sourceDir = join(repoRoot, ctx.adapter.rules.generate.source);
    for (const asset of projectRules(
      ctx.platform,
      sourceDir,
      ctx.adapter.rules.generate.output,
    )) {
      pushAsset(assets, seenAssets, asset.path, asset.content);
    }
  }

  if (!activeModuleIds.has("hooks-core")) {
    return { assets };
  }

  for (const rawRule of ctx.adapter.hooks?.projection ?? []) {
    const rule = rawRule as {
      outputDir?: string;
      settingsPath?: string;
      enabled?: boolean;
    };
    if (!bool(rule.enabled, true)) continue;
    for (const asset of projectHooks(repoRoot, ctx.platform, rule)) {
      pushAsset(assets, seenAssets, asset.path, asset.content);
    }
  }

  return { assets };
}
