import type { CompilationContext, EmitStageOutput, TransformStageOutput } from "../types.js";

/**
 * Stage 5 — Emit assets to the filesystem.
 * Currently a stub that returns the assets unchanged.
 */
export async function emitStage(
  _ctx: CompilationContext,
  transformed: TransformStageOutput,
): Promise<EmitStageOutput> {
  return {
    assets: transformed.assets,
    outputDir: "", // Will be derived from adapter config in a later iteration.
  };
}
