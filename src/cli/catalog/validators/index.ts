import { ZodError } from "zod";
import type { Catalog, Module } from "../types.js";
import type {
  CatalogValidationResult,
  ModuleValidationResult,
  ValidationIssue,
} from "./errors.js";

export function moduleToIssues(
  moduleId: string,
  zodError: ZodError,
): ValidationIssue[] {
  return zodError.issues.map((issue) => ({
    path: `foundry/modules/${moduleId}/module.yaml`,
    message: `${issue.path.join(".") || "(root)"}: ${issue.message}`,
    severity: "error",
  }));
}

export function validateModule(module: Module): ModuleValidationResult {
  try {
    return {
      valid: true,
      moduleId: module.id,
      errors: [],
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        valid: false,
        moduleId: module.id,
        errors: moduleToIssues(module.id, error),
      };
    }
    throw error;
  }
}

export function validateCatalog(catalog: Catalog): CatalogValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const supportedRuntimes = new Set(
    catalog.package.supportedRuntimes.map((runtime) => runtime.id),
  );

  for (const profile of catalog.package.installProfiles) {
    for (const moduleId of profile.modules) {
      if (!catalog.modules.has(moduleId)) {
        errors.push({
          path: "foundry/package.yaml",
          message: `Profile '${profile.id}' references module '${moduleId}' which does not exist`,
          severity: "error",
        });
      }
    }
  }

  for (const component of catalog.package.installComponents) {
    if (!catalog.modules.has(component.id)) {
      warnings.push({
        path: "foundry/package.yaml",
        message: `Install component '${component.id}' does not have a matching module yet`,
        severity: "warning",
      });
    }
  }

  for (const [moduleId, module] of catalog.modules) {
    for (const dependency of module.dependencies) {
      if (!catalog.modules.has(dependency)) {
        errors.push({
          path: `foundry/modules/${moduleId}/module.yaml`,
          message: `Module '${moduleId}' depends on '${dependency}' which does not exist`,
          severity: "error",
        });
      }
    }

    if (
      module.kind === "capability" &&
      module.capability &&
      module.capability.outputs.some((output) =>
        output.platforms.some((platform) => !supportedRuntimes.has(platform)),
      )
    ) {
      errors.push({
        path: `foundry/modules/${moduleId}/module.yaml`,
        message: `Module '${moduleId}' declares outputs for an unsupported runtime`,
        severity: "error",
      });
    }
  }

  for (const [platform, adapter] of catalog.adapters) {
    if (!supportedRuntimes.has(platform)) {
      warnings.push({
        path: `foundry/adapters/${platform}.yaml`,
        message: `Adapter platform '${platform}' is not listed in supportedRuntimes`,
        severity: "warning",
      });
    }
    if (adapter.platform !== platform) {
      errors.push({
        path: `foundry/adapters/${platform}.yaml`,
        message: `Adapter platform mismatch: file is '${platform}', adapter declares '${adapter.platform}'`,
        severity: "error",
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
