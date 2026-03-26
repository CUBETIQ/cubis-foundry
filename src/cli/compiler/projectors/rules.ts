import { join } from "node:path";
import { checksum, listFilesRecursive, readUtf8 } from "./utils.js";

interface RuleAsset {
  path: string;
  content: string;
  checksum: string;
}

export function projectRules(
  platform: string,
  sourceDir: string,
  outputPath: string,
): RuleAsset[] {
  const commonPath = join(sourceDir, "common.md");
  const platformPath = join(sourceDir, `${platform}.md`);
  const common = readUtf8(commonPath).trim();
  const platformSpecific = readUtf8(platformPath).trim();
  const merged = `${common}\n\n${platformSpecific}\n`;

  const assets: RuleAsset[] = [
    {
      path: outputPath,
      content: merged,
      checksum: checksum(merged),
    },
  ];

  if (platform === "claude") {
    const ruleFiles = listFilesRecursive(sourceDir, (filePath) => filePath.endsWith(".md"));
    for (const filePath of ruleFiles) {
      const content = readUtf8(filePath);
      const targetName = filePath.slice(sourceDir.length + 1);
      assets.push({
        path: `.claude/rules.d/${targetName}`,
        content,
        checksum: checksum(content),
      });
    }
  }

  return assets;
}
