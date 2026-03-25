import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { CompilationContext, ResolveStageOutput, TransformStageOutput } from "../types.js";
import type { Catalog, Module, ModuleOutput } from "../../catalog/types.js";
import { renderTemplate } from "../templates/renderer.js";

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
 * Compute a SHA-256 hex digest of a string.
 */
function checksum(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
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
    templateSource = readFileSync(templatePath, "utf8");
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

  // repoRoot is derived from the pipeline's call site; when not provided
  // we fall back to the current working directory.
  const repoRoot = options?.repoRoot ?? process.cwd();

  for (const mod of resolved.orderedModules) {
    if (!mod.capability) continue;

    for (const output of mod.capability.outputs) {
      const result = renderOutput(repoRoot, mod, output, ctx.adapter, ctx.catalog, ctx.platform);
      if (result) {
        assets.push(result.asset);
      }
    }
  }

  return { assets };
}
