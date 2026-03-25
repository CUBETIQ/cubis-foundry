import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { parse as parseYaml } from "yaml";
import { AdapterSchema, RuntimeIdSchema } from "../schemas.js";
import type { Adapter, RuntimeId } from "../types.js";

const PLATFORMS = RuntimeIdSchema.options;

export async function loadAdapter(
  root: string,
  platform: RuntimeId,
): Promise<Adapter | null> {
  const filePath = join(root, "foundry", "adapters", `${platform}.yaml`);
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = parseYaml(raw);
    return AdapterSchema.parse(parsed) as Adapter;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return null;
    }
    throw error;
  }
}

export async function loadAllAdapters(root: string): Promise<Map<RuntimeId, Adapter>> {
  const adapters = new Map<RuntimeId, Adapter>();

  for (const platform of PLATFORMS) {
    const adapter = await loadAdapter(root, platform);
    if (adapter) {
      adapters.set(platform, adapter);
    }
  }

  return adapters;
}
