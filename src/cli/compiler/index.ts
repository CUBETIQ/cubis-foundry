import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import type { Catalog } from "../catalog/types.js";
import { readState } from "../state/index.js";
export { pipeline } from "./pipeline.js";
export type {
  Asset,
  CompiledAssets,
  CompilationContext,
  CompilationResult,
  EmitStageOutput,
  LoadStageOutput,
  RecompileReason,
  ResolveStageOutput,
  TransformStageOutput,
  ValidateStageOutput,
} from "./types.js";

import { pipeline } from "./pipeline.js";
import { loadStage, buildContext } from "./stages/load.js";
import { validateStage } from "./stages/validate.js";
import { resolveStage } from "./stages/resolve.js";
import { transformStage } from "./stages/transform.js";
import { emitStage } from "./stages/emit.js";
import { checksum, listFilesRecursive, readUtf8 } from "./projectors/utils.js";
import type {
  CompilationContext,
  CompilationResult,
  RecompileReason,
  RuntimeId,
  TransformStageOutput,
} from "./types.js";

const RECOMPILE_REASON_ORDER: RecompileReason[] = [
  "catalog-changed",
  "adapter-changed",
  "module-added",
  "module-removed",
  "module-modified",
  "output-dir-missing",
  "stale-asset",
];

function collectModuleClosure(catalog: Catalog, moduleId: string): Set<string> {
  const selected = new Set<string>();
  const queue = [moduleId];

  while (queue.length > 0) {
    const currentId = queue.pop()!;
    if (selected.has(currentId)) continue;

    const mod = catalog.modules.get(currentId);
    if (!mod) {
      throw new Error(`Module "${currentId}" not found in catalog.`);
    }

    selected.add(currentId);
    for (const dependencyId of mod.dependencies) {
      queue.push(dependencyId);
    }
  }

  return selected;
}

async function prepareCompilation(
  root: string,
  platform: RuntimeId,
  moduleId?: string,
): Promise<{
  ctx: CompilationContext;
  transformed: TransformStageOutput;
}> {
  const loadOutput = await loadStage(root, platform);
  const ctx: CompilationContext = buildContext(loadOutput);

  if (moduleId) {
    const selectedModuleIds = collectModuleClosure(ctx.catalog, moduleId);
    ctx.modules = [...ctx.catalog.modules.values()].filter((mod) => selectedModuleIds.has(mod.id));
  }

  const validateOutput = await validateStage(ctx);
  if (validateOutput.errors.length > 0) {
    throw new Error(`Validation failed:\n  ${validateOutput.errors.join("\n  ")}`);
  }

  const resolved = await resolveStage(ctx);
  const transformed = await transformStage(ctx, resolved, { repoRoot: root });
  return { ctx, transformed };
}

async function compileModuleForPlatform(
  root: string,
  moduleId: string,
  platform: RuntimeId,
): Promise<CompilationResult> {
  const startedAt = performance.now();
  const { ctx, transformed } = await prepareCompilation(root, platform, moduleId);
  const emitted = await emitStage(ctx, transformed, { repoRoot: root });

  return {
    platform,
    assets: emitted.assets,
    outputDir: emitted.outputDir,
    durationMs: Math.round(performance.now() - startedAt),
  };
}

function orderReasons(reasons: Set<RecompileReason>): RecompileReason[] {
  return RECOMPILE_REASON_ORDER.filter((reason) => reasons.has(reason));
}

function outputDirFor(root: string, platform: RuntimeId): string {
  return join(root, "generated", "runtime-assets", platform);
}

function detectStateDrift(
  compiledAssets: TransformStageOutput["assets"],
  platform: RuntimeId,
  root: string,
  reasons: Set<RecompileReason>,
): void {
  const outputDir = outputDirFor(root, platform);
  if (!existsSync(outputDir)) {
    reasons.add("output-dir-missing");
    return;
  }

  const compiledByPath = new Map(compiledAssets.map((asset) => [asset.path, asset]));
  for (const asset of compiledAssets) {
    const filePath = join(outputDir, asset.path);
    if (!existsSync(filePath) || checksum(readUtf8(filePath)) !== asset.checksum) {
      reasons.add("stale-asset");
      break;
    }
  }

  if (reasons.has("stale-asset")) return;

  const generatedFiles = listFilesRecursive(outputDir, () => true).map((filePath) =>
    relative(outputDir, filePath).replace(/\\/g, "/"),
  );
  if (generatedFiles.some((filePath) => !compiledByPath.has(filePath))) {
    reasons.add("stale-asset");
  }
}

/**
 * Compile all platforms (or a specific one) for the given foundry workspace root.
 *
 * @param root      Root of the foundry workspace.
 * @param platform  Optional target runtime.  Omit to compile all platforms.
 */
export async function compile(
  root: string,
  platform?: RuntimeId,
): Promise<CompilationResult[]> {
  return pipeline(root, platform);
}

/**
 * Compile a single module (plus its dependency closure) for one or more platforms.
 */
export async function compileModule(
  root: string,
  moduleId: string,
  platform?: RuntimeId,
): Promise<CompilationResult[]> {
  if (platform) {
    return [await compileModuleForPlatform(root, moduleId, platform)];
  }

  const loadOutput = await loadStage(root);
  const results: CompilationResult[] = [];

  for (const adapter of loadOutput.catalog.adapters.values()) {
    results.push(await compileModuleForPlatform(root, moduleId, adapter.platform));
  }

  return results;
}

/**
 * Compare the current catalog-derived assets against install state and the
 * generated runtime-asset directory to determine whether recompilation is needed.
 */
export async function needsRecompile(
  root: string,
  platform?: RuntimeId,
): Promise<RecompileReason[]> {
  const loadOutput = await loadStage(root, platform);
  const selectedPlatform = loadOutput.adapter.platform;
  const { ctx, transformed } = await prepareCompilation(root, selectedPlatform);
  const reasons = new Set<RecompileReason>();
  const state = readState(selectedPlatform);

  if (!state || state.version !== ctx.catalog.package.version) {
    reasons.add("catalog-changed");
  }

  if (state) {
    const compiledByPath = new Map(transformed.assets.map((asset) => [asset.path, asset]));
    const stateByPath = new Map(state.assets.map((asset) => [asset.path, asset]));

    if (transformed.assets.some((asset) => !stateByPath.has(asset.path))) {
      reasons.add("module-added");
    }

    if (state.assets.some((asset) => !compiledByPath.has(asset.path))) {
      reasons.add("module-removed");
    }

    if (
      transformed.assets.some((asset) => {
        const installed = stateByPath.get(asset.path);
        return installed && installed.checksum !== asset.checksum;
      })
    ) {
      reasons.add("module-modified");
    }
  }

  detectStateDrift(transformed.assets, selectedPlatform, root, reasons);
  return orderReasons(reasons);
}
