import type { CompilationContext, ResolveStageOutput, TransformStageOutput } from "../types.js";

/**
 * Stage 4 — Transform resolved modules into platform-specific assets using
 * adapter templates and configuration.
 * Currently a stub that returns an empty asset list.
 */
export async function transformStage(
  _ctx: CompilationContext,
  _resolved: ResolveStageOutput,
): Promise<TransformStageOutput> {
  return { assets: [] };
}
