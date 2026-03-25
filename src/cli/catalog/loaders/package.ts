import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { parse as parseYaml } from "yaml";
import { PackageManifestSchema } from "../schemas.js";
import type { PackageManifest } from "../types.js";

export async function loadPackage(root: string): Promise<PackageManifest> {
  const filePath = join(root, "foundry", "package.yaml");
  const raw = await readFile(filePath, "utf8");
  const parsed = parseYaml(raw);
  return PackageManifestSchema.parse(parsed) as PackageManifest;
}
