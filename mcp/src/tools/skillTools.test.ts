import { describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { VaultManifest } from "../vault/types.js";
import { handleSkillBrowseCategory } from "./skillBrowseCategory.js";
import { handleSkillBudgetReport } from "./skillBudgetReport.js";
import { handleSkillGet } from "./skillGet.js";
import { handleSkillListCategories } from "./skillListCategories.js";
import { handleSkillSearch } from "./skillSearch.js";

function payload(result: { content: Array<{ text: string }> }): Record<string, unknown> {
  return JSON.parse(result.content[0].text) as Record<string, unknown>;
}

function metrics(result: { structuredContent?: Record<string, unknown> }): Record<string, unknown> {
  return (result.structuredContent?.metrics || {}) as Record<string, unknown>;
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
      },
      {
        id: "fastapi-expert",
        category: "backend",
        path: fastapiFile,
        fileBytes: fastapiBytes,
      },
    ],
    fullCatalogBytes,
    fullCatalogEstimatedTokens: Math.ceil(fullCatalogBytes / 4),
  };
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

  it("returns full skill content for skill_get", async () => {
    const manifest = createManifest();
    const result = await handleSkillGet({ id: "react-expert" }, manifest, 4);
    const toolMetrics = metrics(result);

    expect(result.content[0].text).toContain("# Content");
    expect(result.content[0].text).toContain("description: React performance");
    expect(toolMetrics.loadedSkillEstimatedTokens).toBeGreaterThan(0);
  });

  it("includes referenced markdown files in skill_get by default", async () => {
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

  it("loads sibling markdown files when SKILL.md has no explicit links", async () => {
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
    expect(result.content[0].text).toContain("## Referenced Files");
    expect(result.content[0].text).toContain("### overview.md");
    expect(result.content[0].text).toContain("Sibling");
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
