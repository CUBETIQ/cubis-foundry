import { existsSync } from "node:fs";
import { join } from "node:path";

interface ResolveInstallSourcePathArgs {
  repoRoot: string;
  bundleId: string;
  platform: string;
  relativeSourcePath: string;
  workspaceRelativeDestinationPath?: string | null;
  workspaceRelativeDestinationPaths?: string[] | null;
  repoRelativeFallbackPath?: string | null;
  repoRelativeFallbackPaths?: string[] | null;
}

export function resolveInstallSourcePath({
  repoRoot,
  bundleId,
  platform,
  relativeSourcePath,
  workspaceRelativeDestinationPath = null,
  workspaceRelativeDestinationPaths = null,
  repoRelativeFallbackPath = null,
  repoRelativeFallbackPaths = null,
}: ResolveInstallSourcePathArgs): string {
  const bundleSource = join(
    repoRoot,
    "workflows",
    "workflows",
    bundleId,
    "platforms",
    platform,
    relativeSourcePath,
  );

  if (existsSync(bundleSource)) {
    return bundleSource;
  }

  const repoCandidates = [
    ...(repoRelativeFallbackPath ? [repoRelativeFallbackPath] : []),
    ...((repoRelativeFallbackPaths || []).filter(Boolean) as string[]),
  ];

  for (const repoCandidate of repoCandidates) {
    const repoSource = join(repoRoot, repoCandidate);
    if (existsSync(repoSource)) {
      return repoSource;
    }
  }

  return bundleSource;
}
