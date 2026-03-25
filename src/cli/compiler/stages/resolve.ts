import type { CompilationContext, ResolveStageOutput } from "../types.js";

/**
 * Stage 3 — Resolve module dependencies and produce a stable execution order.
 * Currently a stub that returns modules in natural Map iteration order.
 */
export async function resolveStage(
  ctx: CompilationContext,
): Promise<ResolveStageOutput> {
  return { orderedModules: ctx.modules };
}
