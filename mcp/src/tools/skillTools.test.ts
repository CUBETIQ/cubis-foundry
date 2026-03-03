import { describe, expect, it } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { VaultManifest } from "../vault/types.js";
import { handleSkillBrowseCategory } from "./skillBrowseCategory.js";
import { handleSkillGet } from "./skillGet.js";
import { handleSkillListCategories } from "./skillListCategories.js";
import { handleSkillSearch } from "./skillSearch.js";

function payload(result: { content: Array<{ text: string }> }): Record<string, unknown> {
  return JSON.parse(result.content[0].text) as Record<string, unknown>;
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

  return {
    categories: ["backend", "frontend"],
    skills: [
      { id: "react-expert", category: "frontend", path: reactFile },
      { id: "fastapi-expert", category: "backend", path: fastapiFile },
    ],
  };
}

describe("skill tools", () => {
  it("lists categories with skill counts", () => {
    const manifest = createManifest();
    const result = handleSkillListCategories(manifest);
    const data = payload(result);

    expect(data.totalSkills).toBe(2);
    expect(data.categories).toEqual([
      { category: "backend", skillCount: 1 },
      { category: "frontend", skillCount: 1 },
    ]);
  });

  it("browses a category with enriched descriptions", async () => {
    const manifest = createManifest();
    const result = await handleSkillBrowseCategory(
      { category: "frontend" },
      manifest,
      200,
    );
    const data = payload(result);

    expect(data.category).toBe("frontend");
    expect(data.count).toBe(1);
    expect(data.skills).toEqual([
      {
        id: "react-expert",
        description: "React performance and architecture guidance",
      },
    ]);
  });

  it("throws when browsing an unknown category", async () => {
    const manifest = createManifest();
    await expect(
      handleSkillBrowseCategory({ category: "mobile" }, manifest, 200),
    ).rejects.toThrow('Category not found: "mobile"');
  });

  it("searches by skill id and by description fallback", async () => {
    const manifest = createManifest();

    const byId = payload(
      await handleSkillSearch({ query: "react" }, manifest, 200),
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
      await handleSkillSearch({ query: "async backend" }, manifest, 200),
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
    const result = await handleSkillGet({ id: "react-expert" }, manifest);

    expect(result.content[0].text).toContain("# Content");
    expect(result.content[0].text).toContain("description: React performance");
  });

  it("throws when skill_get cannot find the requested skill", async () => {
    const manifest = createManifest();
    await expect(handleSkillGet({ id: "missing" }, manifest)).rejects.toThrow(
      'Skill not found: "missing"',
    );
  });
});
