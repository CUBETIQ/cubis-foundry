import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import type { Asset } from "../compiler/types.js";

/**
 * Copies compiled assets to a temporary staging directory.
 *
 * @param assets   The assets to stage (from a single platform's CompiledAssets).
 * @param platform The platform identifier (used to name the subdirectory).
 * @returns The absolute path to the staging directory, e.g.
 *          /tmp/foundry-staging/<uuid>/<platform>/
 */
export function copyCompiledAssets(
  assets: Asset[],
  platform: string,
): string {
  // e.g. /tmp/foundry-staging/abc123/claude/
  const stagingDir = join(
    tmpdir(),
    "foundry-staging",
    randomUUID(),
    platform,
  );

  mkdirSync(stagingDir, { recursive: true });

  for (const asset of assets) {
    const filePath = join(stagingDir, asset.path);
    // Ensure parent directory exists (assets may be in subdirectories)
    mkdirSync(join(filePath, ".."), { recursive: true });
    writeFileSync(filePath, asset.content, "utf8");
  }

  return stagingDir;
}
