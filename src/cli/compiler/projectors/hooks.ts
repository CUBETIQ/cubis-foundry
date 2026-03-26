import { join } from "node:path";
import { checksum, listFilesRecursive, readUtf8 } from "./utils.js";

interface HookProjectionRule {
  outputDir?: string;
  settingsPath?: string;
}

interface HookAsset {
  path: string;
  content: string;
  checksum: string;
}

export function projectHooks(
  repoRoot: string,
  platform: string,
  rule: HookProjectionRule,
): HookAsset[] {
  if (!rule.outputDir) return [];

  const hooksRoot = join(repoRoot, "foundry", "modules", "hooks-core", "hooks");
  const descriptor = JSON.parse(readUtf8(join(hooksRoot, "hooks.json"))) as Record<
    string,
    {
      manifest?: unknown;
      settings?: unknown;
    }
  >;
  const platformConfig = descriptor[platform];
  if (!platformConfig) return [];

  const assets: HookAsset[] = [];
  const docs = ["pre-tool.md", "post-tool.md"];
  for (const docName of docs) {
    const content = readUtf8(join(hooksRoot, docName));
    assets.push({
      path: `${rule.outputDir}/${docName}`,
      content,
      checksum: checksum(content),
    });
  }

  if (platformConfig.manifest) {
    const manifest = `${JSON.stringify(platformConfig.manifest, null, 2)}\n`;
    assets.push({
      path: `${rule.outputDir}/hooks.json`,
      content: manifest,
      checksum: checksum(manifest),
    });
  }

  const scriptDir = join(hooksRoot, "scripts");
  const scripts = listFilesRecursive(scriptDir, (filePath) => filePath.endsWith(".mjs"));
  for (const filePath of scripts) {
    const relative = filePath.slice(scriptDir.length + 1);
    const content = readUtf8(filePath);
    assets.push({
      path: `${rule.outputDir}/scripts/${relative}`,
      content,
      checksum: checksum(content),
    });
  }

  if (rule.settingsPath && platformConfig.settings) {
    const settings = `${JSON.stringify(platformConfig.settings, null, 2)}\n`;
    assets.push({
      path: rule.settingsPath,
      content: settings,
      checksum: checksum(settings),
    });
  }

  return assets;
}
