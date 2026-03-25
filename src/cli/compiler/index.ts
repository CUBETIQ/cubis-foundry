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
import type { CompilationResult, RecompileReason, RuntimeId } from "./types.js";

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
 * Placeholder — returns an empty array.
 * Will be implemented in a later iteration.
 */
export async function compileModule(
  _root: string,
  _moduleId: string,
  _platform?: RuntimeId,
): Promise<CompilationResult[]> {
  return [];
}

/**
 * Placeholder — always returns an empty array of reasons.
 * Will be implemented in a later iteration.
 */
export async function needsRecompile(
  _root: string,
  _platform?: RuntimeId,
): Promise<RecompileReason[]> {
  return [];
}
