import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir, tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { compile, compileModule, needsRecompile } from "./index.js";
import { transformStage } from "./stages/transform.js";
import { emitStage } from "./stages/emit.js";
import { resolveStage } from "./stages/resolve.js";
import type { CompilationContext, ResolveStageOutput, TransformStageOutput } from "./types.js";
import type { Adapter, Catalog, Module, ModuleOutput } from "../catalog/types.js";
import { loadCatalog } from "../catalog/index.js";
import { setFoundryHomedir } from "../state/platform-state.js";
import { writeState } from "../state/index.js";

const REPO_ROOT = resolve(import.meta.dirname, "../../..");

function cloneFoundryFixture(): string {
  const tmp = mkdtempSync(join(tmpdir(), "foundry-compiler-fixture-"));
  cpSync(join(REPO_ROOT, "foundry"), join(tmp, "foundry"), { recursive: true });
  return tmp;
}

function writeSkillReference(
  root: string,
  moduleId: string,
  relativePath: string,
  content: string,
): void {
  const filePath = join(root, "foundry", "modules", moduleId, "references", relativePath);
  mkdirSync(join(filePath, ".."), { recursive: true });
  writeFileSync(filePath, content, "utf8");
}

function writeSkillMarkdown(
  root: string,
  moduleId: string,
  content: string,
): void {
  const filePath = join(root, "foundry", "modules", moduleId, "SKILL.md");
  writeFileSync(filePath, content, "utf8");
}

function writeModuleFile(
  root: string,
  moduleId: string,
  relativePath: string,
  content: string,
): void {
  const filePath = join(root, "foundry", "modules", moduleId, relativePath);
  mkdirSync(join(filePath, ".."), { recursive: true });
  writeFileSync(filePath, content, "utf8");
}

describe("compiler", () => {
  afterEach(() => {
    setFoundryHomedir(homedir());
  });

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
    it("compiles only assets owned by the requested module", async () => {
      const root = cloneFoundryFixture();

      const results = await compileModule(root, "rules-core", "claude");

      expect(results).toHaveLength(1);
      expect(results[0]!.platform).toBe("claude");

      const paths = results[0]!.assets.map((asset) => asset.path);
      expect(paths).toContain("CLAUDE.md");
      expect(paths).toContain(".claude/skills/rules-core/SKILL.md");
      expect(paths).not.toContain(".claude/skills/api-design/SKILL.md");
      expect(paths.some((path) => path.startsWith(".claude/hooks/"))).toBe(false);
      expect(paths.some((path) => path.startsWith(".claude/agents/"))).toBe(false);
      expect(paths.some((path) => path.includes("/workflow-"))).toBe(false);
    });

    it("projects sidecar references alongside a claude skill", async () => {
      const root = cloneFoundryFixture();
      writeSkillReference(root, "api-design", "rest-design.md", "# REST design\n");
      writeSkillReference(root, "api-design", "errors/problem-details.md", "# Problem details\n");

      const results = await compileModule(root, "api-design", "claude");

      expect(results).toHaveLength(1);
      const paths = results[0]!.assets.map((asset) => asset.path);
      expect(paths).toContain(".claude/skills/api-design/SKILL.md");
      expect(paths).toContain(".claude/skills/api-design/references/rest-design.md");
      expect(paths).toContain(
        ".claude/skills/api-design/references/errors/problem-details.md",
      );
    });

    it("projects skills and references to native gemini skill directories", async () => {
      const root = cloneFoundryFixture();
      writeSkillReference(root, "api-design", "rest-design.md", "# REST design\n");

      const results = await compileModule(root, "api-design", "gemini");

      expect(results).toHaveLength(1);
      const paths = results[0]!.assets.map((asset) => asset.path);
      expect(paths).toContain(".gemini/skills/api-design/SKILL.md");
      expect(paths).toContain(".gemini/skills/api-design/references/rest-design.md");
      expect(paths).not.toContain(".agents/skills/api-design/SKILL.md");
    });

    it("fails when a skill references a missing markdown file", async () => {
      const root = cloneFoundryFixture();
      const skillPath = join(root, "foundry", "modules", "api-design", "SKILL.md");
      const original = readFileSync(skillPath, "utf8");
      writeSkillMarkdown(
        root,
        "api-design",
        `${original}\n\n## Broken Link Fixture\n\n- \`references/does-not-exist.md\`\n`,
      );

      await expect(compileModule(root, "api-design", "claude")).rejects.toThrow(
        /api-design\/SKILL\.md.*references\/does-not-exist\.md/i,
      );
    });

    it("fails when a template references a missing markdown file", async () => {
      const root = cloneFoundryFixture();
      const templatePath = join(
        root,
        "foundry",
        "modules",
        "api-design",
        "templates",
        "claude.j2",
      );
      const original = readFileSync(templatePath, "utf8");
      writeModuleFile(
        root,
        "api-design",
        "templates/claude.j2",
        `${original}\n\nSee \`references/template-does-not-exist.md\`.\n`,
      );

      await expect(compileModule(root, "api-design", "claude")).rejects.toThrow(
        /api-design\/templates\/claude\.j2.*references\/template-does-not-exist\.md/i,
      );
    });
  });

  describe("needsRecompile()", () => {
    it("returns no reasons when generated assets and install state match", async () => {
      const root = cloneFoundryFixture();
      const stateHome = mkdtempSync(join(tmpdir(), "foundry-state-home-"));
      setFoundryHomedir(stateHome);

      const [bundle] = await compile(root, "claude");
      const catalog = await loadCatalog(root);

      writeState("claude", {
        schemaVersion: 1,
        platform: "claude",
        version: catalog.package.version,
        installedAt: "2026-03-26T00:00:00.000Z",
        assets: bundle!.assets.map((asset) => ({
          path: asset.path,
          checksum: asset.checksum,
          installedAt: "2026-03-26T00:00:00.000Z",
          sourceModule: "test",
        })),
      });

      const reasons = await needsRecompile(root, "claude");

      expect(reasons).toEqual([]);
    });

    it("reports stale state and stale generated assets", async () => {
      const root = cloneFoundryFixture();
      const stateHome = mkdtempSync(join(tmpdir(), "foundry-state-home-"));
      setFoundryHomedir(stateHome);

      const [bundle] = await compile(root, "claude");
      const catalog = await loadCatalog(root);
      const firstAsset = bundle!.assets[0]!;

      writeState("claude", {
        schemaVersion: 1,
        platform: "claude",
        version: catalog.package.version,
        installedAt: "2026-03-26T00:00:00.000Z",
        assets: bundle!.assets.map((asset, index) => ({
          path: asset.path,
          checksum: index === 0 ? "deadbeef" : asset.checksum,
          installedAt: "2026-03-26T00:00:00.000Z",
          sourceModule: "test",
        })),
      });

      writeFileSync(
        join(bundle!.outputDir, firstAsset.path),
        `${firstAsset.content}\n# tampered\n`,
        "utf8",
      );

      const reasons = await needsRecompile(root, "claude");

      expect(reasons).toContain("module-modified");
      expect(reasons).toContain("stale-asset");
    });

    it("reports a missing output directory when generated assets are absent", async () => {
      const root = cloneFoundryFixture();
      const stateHome = mkdtempSync(join(tmpdir(), "foundry-state-home-"));
      setFoundryHomedir(stateHome);

      const [bundle] = await compile(root, "claude");
      const catalog = await loadCatalog(root);

      writeState("claude", {
        schemaVersion: 1,
        platform: "claude",
        version: catalog.package.version,
        installedAt: "2026-03-26T00:00:00.000Z",
        assets: bundle!.assets.map((asset) => ({
          path: asset.path,
          checksum: asset.checksum,
          installedAt: "2026-03-26T00:00:00.000Z",
          sourceModule: "test",
        })),
      });

      rmSync(bundle!.outputDir, { recursive: true, force: true });

      const reasons = await needsRecompile(root, "claude");

      expect(reasons).toContain("output-dir-missing");
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
      const tmp = mkdtempSync(join(tmpdir(), "foundry-renderer-test-empty-"));
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

      const result = await transformStage(ctx, { orderedModules: [] }, { repoRoot: tmp });

      expect(result.assets).toEqual([]);
    });
  });

  describe("emitStage()", () => {
    /**
     * Creates a minimal mock compilation context for the emit stage.
     */
    function makeContext(platform: string): CompilationContext {
      return {
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
          adapters: new Map([
            [
              platform,
              {
                platform: platform as CompilationContext["platform"],
                label: "Test",
                rules: { mergeStrategy: "layered", userOverride: "honor", conflictResolution: "user-first" },
                skills: { capabilityProjection: [] },
                workflows: { projection: [] },
                specialists: { projection: [] },
                contextDocs: {
                  enabled: true,
                  outputDir: "docs/foundation",
                  managedSections: true,
                  markers: { prefix: "<!-- cbx:", suffix: "-->" },
                  templates: [],
                },
              },
            ],
          ]),
          schemaVersion: 1,
        },
        platform: platform as CompilationContext["platform"],
        adapter: {} as CompilationContext["adapter"],
        modules: [],
      };
    }

    it("writes assets to generated/runtime-assets/<platform>/", async () => {
      const tmp = mkdtempSync(join(tmpdir(), "foundry-emit-test-"));

      const ctx = makeContext("claude");

      const transformed: TransformStageOutput = {
        assets: [
          { path: "docs/foundation/TECH.md", content: "# Hello\n", checksum: "abc123" },
          { path: "docs/foundation/API.md", content: "# API\n", checksum: "def456" },
        ],
      };

      const result = await emitStage(ctx, transformed, { repoRoot: tmp });

      // outputDir should be set correctly.
      expect(result.outputDir).toBe(join(tmp, "generated", "runtime-assets", "claude"));

      // Both files should be written with the correct content.
      const techContent = readFileSync(join(tmp, "generated", "runtime-assets", "claude", "docs/foundation", "TECH.md"), "utf8");
      expect(techContent).toBe("# Hello\n");

      const apiContent = readFileSync(join(tmp, "generated", "runtime-assets", "claude", "docs/foundation", "API.md"), "utf8");
      expect(apiContent).toBe("# API\n");
    });

    it("returns all assets from transformed output", async () => {
      const tmp = mkdtempSync(join(tmpdir(), "foundry-emit-test-"));
      const ctx = makeContext("claude");

      const assets = [
        { path: "a.txt", content: "content-a", checksum: "aaa" },
        { path: "b.txt", content: "content-b", checksum: "bbb" },
        { path: "c.txt", content: "content-c", checksum: "ccc" },
      ];

      const transformed: TransformStageOutput = { assets };
      const result = await emitStage(ctx, transformed, { repoRoot: tmp });

      expect(result.assets).toHaveLength(3);
      expect(result.assets[0]!.path).toBe("a.txt");
      expect(result.assets[1]!.path).toBe("b.txt");
      expect(result.assets[2]!.path).toBe("c.txt");
    });

    it("handles empty assets array gracefully", async () => {
      const tmp = mkdtempSync(join(tmpdir(), "foundry-emit-test-"));
      const ctx = makeContext("claude");

      const transformed: TransformStageOutput = { assets: [] };
      const result = await emitStage(ctx, transformed, { repoRoot: tmp });

      expect(result.assets).toEqual([]);
      expect(result.outputDir).toBe(join(tmp, "generated", "runtime-assets", "claude"));
    });
  });

  /**
   * Helper — minimal stub catalog so resolveStage does not need a real catalog file.
   */
  function stubCatalog(): CompilationContext["catalog"] {
    return {
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
      adapters: new Map(),
      schemaVersion: 1,
    };
  }

  /**
   * Helper — makes a lightweight Module with only the fields resolveStage reads.
   */
  function makeModule(id: string, dependencies: string[] = []): Module {
    return {
      id,
      kind: "capability",
      label: id,
      description: "",
      dependencies,
      profiles: [],
      stability: "stable",
    };
  }

  describe("resolveStage()", () => {
    it("happy path — no dependencies: modules come out in input order", async () => {
      const modules = [makeModule("a"), makeModule("b"), makeModule("c")];
      const ctx: CompilationContext = { catalog: stubCatalog(), platform: "claude", adapter: {} as Adapter, modules };
      const result = await resolveStage(ctx);
      expect(result.orderedModules.map((m) => m.id)).toEqual(["a", "b", "c"]);
    });

    it("happy path — single module with no deps", async () => {
      const ctx: CompilationContext = { catalog: stubCatalog(), platform: "claude", adapter: {} as Adapter, modules: [makeModule("x")] };
      const result = await resolveStage(ctx);
      expect(result.orderedModules).toHaveLength(1);
      expect(result.orderedModules[0]!.id).toBe("x");
    });

    it("happy path — empty modules array", async () => {
      const ctx: CompilationContext = { catalog: stubCatalog(), platform: "claude", adapter: {} as Adapter, modules: [] };
      const result = await resolveStage(ctx);
      expect(result.orderedModules).toEqual([]);
    });

    it("happy path — simple chain A→B→C sorts to C, B, A", async () => {
      // C has no deps; B depends on C; A depends on B.
      const modules = [makeModule("a", ["b"]), makeModule("b", ["c"]), makeModule("c", [])];
      const ctx: CompilationContext = { catalog: stubCatalog(), platform: "claude", adapter: {} as Adapter, modules };
      const result = await resolveStage(ctx);
      const ids = result.orderedModules.map((m) => m.id);
      // C must come before B; B must come before A.
      expect(ids.indexOf("c")).toBeLessThan(ids.indexOf("b"));
      expect(ids.indexOf("b")).toBeLessThan(ids.indexOf("a"));
    });

    it("happy path — diamond A→{B,C}, B→D, C→D sorts D first, then B+C, then A", async () => {
      // D has no deps; B depends on D; C depends on D; A depends on B and C.
      const modules = [
        makeModule("a", ["b", "c"]),
        makeModule("b", ["d"]),
        makeModule("c", ["d"]),
        makeModule("d", []),
      ];
      const ctx: CompilationContext = { catalog: stubCatalog(), platform: "claude", adapter: {} as Adapter, modules };
      const result = await resolveStage(ctx);
      const ids = result.orderedModules.map((m) => m.id);
      // D must come before B and C.
      expect(ids.indexOf("d")).toBeLessThan(ids.indexOf("b"));
      expect(ids.indexOf("d")).toBeLessThan(ids.indexOf("c"));
      // B and C must come before A.
      expect(ids.indexOf("b")).toBeLessThan(ids.indexOf("a"));
      expect(ids.indexOf("c")).toBeLessThan(ids.indexOf("a"));
    });

    it("happy path — multiple independent branches resolve correctly", async () => {
      // Two separate chains: A→B and C→D (no cross-links).
      const modules = [
        makeModule("a", ["b"]),
        makeModule("b", []),
        makeModule("c", ["d"]),
        makeModule("d", []),
      ];
      const ctx: CompilationContext = { catalog: stubCatalog(), platform: "claude", adapter: {} as Adapter, modules };
      const result = await resolveStage(ctx);
      const ids = result.orderedModules.map((m) => m.id);
      // b before a; d before c.
      expect(ids.indexOf("b")).toBeLessThan(ids.indexOf("a"));
      expect(ids.indexOf("d")).toBeLessThan(ids.indexOf("c"));
    });

    it("cycle detection — A→B→C→A throws a descriptive error", async () => {
      const modules = [
        makeModule("a", ["b"]),
        makeModule("b", ["c"]),
        makeModule("c", ["a"]),
      ];
      const ctx: CompilationContext = { catalog: stubCatalog(), platform: "claude", adapter: {} as Adapter, modules };
      await expect(resolveStage(ctx)).rejects.toThrow(/Circular dependency detected/i);
    });

    it("cycle detection — self-referential module throws", async () => {
      const modules = [makeModule("x", ["x"])];
      const ctx: CompilationContext = { catalog: stubCatalog(), platform: "claude", adapter: {} as Adapter, modules };
      await expect(resolveStage(ctx)).rejects.toThrow(/Circular dependency detected/i);
    });

    it("cycle detection — error message names at least one module in the cycle", async () => {
      const modules = [
        makeModule("m1", ["m2"]),
        makeModule("m2", ["m3"]),
        makeModule("m3", ["m1"]),
      ];
      const ctx: CompilationContext = { catalog: stubCatalog(), platform: "claude", adapter: {} as Adapter, modules };
      await expect(resolveStage(ctx)).rejects.toThrow(/m[123]/);
    });

    it("throws when a module declares an unknown dependency", async () => {
      const modules = [makeModule("a", ["nonexistent"])];
      const ctx: CompilationContext = { catalog: stubCatalog(), platform: "claude", adapter: {} as Adapter, modules };
      await expect(resolveStage(ctx)).rejects.toThrow(/unknown dependency/i);
    });
  });
});
