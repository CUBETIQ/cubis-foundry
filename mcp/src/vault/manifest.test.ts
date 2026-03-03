import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  enrichWithDescriptions,
  extractDescription,
  parseDescriptionFromFrontmatter,
  readFullSkillContent,
} from "./manifest.js";

const tempDirs: string[] = [];

function createTempDir(prefix: string): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("frontmatter description parsing", () => {
  it("extracts a quoted description", () => {
    const content = [
      "---",
      'name: "react-expert"',
      'description: "React architecture and performance best practices"',
      "---",
      "# React Expert",
    ].join("\n");

    expect(parseDescriptionFromFrontmatter(content, 200)).toBe(
      "React architecture and performance best practices",
    );
  });

  it("truncates long descriptions with ellipsis", () => {
    const content = [
      "---",
      "name: long-skill",
      "description: This is a very long description for testing truncation behavior",
      "---",
    ].join("\n");

    expect(parseDescriptionFromFrontmatter(content, 24)).toBe(
      "This is a very long d...",
    );
  });

  it("returns undefined when frontmatter description is missing", () => {
    const content = ["---", "name: no-description", "---", "# Body"].join("\n");
    expect(parseDescriptionFromFrontmatter(content, 100)).toBeUndefined();
  });
});

describe("skill content IO", () => {
  it("extracts description from file content", async () => {
    const dir = createTempDir("mcp-manifest-");
    const file = path.join(dir, "SKILL.md");
    writeFileSync(
      file,
      ["---", "name: test-skill", "description: Fast API design patterns", "---"].join(
        "\n",
      ),
      "utf8",
    );

    await expect(extractDescription(file, 100)).resolves.toBe(
      "Fast API design patterns",
    );
  });

  it("returns undefined when file cannot be read", async () => {
    await expect(extractDescription("/missing/skill.md", 100)).resolves.toBeUndefined();
  });

  it("returns full skill file contents", async () => {
    const dir = createTempDir("mcp-full-read-");
    const file = path.join(dir, "SKILL.md");
    const body = "---\nname: full-read\ndescription: Full body\n---\n# Content";
    writeFileSync(file, body, "utf8");

    await expect(readFullSkillContent(file)).resolves.toBe(body);
  });
});

describe("manifest enrichment", () => {
  it("enriches missing descriptions and keeps existing descriptions", async () => {
    const dir = createTempDir("mcp-enrich-");
    const fileA = path.join(dir, "a.md");
    const fileB = path.join(dir, "b.md");
    writeFileSync(
      fileA,
      ["---", "name: alpha", "description: Alpha description", "---"].join("\n"),
      "utf8",
    );
    writeFileSync(
      fileB,
      ["---", "name: beta", "description: Beta description", "---"].join("\n"),
      "utf8",
    );

    const enriched = await enrichWithDescriptions(
      [
        { id: "alpha", category: "general", path: fileA },
        {
          id: "beta",
          category: "general",
          path: fileB,
          description: "Already populated",
        },
      ],
      100,
    );

    expect(enriched[0].description).toBe("Alpha description");
    expect(enriched[1].description).toBe("Already populated");
  });
});
