import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { CompilationContext, EmitStageOutput, TransformStageOutput } from "../types.js";

/**
 * Stage 5 — Emit assets to the filesystem.
 *
 * Writes each asset from `transformed.assets` to:
 *   `<repoRoot>/generated/runtime-assets/<platform>/<asset.path>`
 *
 * Parent directories are created as needed. Checksums are trusted from the
 * transform stage and are not recalculated here.
 */
export async function emitStage(
  ctx: CompilationContext,
  transformed: TransformStageOutput,
  options?: { repoRoot?: string },
): Promise<EmitStageOutput> {
  const repoRoot = options?.repoRoot ?? process.cwd();
  const outputDir = join(repoRoot, "generated", "runtime-assets", ctx.platform);

  for (const asset of transformed.assets) {
    const filePath = join(outputDir, asset.path);
    // Ensure parent directories exist before writing.
    mkdirSync(join(filePath, ".."), { recursive: true });
    writeFileSync(filePath, asset.content, "utf8");
  }

  return {
    assets: transformed.assets,
    outputDir,
  };
}
