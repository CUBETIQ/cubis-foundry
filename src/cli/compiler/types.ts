import type { Adapter, Catalog, Module, RuntimeId } from "../catalog/types.js";

export type { RuntimeId };

/**
 * Reasons why a recompile may be needed for a given asset.
 */
export type RecompileReason =
  | "catalog-changed"
  | "module-added"
  | "module-removed"
  | "module-modified"
  | "adapter-changed"
  | "output-dir-missing"
  | "stale-asset";

/**
 * A single generated file produced by the compiler.
 */
export interface Asset {
  /** Resolved output path relative to the platform output directory. */
  path: string;
  /** UTF-8 content of the file. */
  content: string;
  /** SHA-256 hex digest of content for change detection. */
  checksum: string;
}

/**
 * Results for one target platform.
 */
export interface CompiledAssets {
  platform: RuntimeId;
  assets: Asset[];
  outputDir: string;
}

/**
 * The shared context threaded through every pipeline stage.
 */
export interface CompilationContext {
  catalog: Catalog;
  platform: RuntimeId;
  adapter: Adapter;
  /** Modules that are active for this compilation (may be filtered by profile). */
  modules: Module[];
}

/**
 * The top-level result returned from a full compile() call.
 */
export interface CompilationResult {
  platform: RuntimeId;
  assets: Asset[];
  outputDir: string;
  /** How long the pipeline took in milliseconds. */
  durationMs: number;
}

/**
 * Individual stage outputs are tagged so the next stage can
 * progressively build up the context.
 */
export interface LoadStageOutput {
  catalog: Catalog;
  adapter: Adapter;
}

export interface ValidateStageOutput {
  // Validation errors are collected; an empty array means pass.
  errors: string[];
}

export interface ResolveStageOutput {
  orderedModules: Module[];
}

export interface TransformStageOutput {
  assets: Asset[];
}

export interface EmitStageOutput {
  assets: Asset[];
  outputDir: string;
}
