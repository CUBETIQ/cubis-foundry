import { join } from "node:path";
import { readdir, readFile } from "node:fs/promises";
import { parse as parseYaml } from "yaml";
import { ModuleSchema } from "../schemas.js";
import type { Module } from "../types.js";

export async function loadModule(root: string, id: string): Promise<Module | null> {
  const filePath = join(root, "foundry", "modules", id, "module.yaml");
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = parseYaml(raw);
    return ModuleSchema.parse(parsed) as Module;
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

export async function loadAllModules(root: string): Promise<Map<string, Module>> {
  const modulesDir = join(root, "foundry", "modules");
  const entries = await readdir(modulesDir, { withFileTypes: true });
  const modules = new Map<string, Module>();

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const module = await loadModule(root, entry.name);
    if (module) {
      modules.set(module.id, module);
    }
  }

  return modules;
}
