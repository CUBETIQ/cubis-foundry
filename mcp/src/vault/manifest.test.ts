import { afterEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  buildManifest,
  enrichWithDescriptions,
  extractDescription,
  parseDescriptionFromFrontmatter,
  readFullSkillContent,
  readSkillContentWithReferences,
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

  it("loads direct local markdown references from SKILL.md", async () => {
    const dir = createTempDir("mcp-refs-read-");
    const file = path.join(dir, "SKILL.md");
    const refsDir = path.join(dir, "references");
    const refFile = path.join(refsDir, "guide.md");
    const nestedRefFile = path.join(dir, "notes.md");

    writeFileSync(
      file,
      [
        "---",
        "name: ref-read",
        "description: Read refs",
        "---",
        "# Skill",
        "See [Guide](references/guide.md).",
        "See [Notes](notes.md#section).",
        "Ignore [External](https://example.com).",
      ].join("\n"),
      "utf8",
    );
    mkdirSync(refsDir, { recursive: true });
    writeFileSync(refFile, "# Guide\nReference body", "utf8");
    writeFileSync(nestedRefFile, "# Notes\nMore details", "utf8");

    const result = await readSkillContentWithReferences(file, true);
    expect(result.skillContent).toContain("# Skill");
    expect(result.references).toEqual([
      { relativePath: "references/guide.md", content: "# Guide\nReference body" },
      { relativePath: "notes.md", content: "# Notes\nMore details" },
    ]);
  });

  it("skips references when includeReferences is false", async () => {
    const dir = createTempDir("mcp-refs-skip-");
    const file = path.join(dir, "SKILL.md");
    const refFile = path.join(dir, "reference.md");
    writeFileSync(
      file,
      ["---", "name: skip", "description: skip", "---", "[Ref](reference.md)"].join(
        "\n",
      ),
      "utf8",
    );
    writeFileSync(refFile, "ref", "utf8");

    const result = await readSkillContentWithReferences(file, false);
    expect(result.references).toEqual([]);
  });

  it("falls back to sibling markdown files when SKILL.md has no links", async () => {
    const dir = createTempDir("mcp-refs-fallback-");
    const file = path.join(dir, "SKILL.md");
    const siblingRef = path.join(dir, "overview.md");
    writeFileSync(
      file,
      ["---", "name: fallback", "description: fallback", "---", "# Skill"].join(
        "\n",
      ),
      "utf8",
    );
    writeFileSync(siblingRef, "# Overview\nSibling content", "utf8");

    const result = await readSkillContentWithReferences(file, true);
    expect(result.references).toEqual([
      { relativePath: "overview.md", content: "# Overview\nSibling content" },
    ]);
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
        { id: "alpha", category: "general", path: fileA, fileBytes: 64 },
        {
          id: "beta",
          category: "general",
          path: fileB,
          fileBytes: 64,
          description: "Already populated",
        },
      ],
      100,
    );

    expect(enriched[0].description).toBe("Alpha description");
    expect(enriched[1].description).toBe("Already populated");
  });
});

describe("buildManifest", () => {
  it("computes full catalog byte and token totals", () => {
    const manifest = buildManifest(
      [
        { id: "a", category: "general", path: "/tmp/a.md", fileBytes: 20 },
        { id: "b", category: "frontend", path: "/tmp/b.md", fileBytes: 12 },
      ],
      4,
    );

    expect(manifest.categories).toEqual(["frontend", "general"]);
    expect(manifest.fullCatalogBytes).toBe(32);
    expect(manifest.fullCatalogEstimatedTokens).toBe(8);
  });
});
