import { describe, expect, it } from "vitest";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { VaultManifest } from "../vault/types.js";
import type { RouteManifest } from "../routes/types.js";
import { handleSkillBrowseCategory } from "./skillBrowseCategory.js";
import { handleSkillBudgetReport } from "./skillBudgetReport.js";
import { handleSkillGet } from "./skillGet.js";
import { handleSkillGetReference } from "./skillGetReference.js";
import { handleSkillListCategories } from "./skillListCategories.js";
import { handleRouteResolve } from "./routeResolve.js";
import { handleSkillSearch } from "./skillSearch.js";
import { handleSkillValidate } from "./skillValidate.js";

function payload(result: { content: Array<{ text: string }> }): Record<string, unknown> {
  return JSON.parse(result.content[0].text) as Record<string, unknown>;
}

function metrics(result: { structuredContent?: Record<string, unknown> }): Record<string, unknown> {
  return (
    result.structuredContent?.metrics ||
    (result as { _meta?: { metrics?: Record<string, unknown> } })._meta?.metrics ||
    {}
  ) as Record<string, unknown>;
}

function createSkillFile(id: string, description: string, body = "# Content"): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), `mcp-skill-${id}-`));
  const file = path.join(dir, "SKILL.md");
  writeFileSync(
    file,
    `---\nname: ${id}\ndescription: ${description}\n---\n${body}\n`,
    "utf8",
  );
  return file;
}

function createManifest(): VaultManifest {
  const reactFile = createSkillFile(
    "react-expert",
    "React performance and architecture guidance",
  );
  const fastapiFile = createSkillFile(
    "fastapi-expert",
    "FastAPI async backend patterns",
  );
  const reactBytes = statSync(reactFile).size;
  const fastapiBytes = statSync(fastapiFile).size;
  const fullCatalogBytes = reactBytes + fastapiBytes;

  return {
    categories: ["backend", "frontend"],
    skills: [
      {
        id: "react-expert",
        category: "frontend",
        path: reactFile,
        fileBytes: reactBytes,
        description: "React performance and architecture guidance",
      },
      {
        id: "fastapi-expert",
        category: "backend",
        path: fastapiFile,
        fileBytes: fastapiBytes,
        description: "FastAPI async backend patterns",
      },
    ],
    fullCatalogBytes,
    fullCatalogEstimatedTokens: Math.ceil(fullCatalogBytes / 4),
  };
}

function createRouteManifest(): RouteManifest {
  return {
    $schema: "cubis-foundry-route-manifest-v1",
    generatedAt: new Date(0).toISOString(),
    contentHash: "test",
    summary: { totalRoutes: 7, workflows: 5, agents: 2 },
    routes: [
      {
        kind: "workflow",
        id: "create",
        command: "/create",
        displayName: "Create Workflow",
        description: "Implement feature work with minimal blast radius",
        triggers: ["create", "build", "implement", "feature"],
        primaryAgent: "orchestrator",
        supportingAgents: ["backend-specialist", "frontend-specialist"],
        primarySkills: ["feature-forge", "architecture-designer"],
        supportingSkills: ["lint-and-validate", "test-master"],
        artifacts: {
          codex: { compatibilityAlias: "$workflow-create", workflowFile: "create.md" },
          copilot: { workflowFile: "create.md", promptFile: "workflow-create.prompt.md" },
          antigravity: { workflowFile: "create.md", commandFile: "create.toml" },
        },
      },
      {
        kind: "workflow",
        id: "mobile",
        command: "/mobile",
        displayName: "Mobile Workflow",
        description: "Drive mobile implementation decisions",
        triggers: ["mobile", "flutter", "ios", "android"],
        primaryAgent: "mobile-developer",
        supportingAgents: ["frontend-specialist", "test-engineer"],
        primarySkills: ["mobile-design", "flutter-expert"],
        supportingSkills: ["riverpod-3"],
        artifacts: {
          codex: { compatibilityAlias: "$workflow-mobile", workflowFile: "mobile.md" },
          copilot: { workflowFile: "mobile.md", promptFile: "workflow-mobile.prompt.md" },
          antigravity: { workflowFile: "mobile.md", commandFile: "mobile.toml" },
          claude: { workflowFile: "mobile.md" },
        },
      },
      {
        kind: "workflow",
        id: "review",
        command: "/review",
        displayName: "Review Workflow",
        description: "Run a strict review for bugs and regressions",
        triggers: ["review", "audit", "bugs"],
        primaryAgent: "orchestrator",
        supportingAgents: ["security-auditor"],
        primarySkills: ["find-bugs"],
        supportingSkills: ["security-reviewer"],
        artifacts: {
          codex: { compatibilityAlias: "$workflow-review", workflowFile: "review.md" },
          copilot: { workflowFile: "review.md", promptFile: "workflow-review.prompt.md" },
          antigravity: { workflowFile: "review.md", commandFile: "review.toml" },
        },
      },
      {
        kind: "workflow",
        id: "plan",
        command: "/plan",
        displayName: "Plan Workflow",
        description: "Build a decision-complete implementation plan",
        triggers: ["plan", "spec", "design"],
        primaryAgent: "project-planner",
        supportingAgents: ["product-manager", "test-engineer"],
        primarySkills: ["plan-writing", "architecture-designer"],
        supportingSkills: ["feature-forge", "api-designer"],
        artifacts: {
          codex: { compatibilityAlias: "$workflow-plan", workflowFile: "plan.md" },
          copilot: { workflowFile: "plan.md", promptFile: "workflow-plan.prompt.md" },
          antigravity: { workflowFile: "plan.md", commandFile: "plan.toml" },
        },
      },
      {
        kind: "workflow",
        id: "orchestrate",
        command: "/orchestrate",
        displayName: "Orchestrate Workflow",
        description: "Coordinate multiple specialists for cross-cutting work",
        triggers: ["orchestrate", "coordinate", "cross-team"],
        primaryAgent: "orchestrator",
        supportingAgents: ["backend-specialist", "database-architect"],
        primarySkills: ["parallel-agents", "architecture-designer"],
        supportingSkills: ["plan-writing", "feature-forge"],
        artifacts: {
          codex: { compatibilityAlias: "$workflow-orchestrate", workflowFile: "orchestrate.md" },
          copilot: { workflowFile: "orchestrate.md", promptFile: "workflow-orchestrate.prompt.md" },
          antigravity: { workflowFile: "orchestrate.md", commandFile: "orchestrate.toml" },
        },
      },
      {
        kind: "agent",
        id: "mobile-developer",
        command: null,
        displayName: "mobile-developer",
        description: "Expert in Flutter and mobile app development",
        triggers: ["mobile", "flutter", "ios", "android"],
        primaryAgent: "mobile-developer",
        supportingAgents: [],
        primarySkills: ["mobile-design", "flutter-expert"],
        supportingSkills: ["flutter-test-master"],
        artifacts: {
          codex: { compatibilityAlias: "$agent-mobile-developer", agentFile: "mobile-developer.md" },
          copilot: { agentFile: "mobile-developer.md" },
          antigravity: { agentFile: "mobile-developer.md" },
        },
      },
      {
        kind: "agent",
        id: "test-engineer",
        command: null,
        displayName: "test-engineer",
        description: "Expert in testing and regression strategy",
        triggers: ["test", "qa", "regression", "playwright"],
        primaryAgent: "test-engineer",
        supportingAgents: [],
        primarySkills: ["test-master", "playwright-expert"],
        supportingSkills: ["webapp-testing"],
        artifacts: {
          codex: { compatibilityAlias: "$agent-test-engineer", agentFile: "test-engineer.md" },
          copilot: { agentFile: "test-engineer.md" },
          antigravity: { agentFile: "test-engineer.md" },
        },
      },
      {
        kind: "agent",
        id: "researcher",
        command: null,
        displayName: "researcher",
        description: "Expert in codebase research and external verification",
        triggers: ["research", "latest", "compare", "investigate", "survey"],
        primaryAgent: "researcher",
        supportingAgents: [],
        primarySkills: ["deep-research", "architecture-designer"],
        supportingSkills: ["prompt-engineer"],
        artifacts: {
          codex: { compatibilityAlias: "$agent-researcher", agentFile: "researcher.md" },
          copilot: { agentFile: "researcher.md" },
          antigravity: { agentFile: "researcher.md" },
        },
      },
    ],
  };
}

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const GENERATED_MANIFEST_PATH = path.join(
  REPO_ROOT,
  "mcp/generated/mcp-manifest.json",
);
const SKILLS_ROOT = path.join(REPO_ROOT, "workflows", "skills");

interface GeneratedSkillManifest {
  fullCatalogEstimatedTokens?: number;
  skills: Array<{
    id: string;
    category: string;
    description?: string;
    path?: string;
    fileBytes: number;
    metadata?: Record<string, string>;
  }>;
}

function loadGeneratedCatalog(): {
  generated: GeneratedSkillManifest;
  runtimeManifest: VaultManifest;
} {
  const generated = JSON.parse(
    readFileSync(GENERATED_MANIFEST_PATH, "utf8"),
  ) as GeneratedSkillManifest;
  const runtimeManifest: VaultManifest = {
    categories: [...new Set(generated.skills.map((skill) => skill.category))].sort(),
    skills: generated.skills.map((skill) => ({
      id: skill.id,
      canonicalId: skill.metadata?.alias_of ?? skill.metadata?.replaced_by,
      category: skill.category,
      description: skill.description,
      fileBytes: skill.fileBytes,
      path: skill.path
        ? path.resolve(REPO_ROOT, skill.path)
        : path.join(SKILLS_ROOT, skill.id, "SKILL.md"),
    })),
    fullCatalogBytes: generated.skills.reduce(
      (sum, skill) => sum + skill.fileBytes,
      0,
    ),
    fullCatalogEstimatedTokens:
      generated.fullCatalogEstimatedTokens ??
      Math.ceil(
        generated.skills.reduce((sum, skill) => sum + skill.fileBytes, 0) / 4,
      ),
  };

  return { generated, runtimeManifest };
}

const GENERIC_QUERY_WORDS = new Set([
  "alias",
  "architect",
  "architecture",
  "best",
  "builder",
  "checklist",
  "compatibility",
  "coordinator",
  "decision",
  "deprecated",
  "design",
  "developer",
  "engineer",
  "expert",
  "flow",
  "framework",
  "fundamentals",
  "guide",
  "guidance",
  "implementation",
  "manager",
  "mobile",
  "patterns",
  "practices",
  "pro",
  "protocol",
  "reviewer",
  "skill",
  "specialist",
  "system",
  "test",
  "testing",
  "workflow",
]);

function normalizeTokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);
}

function buildDiscoveryQuery(skill: {
  id: string;
  category: string;
  description?: string;
}): string {
  const idTokens = normalizeTokens(skill.id).filter(
    (token) => !GENERIC_QUERY_WORDS.has(token),
  );
  const descriptionTokens = normalizeTokens(skill.description ?? "").filter(
    (token) => !GENERIC_QUERY_WORDS.has(token),
  );
  const merged = [...new Set([...idTokens, ...descriptionTokens])];
  const seedTokens = merged.slice(0, 3);
  return [skill.category, ...seedTokens].filter(Boolean).join(" ");
}

describe("skill tools", () => {
  it("lists categories with skill counts", () => {
    const manifest = createManifest();
    const result = handleSkillListCategories(manifest, 4);
    const data = payload(result);
    const toolMetrics = metrics(result);

    expect(data.totalSkills).toBe(2);
    expect(data.categories).toEqual([
      { category: "backend", skillCount: 1 },
      { category: "frontend", skillCount: 1 },
    ]);
    expect(toolMetrics.estimatorVersion).toBeDefined();
    expect(toolMetrics.fullCatalogEstimatedTokens).toBe(
      manifest.fullCatalogEstimatedTokens,
    );
  });

  it("browses a category with enriched descriptions", async () => {
    const manifest = createManifest();
    const result = await handleSkillBrowseCategory(
      { category: "frontend" },
      manifest,
      200,
      4,
    );
    const data = payload(result);
    const toolMetrics = metrics(result);

    expect(data.category).toBe("frontend");
    expect(data.count).toBe(1);
    expect(data.skills).toEqual([
      {
        id: "react-expert",
        description: "React performance and architecture guidance",
      },
    ]);
    expect(toolMetrics.selectedSkillsEstimatedTokens).toBeGreaterThan(0);
  });

  it("throws when browsing an unknown category", async () => {
    const manifest = createManifest();
    await expect(
      handleSkillBrowseCategory({ category: "mobile" }, manifest, 200, 4),
    ).rejects.toThrow('Category not found: "mobile"');
  });

  it("searches by skill id and by description fallback", async () => {
    const manifest = createManifest();

    const byId = payload(
      await handleSkillSearch({ query: "react" }, manifest, 200, 4),
    );
    expect(byId.count).toBe(1);
    expect(byId.results).toEqual([
      {
        id: "react-expert",
        category: "frontend",
        description: "React performance and architecture guidance",
      },
    ]);

    const byDescription = payload(
      await handleSkillSearch({ query: "async backend" }, manifest, 200, 4),
    );
    expect(byDescription.count).toBe(1);
    expect(byDescription.results).toEqual([
      {
        id: "fastapi-expert",
        category: "backend",
        description: "FastAPI async backend patterns",
      },
    ]);
  });

  it("returns ranked partial matches for natural-language queries", async () => {
    const flutterFile = createSkillFile(
      "flutter-expert",
      "Flutter app architecture coordinator for mobile apps",
    );
    const apiFile = createSkillFile(
      "api-patterns",
      "API design principles and decision-making",
    );
    const flutterBytes = statSync(flutterFile).size;
    const apiBytes = statSync(apiFile).size;
    const manifest: VaultManifest = {
      categories: ["api", "mobile"],
      skills: [
        {
          id: "flutter-expert",
          category: "mobile",
          path: flutterFile,
          fileBytes: flutterBytes,
        },
        {
          id: "api-patterns",
          category: "api",
          path: apiFile,
          fileBytes: apiBytes,
        },
      ],
      fullCatalogBytes: flutterBytes + apiBytes,
      fullCatalogEstimatedTokens: Math.ceil((flutterBytes + apiBytes) / 4),
    };

    const result = payload(
      await handleSkillSearch(
        { query: "flutter dio auth headers branch multi-tenant api" },
        manifest,
        200,
        4,
      ),
    );

    expect(result.count).toBeGreaterThan(0);
    expect(result.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "flutter-expert" }),
      ]),
    );
  });

  it("prioritizes keyword and trigger matches ahead of description-only matches", async () => {
    const apiFile = createSkillFile(
      "api-designer",
      "Contract design guidance",
    );
    const docsFile = createSkillFile(
      "documentation-writer",
      "Writes OpenAPI and Swagger documentation",
    );
    const apiBytes = statSync(apiFile).size;
    const docsBytes = statSync(docsFile).size;
    const manifest: VaultManifest = {
      categories: ["api", "documentation"],
      skills: [
        {
          id: "api-designer",
          category: "api",
          path: apiFile,
          fileBytes: apiBytes,
          description: "Contract design guidance",
          keywords: ["openapi"],
          triggers: ["swagger"],
        },
        {
          id: "documentation-writer",
          category: "documentation",
          path: docsFile,
          fileBytes: docsBytes,
          description: "Writes OpenAPI and Swagger documentation",
        },
      ],
      fullCatalogBytes: apiBytes + docsBytes,
      fullCatalogEstimatedTokens: Math.ceil((apiBytes + docsBytes) / 4),
    };

    const result = payload(
      await handleSkillSearch({ query: "swagger" }, manifest, 200, 4),
    );

    expect(result.count).toBe(2);
    expect(result.results[0]).toMatchObject({ id: "api-designer" });
  });

  it("resolves an explicit workflow command before skill discovery", async () => {
    const result = payload(
      await handleRouteResolve({ intent: "/mobile" }, createRouteManifest()),
    );
    expect(result).toMatchObject({
      resolved: true,
      kind: "workflow",
      id: "mobile",
      agent: "mobile-developer",
      matchedBy: "explicit-workflow-command",
    });
    expect(result.artifacts).toMatchObject({
      claude: { workflowFile: "mobile.md" },
    });
  });

  it("resolves an explicit custom agent mention before skill discovery", async () => {
    const result = payload(
      await handleRouteResolve(
        { intent: "@mobile-developer" },
        createRouteManifest(),
      ),
    );
    expect(result).toMatchObject({
      resolved: true,
      kind: "agent",
      id: "mobile-developer",
      matchedBy: "explicit-agent",
    });
  });

  it("maps a legacy workflow command to the canonical workflow route", async () => {
    const result = payload(
      await handleRouteResolve({ intent: "/brainstorm" }, createRouteManifest()),
    );
    expect(result).toMatchObject({
      resolved: true,
      kind: "workflow",
      id: "plan",
      matchedBy: "legacy-workflow-alias",
    });
  });

  it("maps a legacy agent mention to the canonical agent route", async () => {
    const result = payload(
      await handleRouteResolve(
        { intent: "@qa-automation-engineer" },
        createRouteManifest(),
      ),
    );
    expect(result).toMatchObject({
      resolved: true,
      kind: "agent",
      id: "test-engineer",
      matchedBy: "legacy-agent-alias",
    });
  });

  it("resolves free-text trigger intent to a workflow route", async () => {
    const result = payload(
      await handleRouteResolve(
        { intent: "fix flutter navigation and mobile behavior" },
        createRouteManifest(),
      ),
    );
    expect(result).toMatchObject({
      resolved: true,
      kind: "workflow",
      id: "mobile",
    });
    expect(["trigger-match", "intent-match"]).toContain(result.matchedBy);
  });

  it("routes skill creator intent to create with skill-creator as the primary skill hint", async () => {
    const result = payload(
      await handleRouteResolve(
        { intent: "create a new skill package for Copilot and Codex" },
        createRouteManifest(),
      ),
    );
    expect(result).toMatchObject({
      resolved: true,
      kind: "workflow",
      id: "create",
      primarySkillHint: "skill-creator",
      matchedBy: "skill-creator-intent",
    });
  });

  it("routes skill planning intent to plan with skill-creator as the primary skill hint", async () => {
    const result = payload(
      await handleRouteResolve(
        { intent: "plan a new skill and its sidecar references" },
        createRouteManifest(),
      ),
    );
    expect(result).toMatchObject({
      resolved: true,
      kind: "workflow",
      id: "plan",
      primarySkillHint: "skill-creator",
      matchedBy: "skill-creator-intent",
    });
  });

  it("routes skill review intent to review with skill-creator as the primary skill hint", async () => {
    const result = payload(
      await handleRouteResolve(
        { intent: "review this skill metadata and broken references" },
        createRouteManifest(),
      ),
    );
    expect(result).toMatchObject({
      resolved: true,
      kind: "workflow",
      id: "review",
      primarySkillHint: "skill-creator",
      matchedBy: "skill-creator-intent",
    });
  });

  it("routes research intent to researcher with deep-research as the primary skill hint", async () => {
    const result = payload(
      await handleRouteResolve(
        { intent: "research latest Claude Code hooks behavior" },
        createRouteManifest(),
      ),
    );
    expect(result).toMatchObject({
      resolved: true,
      kind: "agent",
      id: "researcher",
      primarySkillHint: "deep-research",
    });
    expect(["trigger-match", "intent-match"]).toContain(result.matchedBy);
  });

  it("falls back cleanly when no route matches the intent", async () => {
    const result = payload(
      await handleRouteResolve(
        { intent: "obscure domain with no known route" },
        createRouteManifest(),
      ),
    );
    expect(result).toMatchObject({
      resolved: false,
      fallbackSkillSearchRecommended: true,
      matchedBy: "none",
    });
  });

  it("adds a repo-signal language skill hint when TypeScript signals exist", async () => {
    const originalCwd = process.cwd();
    const tempDir = mkdtempSync(path.join(os.tmpdir(), "route-resolve-ts-"));
    writeFileSync(path.join(tempDir, "package.json"), '{"name":"tmp"}\n', "utf8");
    writeFileSync(path.join(tempDir, "tsconfig.json"), '{"compilerOptions":{"strict":true}}\n', "utf8");
    process.chdir(tempDir);

    try {
      const result = payload(
        await handleRouteResolve(
          { intent: "build a backend api" },
          createRouteManifest(),
        ),
      );
      expect(result.detectedLanguageSkill).toBe("typescript-pro");
    } finally {
      process.chdir(originalCwd);
    }
  });

  it("finds every generated skill by exact id", async () => {
    const { runtimeManifest } = loadGeneratedCatalog();
    const missing: string[] = [];

    for (const skill of runtimeManifest.skills) {
      const result = payload(
        await handleSkillSearch({ query: skill.id }, runtimeManifest, 200, 4),
      );
      const ids = (result.results as Array<{ id: string }>).map((item) => item.id);
      if (!ids.includes(skill.id)) {
        missing.push(skill.id);
      }
    }

    expect(missing).toEqual([]);
  });

  it("finds at least one skill in every generated category", async () => {
    const { runtimeManifest } = loadGeneratedCatalog();
    const missingCategories: string[] = [];

    for (const category of runtimeManifest.categories) {
      const result = payload(
        await handleSkillSearch({ query: category }, runtimeManifest, 200, 4),
      );
      const results = result.results as Array<{ category: string }>;
      if (!results.some((item) => item.category === category)) {
        missingCategories.push(category);
      }
    }

    expect(missingCategories).toEqual([]);
  });

  it("finds every generated skill through a discovery-style partial query", async () => {
    const { runtimeManifest } = loadGeneratedCatalog();
    const failures: Array<{ id: string; query: string }> = [];

    for (const skill of runtimeManifest.skills) {
      const query = buildDiscoveryQuery(skill);
      const result = payload(
        await handleSkillSearch({ query }, runtimeManifest, 200, 4),
      );
      const ids = (result.results as Array<{ id: string }>).map((item) => item.id);
      if (!ids.includes(skill.id)) {
        failures.push({ id: skill.id, query });
      }
    }

    expect(failures).toEqual([]);
  });

  it("returns full skill content for skill_get", async () => {
    const manifest = createManifest();
    const result = await handleSkillGet({ id: "react-expert" }, manifest, 4);
    const toolMetrics = metrics(result);

    expect(result.content[0].text).toContain("# Content");
    expect(result.content[0].text).toContain("description: React performance");
    expect(toolMetrics.loadedSkillEstimatedTokens).toBeGreaterThan(0);
  });

  it("validates an exact skill id and exposes alias/reference metadata", async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "mcp-skill-validate-"));
    const skillFile = path.join(dir, "SKILL.md");
    const referencesDir = path.join(dir, "references");
    mkdirSync(referencesDir, { recursive: true });
    writeFileSync(
      skillFile,
      [
        "---",
        "name: deprecated-skill",
        "description: compatibility shim",
        "metadata:",
        "  deprecated: true",
        "  replaced_by: canonical-skill",
        "---",
        "# Skill",
        "See [Guide](references/guide.md).",
      ].join("\n"),
      "utf8",
    );
    writeFileSync(path.join(referencesDir, "guide.md"), "# Guide", "utf8");

    const skillBytes = statSync(skillFile).size;
    const manifest: VaultManifest = {
      categories: ["general"],
      skills: [
        {
          id: "deprecated-skill",
          category: "general",
          path: skillFile,
          fileBytes: skillBytes,
        },
      ],
      fullCatalogBytes: skillBytes,
      fullCatalogEstimatedTokens: Math.ceil(skillBytes / 4),
    };

    const result = await handleSkillValidate(
      { id: "deprecated-skill" },
      manifest,
      4,
    );
    const data = payload(result);
    expect(data).toMatchObject({
      id: "deprecated-skill",
      exists: true,
      canonicalId: "canonical-skill",
      isAlias: true,
      replacementId: "canonical-skill",
    });
    expect(data.availableReferences).toContain("references/guide.md");
  });

  it("returns exists=false for unknown exact skill ids", async () => {
    const manifest = createManifest();
    const result = await handleSkillValidate({ id: "missing" }, manifest, 4);
    const data = payload(result);
    expect(data).toMatchObject({
      id: "missing",
      exists: false,
      canonicalId: null,
    });
  });

  it("filters cross-skill markdown links out of availableReferences", async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "mcp-skill-validate-scope-"));
    const skillFile = path.join(dir, "SKILL.md");
    const referencesDir = path.join(dir, "references");
    mkdirSync(referencesDir, { recursive: true });
    writeFileSync(
      skillFile,
      [
        "---",
        "name: scoped-ref-skill",
        "description: scoped refs",
        "---",
        "# Skill",
        "See [Guide](references/guide.md).",
        "See [Other Skill](../other-skill/SKILL.md).",
      ].join("\n"),
      "utf8",
    );
    writeFileSync(path.join(referencesDir, "guide.md"), "# Guide", "utf8");

    const skillBytes = statSync(skillFile).size;
    const manifest: VaultManifest = {
      categories: ["general"],
      skills: [
        {
          id: "scoped-ref-skill",
          category: "general",
          path: skillFile,
          fileBytes: skillBytes,
        },
      ],
      fullCatalogBytes: skillBytes,
      fullCatalogEstimatedTokens: Math.ceil(skillBytes / 4),
    };

    const result = payload(
      await handleSkillValidate({ id: "scoped-ref-skill" }, manifest, 4),
    );
    expect(result.availableReferences).toContain("references/guide.md");
    expect(result.availableReferences).not.toContain("../other-skill/SKILL.md");
  });

  it("validates all generated alias skills against their canonical replacements", async () => {
    const { generated, runtimeManifest } = loadGeneratedCatalog();
    const aliases = generated.skills.filter(
      (skill) => skill.metadata?.replaced_by || skill.metadata?.alias_of,
    );
    const failures: Array<{ id: string; expected: string | null; actual: unknown }> = [];

    for (const alias of aliases) {
      const runtimeSkill = runtimeManifest.skills.find((skill) => skill.id === alias.id);
      if (!runtimeSkill || !existsSync(runtimeSkill.path)) {
        failures.push({
          id: alias.id,
          expected: alias.metadata?.replaced_by ?? alias.metadata?.alias_of ?? null,
          actual: "missing-skill-file",
        });
        continue;
      }

      const result = payload(
        await handleSkillValidate({ id: alias.id }, runtimeManifest, 4),
      );
      const expectedCanonical =
        alias.metadata?.replaced_by ?? alias.metadata?.alias_of ?? null;

      if (
        result.exists !== true ||
        result.canonicalId !== expectedCanonical ||
        result.isAlias !== true
      ) {
        failures.push({
          id: alias.id,
          expected: expectedCanonical,
          actual: {
            exists: result.exists,
            canonicalId: result.canonicalId,
            isAlias: result.isAlias,
          },
        });
      }
    }

    expect(failures).toEqual([]);
  });

  it("throws a wrapper guidance error when skill_validate receives workflow id", async () => {
    const manifest = createManifest();
    await expect(
      handleSkillValidate({ id: "workflow-implement-track" }, manifest, 4),
    ).rejects.toThrow("appears to be a wrapper id");
  });

  it("skips referenced markdown files in skill_get by default", async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "mcp-skill-ref-default-"));
    const skillFile = path.join(dir, "SKILL.md");
    const referencesDir = path.join(dir, "references");
    mkdirSync(referencesDir, { recursive: true });
    writeFileSync(
      skillFile,
      [
        "---",
        "name: referenced-skill",
        "description: skill with refs",
        "---",
        "# Skill",
        "See [Guide](references/guide.md).",
      ].join("\n"),
      "utf8",
    );
    writeFileSync(
      path.join(referencesDir, "guide.md"),
      "# Guide\nReferenced content",
      "utf8",
    );

    const skillBytes = statSync(skillFile).size;
    const manifest: VaultManifest = {
      categories: ["general"],
      skills: [
        {
          id: "referenced-skill",
          category: "general",
          path: skillFile,
          fileBytes: skillBytes,
        },
      ],
      fullCatalogBytes: skillBytes,
      fullCatalogEstimatedTokens: Math.ceil(skillBytes / 4),
    };

    const result = await handleSkillGet({ id: "referenced-skill" }, manifest, 4);
    expect(result.content[0].text).not.toContain("## Referenced Files");
    expect(result.content[0].text).not.toContain("### references/guide.md");
    expect(result.content[0].text).not.toContain("Referenced content");
  });

  it("includes referenced markdown files when includeReferences is true", async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "mcp-skill-ref-include-"));
    const skillFile = path.join(dir, "SKILL.md");
    const referencesDir = path.join(dir, "references");
    mkdirSync(referencesDir, { recursive: true });
    writeFileSync(
      skillFile,
      [
        "---",
        "name: referenced-skill-include-refs",
        "description: skill with refs",
        "---",
        "# Skill",
        "See [Guide](references/guide.md).",
      ].join("\n"),
      "utf8",
    );
    writeFileSync(
      path.join(referencesDir, "guide.md"),
      "# Guide\nReferenced content",
      "utf8",
    );

    const skillBytes = statSync(skillFile).size;
    const manifest: VaultManifest = {
      categories: ["general"],
      skills: [
        {
          id: "referenced-skill-include-refs",
          category: "general",
          path: skillFile,
          fileBytes: skillBytes,
        },
      ],
      fullCatalogBytes: skillBytes,
      fullCatalogEstimatedTokens: Math.ceil(skillBytes / 4),
    };

    const result = await handleSkillGet(
      { id: "referenced-skill-include-refs", includeReferences: true },
      manifest,
      4,
    );
    expect(result.content[0].text).toContain("## Referenced Files");
    expect(result.content[0].text).toContain("### references/guide.md");
    expect(result.content[0].text).toContain("Referenced content");
  });

  it("skips referenced markdown files when includeReferences is false", async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "mcp-skill-ref-skip-"));
    const skillFile = path.join(dir, "SKILL.md");
    const referencesDir = path.join(dir, "references");
    mkdirSync(referencesDir, { recursive: true });
    writeFileSync(
      skillFile,
      [
        "---",
        "name: referenced-skill-no-refs",
        "description: skill with refs",
        "---",
        "# Skill",
        "See [Guide](references/guide.md).",
      ].join("\n"),
      "utf8",
    );
    writeFileSync(path.join(referencesDir, "guide.md"), "# Guide", "utf8");

    const skillBytes = statSync(skillFile).size;
    const manifest: VaultManifest = {
      categories: ["general"],
      skills: [
        {
          id: "referenced-skill-no-refs",
          category: "general",
          path: skillFile,
          fileBytes: skillBytes,
        },
      ],
      fullCatalogBytes: skillBytes,
      fullCatalogEstimatedTokens: Math.ceil(skillBytes / 4),
    };

    const result = await handleSkillGet(
      { id: "referenced-skill-no-refs", includeReferences: false },
      manifest,
      4,
    );
    expect(result.content[0].text).not.toContain("## Referenced Files");
    expect(result.content[0].text).not.toContain("### references/guide.md");
  });

  it("does not load sibling markdown files when SKILL.md has no explicit links", async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "mcp-skill-ref-fallback-"));
    const skillFile = path.join(dir, "SKILL.md");
    writeFileSync(
      skillFile,
      [
        "---",
        "name: sibling-fallback-skill",
        "description: fallback sibling",
        "---",
        "# Skill",
      ].join("\n"),
      "utf8",
    );
    writeFileSync(path.join(dir, "overview.md"), "# Overview\nSibling", "utf8");

    const skillBytes = statSync(skillFile).size;
    const manifest: VaultManifest = {
      categories: ["general"],
      skills: [
        {
          id: "sibling-fallback-skill",
          category: "general",
          path: skillFile,
          fileBytes: skillBytes,
        },
      ],
      fullCatalogBytes: skillBytes,
      fullCatalogEstimatedTokens: Math.ceil(skillBytes / 4),
    };

    const result = await handleSkillGet(
      { id: "sibling-fallback-skill" },
      manifest,
      4,
    );
    expect(result.content[0].text).not.toContain("## Referenced Files");
    expect(result.content[0].text).not.toContain("### overview.md");
    expect(result.content[0].text).not.toContain("Sibling");
  });

  it("throws when skill_get cannot find the requested skill", async () => {
    const manifest = createManifest();
    await expect(handleSkillGet({ id: "missing" }, manifest, 4)).rejects.toThrow(
      'Skill not found: "missing"',
    );
  });

  it("throws a wrapper guidance error when skill_get receives workflow id", async () => {
    const manifest = createManifest();
    await expect(
      handleSkillGet({ id: "workflow-implement-track" }, manifest, 4),
    ).rejects.toThrow("appears to be a wrapper id");
  });

  it("throws a wrapper guidance error when skill_get receives agent id", async () => {
    const manifest = createManifest();
    await expect(
      handleSkillGet({ id: "agent-backend-specialist" }, manifest, 4),
    ).rejects.toThrow("appears to be a wrapper id");
  });

  it("returns one validated reference file for skill_get_reference", async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "mcp-skill-ref-single-"));
    const skillFile = path.join(dir, "SKILL.md");
    const referencesDir = path.join(dir, "references");
    mkdirSync(referencesDir, { recursive: true });
    writeFileSync(
      skillFile,
      [
        "---",
        "name: single-ref-skill",
        "description: one ref",
        "---",
        "# Skill",
        "See [Guide](references/guide.md).",
      ].join("\n"),
      "utf8",
    );
    writeFileSync(
      path.join(referencesDir, "guide.md"),
      "# Guide\nOne file only",
      "utf8",
    );

    const skillBytes = statSync(skillFile).size;
    const manifest: VaultManifest = {
      categories: ["general"],
      skills: [
        {
          id: "single-ref-skill",
          category: "general",
          path: skillFile,
          fileBytes: skillBytes,
        },
      ],
      fullCatalogBytes: skillBytes,
      fullCatalogEstimatedTokens: Math.ceil(skillBytes / 4),
    };

    const result = await handleSkillGetReference(
      { id: "single-ref-skill", path: "references/guide.md" },
      manifest,
      4,
    );
    expect(result.content[0].text).toBe("# Guide\nOne file only");
    expect(result.structuredContent).toMatchObject({
      skillId: "single-ref-skill",
      path: "references/guide.md",
    });
  });

  it("rejects invalid reference paths for skill_get_reference", async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "mcp-skill-ref-invalid-"));
    const skillFile = path.join(dir, "SKILL.md");
    writeFileSync(
      skillFile,
      ["---", "name: invalid-ref-skill", "description: invalid", "---", "# Skill"].join(
        "\n",
      ),
      "utf8",
    );
    const skillBytes = statSync(skillFile).size;
    const manifest: VaultManifest = {
      categories: ["general"],
      skills: [
        {
          id: "invalid-ref-skill",
          category: "general",
          path: skillFile,
          fileBytes: skillBytes,
        },
      ],
      fullCatalogBytes: skillBytes,
      fullCatalogEstimatedTokens: Math.ceil(skillBytes / 4),
    };

    await expect(
      handleSkillGetReference(
        { id: "invalid-ref-skill", path: "../secret.md" },
        manifest,
        4,
      ),
    ).rejects.toThrow("Reference path");
  });

  it("returns consolidated budget rollup for selected and loaded skills", () => {
    const manifest = createManifest();
    const result = handleSkillBudgetReport(
      {
        selectedSkillIds: ["react-expert", "missing-skill"],
        loadedSkillIds: ["react-expert"],
      },
      manifest,
      4,
    );
    const data = payload(result);

    expect(data.skillLog).toBeDefined();
    expect(data.contextBudget).toMatchObject({
      fullCatalogEstimatedTokens: manifest.fullCatalogEstimatedTokens,
      estimated: true,
    });
    expect(
      (data.skillLog as Record<string, unknown>).unknownSelectedSkillIds,
    ).toContain("missing-skill");
  });
});
