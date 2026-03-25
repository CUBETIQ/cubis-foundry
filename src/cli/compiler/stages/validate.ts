import type { CompilationContext, ValidateStageOutput } from "../types.js";

/**
 * Stage 2 — Validate the compilation context.
 * Currently a stub that always passes.
 */
export async function validateStage(
  _ctx: CompilationContext,
): Promise<ValidateStageOutput> {
  return { errors: [] };
}
