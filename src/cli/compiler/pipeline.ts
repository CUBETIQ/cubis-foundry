import { loadStage, buildContext } from "./stages/load.js";
import { validateStage } from "./stages/validate.js";
import { resolveStage } from "./stages/resolve.js";
import { transformStage } from "./stages/transform.js";
import { emitStage } from "./stages/emit.js";
import type { CompilationContext, CompilationResult, RuntimeId } from "./types.js";

/**
 * Run the full 5-stage compilation pipeline for one platform.
 */
async function compileForPlatform(
  root: string,
  platform: RuntimeId,
): Promise<CompilationResult> {
  const t0 = performance.now();

  // Stage 1: Load
  const loadOutput = await loadStage(root, platform);
  const ctx: CompilationContext = buildContext(loadOutput, root);

  // Stage 2: Validate
  const validateOutput = await validateStage(ctx);
  if (validateOutput.errors.length > 0) {
    throw new Error(
      `Validation failed:\n  ${validateOutput.errors.join("\n  ")}`,
    );
  }

  // Stage 3: Resolve
  const resolveOutput = await resolveStage(ctx);

  // Stage 4: Transform
  const transformOutput = await transformStage(ctx, resolveOutput, { repoRoot: root });

  // Stage 5: Emit
  const emitOutput = await emitStage(ctx, transformOutput, { repoRoot: root });

  const durationMs = Math.round(performance.now() - t0);

  return {
    platform,
    assets: emitOutput.assets,
    outputDir: emitOutput.outputDir,
    durationMs,
  };
}

/**
 * Orchestrate the 5-stage pipeline.
 *
 * @param root   Root of the foundry workspace.
 * @param platform  Optional target runtime.  If omitted, compiles for all platforms.
 * @returns One CompilationResult per platform.
 */
export async function pipeline(
  root: string,
  platform?: RuntimeId,
): Promise<CompilationResult[]> {
  if (platform) {
    // Single-platform compile.
    const result = await compileForPlatform(root, platform);
    return [result];
  }

  // Multi-platform: load catalog once, then compile each adapter.
  const { catalog } = await loadStage(root);
  const results: CompilationResult[] = [];

  for (const adapter of catalog.adapters.values()) {
    const result = await compileForPlatform(root, adapter.platform);
    results.push(result);
  }

  return results;
}
