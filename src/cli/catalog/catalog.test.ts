import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import {
  loadCatalog,
  resolveModule,
  resolveProfile,
  validateCatalog,
} from "./index.js";

const REPO_ROOT = resolve(import.meta.dirname, "../../..");

describe("catalog", () => {
  let catalog: Awaited<ReturnType<typeof loadCatalog>>;

  beforeAll(async () => {
    catalog = await loadCatalog(REPO_ROOT);
  });

  it("loads the package manifest", () => {
    expect(catalog.package.name).toBe("foundry");
    expect(catalog.package.schemaVersion).toBe(1);
    expect(catalog.package.supportedRuntimes).toHaveLength(5);
  });

  it("loads all platform adapters", () => {
    expect(catalog.adapters.size).toBe(5);
    expect(catalog.adapters.has("claude")).toBe(true);
    expect(catalog.adapters.has("codex")).toBe(true);
    expect(catalog.adapters.has("copilot")).toBe(true);
    expect(catalog.adapters.has("gemini")).toBe(true);
    expect(catalog.adapters.has("antigravity")).toBe(true);
  });

  it("loads placeholder modules", () => {
    expect(catalog.modules.size).toBeGreaterThanOrEqual(8);
    expect(catalog.modules.has("rules-core")).toBe(true);
    expect(catalog.modules.has("agents-core")).toBe(true);
    expect(catalog.modules.has("contexts-core")).toBe(true);
    expect(catalog.modules.has("mcp-core")).toBe(true);
  });

  it("resolves an existing module", () => {
    const module = resolveModule(catalog, "rules-core");
    expect(module).toBeDefined();
    expect(module?.id).toBe("rules-core");
    expect(module?.kind).toBe("rule-pack");
  });

  it("returns undefined for a missing module", () => {
    expect(resolveModule(catalog, "non-existent")).toBeUndefined();
  });

  it("resolves an existing install profile", () => {
    const profile = resolveProfile(catalog, "developer");
    expect(profile).toBeDefined();
    expect(profile?.id).toBe("developer");
    expect(profile?.modules).toContain("rules-core");
  });

  it("returns null for a missing install profile", () => {
    expect(resolveProfile(catalog, "non-existent")).toBeNull();
  });

  it("passes validation for the current catalog", () => {
    const result = validateCatalog(catalog);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it("catches missing module dependencies", () => {
    const badCatalog = {
      ...catalog,
      modules: new Map(catalog.modules).set("bad-module", {
        id: "bad-module",
        kind: "capability" as const,
        label: "Bad Module",
        description: "A module with a missing dependency for validation coverage.",
        dependencies: ["missing-dependency"],
        profiles: [],
        stability: "stable" as const,
        capability: {
          type: "tool" as const,
          domains: ["test"],
          outputs: [],
        },
      }),
    };
    const result = validateCatalog(badCatalog);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((issue) =>
        issue.message.includes("depends on 'missing-dependency'"),
      ),
    ).toBe(true);
  });
});
