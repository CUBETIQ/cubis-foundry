import {
  loadAllAdapters,
  loadAllModules,
  loadPackage,
} from "./loaders/index.js";
import { validateCatalog, validateModule } from "./validators/index.js";
import type {
  Adapter,
  Catalog,
  Module,
  PackageManifest,
} from "./types.js";
import type {
  CatalogValidationResult,
  ModuleValidationResult,
} from "./validators/errors.js";

export type {
  Adapter,
  Catalog,
  Module,
  PackageManifest,
  CatalogValidationResult,
  ModuleValidationResult,
};

export async function loadCatalog(root: string): Promise<Catalog> {
  const pkg = await loadPackage(root);
  const modules = await loadAllModules(root);
  const adapters = await loadAllAdapters(root);

  return {
    package: pkg,
    modules,
    adapters,
    schemaVersion: pkg.schemaVersion,
  };
}

export function resolveModule(catalog: Catalog, id: string): Module | undefined {
  return catalog.modules.get(id);
}

export function resolveProfile(catalog: Catalog, profileId: string) {
  return catalog.package.installProfiles.find((profile) => profile.id === profileId) ?? null;
}

export { validateCatalog, validateModule };
