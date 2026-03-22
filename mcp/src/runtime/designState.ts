import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";

export interface DesignStateSummary {
  ready: boolean;
  requiredPaths: string[];
  referencePaths: string[];
  detail: string;
}

async function collectMarkdownFiles(dirPath: string): Promise<string[]> {
  if (!existsSync(dirPath)) {
    return [];
  }
  const entries = await readdir(dirPath, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const resolved = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectMarkdownFiles(resolved)));
      continue;
    }
    if (entry.isFile() && /\.(md|mdx|txt)$/i.test(entry.name)) {
      files.push(resolved);
    }
  }
  return files;
}

export async function inspectDesignState(
  workspaceRoot = process.cwd(),
): Promise<DesignStateSummary> {
  const requiredPaths = [
    path.join(workspaceRoot, "docs", "foundation", "DESIGN.md"),
  ];
  const overlayRoots = [
    path.join(workspaceRoot, "docs", "foundation", "design", "pages"),
    path.join(workspaceRoot, "docs", "foundation", "design", "flows"),
    path.join(workspaceRoot, "docs", "foundation", "design", "mobile"),
  ];
  const requiredExisting = requiredPaths.filter((filePath) => existsSync(filePath));
  const overlayFiles = (
    await Promise.all(overlayRoots.map((root) => collectMarkdownFiles(root)))
  ).flat();
  const referencePaths = [...requiredExisting, ...overlayFiles];
  const ready = requiredExisting.length > 0 || overlayFiles.length > 0;

  return {
    ready,
    requiredPaths,
    referencePaths,
    detail: ready
      ? `Found ${referencePaths.length} design reference file(s).`
      : "Missing canonical design state. Add docs/foundation/DESIGN.md or design overlay files before Stitch generation.",
  };
}
