import { mkdtempSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { compile, compileModule, needsRecompile } from "./index.js";
import { transformStage } from "./stages/transform.js";
import type { CompilationContext, ResolveStageOutput } from "./types.js";
import type { Adapter, Catalog, Module, ModuleOutput } from "../catalog/types.js";

const REPO_ROOT = resolve(import.meta.dirname, "../../..");

describe("compiler", () => {
  describe("compile()", () => {
    it("compiles for a specific platform", async () => {
      const results = await compile(REPO_ROOT, "claude");
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0]?.platform).toBe("claude");
      expect(results[0]?.assets).toBeInstanceOf(Array);
      expect(results[0]?.durationMs).toBeGreaterThanOrEqual(0);
    });

    it("compiles for all platforms when platform is omitted", async () => {
      const results = await compile(REPO_ROOT);
      expect(results).toBeInstanceOf(Array);
      // The catalog fixture has 5 platforms.
      expect(results.length).toBeGreaterThanOrEqual(1);
      for (const result of results) {
        expect(result.assets).toBeInstanceOf(Array);
        expect(result.durationMs).toBeGreaterThanOrEqual(0);
      }
    });

    it("throws when given an unknown platform", async () => {
      await expect(compile(REPO_ROOT, "unknown-platform")).rejects.toThrow(
        /not found|unknown/i,
      );
    });
  });

  describe("compileModule()", () => {
    it("returns an empty array (not yet implemented)", async () => {
      const results = await compileModule(REPO_ROOT, "rules-core", "claude");
      expect(results).toEqual([]);
    });
  });

  describe("needsRecompile()", () => {
    it("returns an empty array (not yet implemented)", async () => {
      const reasons = await needsRecompile(REPO_ROOT, "claude");
      expect(reasons).toEqual([]);
    });
  });

  describe("transformStage()", () => {
    /**
     * Creates a minimal mock adapter with one template entry.
     */
    function makeAdapter(templatePath: string): Adapter {
      return {
        platform: "claude",
        label: "Claude Code",
        rules: { mergeStrategy: "layered", userOverride: "honor", conflictResolution: "user-first" },
        skills: { capabilityProjection: [] },
        workflows: { projection: [] },
        specialists: { projection: [] },
        contextDocs: {
          enabled: true,
          outputDir: "docs/foundation",
          managedSections: true,
          markers: { prefix: "<!-- cbx:", suffix: "-->" },
          templates: [
            {
              id: "tech-md",
              source: templatePath,
              output: "docs/foundation/TECH.md",
              triggers: ["init", "sync", "build"],
            },
          ],
        },
      };
    }

    /**
     * Creates a minimal module with a capability output pointing at outputPath.
     */
    function makeModule(outputPath: string): Module {
      return {
        id: "test-capability",
        kind: "capability",
        label: "Test Capability",
        description: "A test capability module",
        dependencies: [],
        profiles: ["core"],
        stability: "stable",
        capability: {
          type: "tool",
          domains: ["test"],
          outputs: [
            {
              type: "contextDoc",
              path: outputPath,
              platforms: ["claude"],
            },
          ],
        },
      };
    }

    it("renders a capability output using the adapter's template", async () => {
      // Create a temp dir with a template file.
      const tmp = mkdtempSync(join(tmpdir(), "foundry-renderer-test-"));
      const templateFile = join(tmp, "tech.md.j2");
      writeFileSync(templateFile, "# {{ module.label }}\n\nDescription: {{ module.description }}");

      const adapter = makeAdapter(templateFile);
      const module = makeModule("docs/foundation/TECH.md");

      const ctx: CompilationContext = {
        catalog: {
          package: {
            schemaVersion: 1,
            version: "0.0.0",
            name: "test",
            description: "",
            supportedRuntimes: [],
            installProfiles: [],
            installComponents: [],
            buildOutputs: { runtimeAssets: "", cliDist: "", docs: "" },
          },
          modules: new Map([[module.id, module]]),
          adapters: new Map([[adapter.platform, adapter]]),
          schemaVersion: 1,
        },
        platform: "claude",
        adapter,
        modules: [module],
      };

      const resolved: ResolveStageOutput = { orderedModules: [module] };

      const result = await transformStage(ctx, resolved, { repoRoot: tmp });

      expect(result.assets).toHaveLength(1);
      const asset = result.assets[0]!;
      expect(asset.path).toBe("docs/foundation/TECH.md");
      expect(asset.content).toContain("Test Capability");
      expect(asset.content).toContain("Description: A test capability module");
      expect(asset.checksum).toMatch(/^[a-f0-9]{64}$/);
    });

    it("skips outputs whose platforms do not include the current platform", async () => {
      const tmp = mkdtempSync(join(tmpdir(), "foundry-renderer-test-"));
      const templateFile = join(tmp, "tech.md.j2");
      writeFileSync(templateFile, "Only for claude: {{ module.label }}");

      // Template matches but output is only for a different platform.
      const adapter: Adapter = {
        ...makeAdapter(templateFile),
        contextDocs: {
          ...makeAdapter(templateFile).contextDocs,
          templates: [
            {
              id: "tech-md",
              source: templateFile,
              output: "docs/foundation/TECH.md",
              triggers: ["init"],
            },
          ],
        },
      };

      const module: Module = {
        ...makeModule("docs/foundation/TECH.md"),
        capability: {
          type: "tool",
          domains: ["test"],
          outputs: [
            {
              type: "contextDoc",
              path: "docs/foundation/TECH.md",
              platforms: ["copilot"], // not "claude"
            },
          ],
        },
      };

      const ctx: CompilationContext = {
        catalog: {
          package: {
            schemaVersion: 1,
            version: "0.0.0",
            name: "test",
            description: "",
            supportedRuntimes: [],
            installProfiles: [],
            installComponents: [],
            buildOutputs: { runtimeAssets: "", cliDist: "", docs: "" },
          },
          modules: new Map([[module.id, module]]),
          adapters: new Map([[adapter.platform, adapter]]),
          schemaVersion: 1,
        },
        platform: "claude",
        adapter,
        modules: [module],
      };

      const result = await transformStage(ctx, { orderedModules: [module] }, { repoRoot: tmp });

      // Output should be skipped because the module output only targets "copilot".
      expect(result.assets).toHaveLength(0);
    });

    it("returns empty assets when no module has a capability", async () => {
      const adapter = makeAdapter("/nonexistent");
      const ctx: CompilationContext = {
        catalog: {
          package: {
            schemaVersion: 1,
            version: "0.0.0",
            name: "test",
            description: "",
            supportedRuntimes: [],
            installProfiles: [],
            installComponents: [],
            buildOutputs: { runtimeAssets: "", cliDist: "", docs: "" },
          },
          modules: new Map(),
          adapters: new Map([[adapter.platform, adapter]]),
          schemaVersion: 1,
        },
        platform: "claude",
        adapter,
        modules: [],
      };

      const result = await transformStage(ctx, { orderedModules: [] });

      expect(result.assets).toEqual([]);
    });
  });
});
