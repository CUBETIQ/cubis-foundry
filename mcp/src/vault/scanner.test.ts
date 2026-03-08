import { afterEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { scanVaultRoots } from "./scanner.js";

const tempDirs: string[] = [];

function createTempDir(prefix: string): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

function createSkill(root: string, id: string): void {
  const skillDir = path.join(root, id);
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(
    path.join(skillDir, "SKILL.md"),
    `---\nname: ${id}\ndescription: ${id} description\n---\n`,
    "utf8",
  );
}

function createSkillFromContent(root: string, id: string, content: string): void {
  const skillDir = path.join(root, id);
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(path.join(skillDir, "SKILL.md"), content, "utf8");
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("scanVaultRoots", () => {
  it("discovers skill pointers and derives categories from skill ids", async () => {
    const root = createTempDir("mcp-vault-");
    createSkill(root, "react-expert");
    createSkill(root, "database-design");
    createSkill(root, "custom-skill");

    // Hidden directory should be skipped.
    const hidden = path.join(root, ".hidden");
    mkdirSync(hidden, { recursive: true });
    writeFileSync(path.join(hidden, "SKILL.md"), "ignored", "utf8");

    const skills = await scanVaultRoots([root], "/unused");
    const byId = Object.fromEntries(
      skills.map((skill) => [skill.id, skill.category]),
    );

    expect(skills).toHaveLength(3);
    expect(byId["react-expert"]).toBe("frontend");
    expect(byId["database-design"]).toBe("data");
    expect(byId["custom-skill"]).toBe("general");
    expect(skills.every((skill) => skill.fileBytes > 0)).toBe(true);
  });

  it("skips missing roots and continues scanning valid roots", async () => {
    const validRoot = createTempDir("mcp-vault-valid-");
    createSkill(validRoot, "qa-automation-engineer");

    const skills = await scanVaultRoots(
      ["/definitely/missing/root", validRoot],
      "/unused",
    );

    expect(skills).toHaveLength(1);
    expect(skills[0].id).toBe("qa-automation-engineer");
    expect(skills[0].category).toBe("testing");
  });

  it("excludes codex wrapper skills from vault discovery", async () => {
    const root = createTempDir("mcp-vault-wrapper-");

    createSkill(root, "lint-and-validate");
    createSkill(root, "tdd-workflow");
    createSkill(root, "workflow-implement-track");
    createSkill(root, "agent-backend-specialist");
    createSkillFromContent(
      root,
      "custom-wrapper-id",
      [
        "---",
        "name: custom-wrapper-id",
        "description: Wrapper by metadata only",
        "metadata:",
        "  wrapper: workflow",
        "---",
        "",
        "# wrapper",
        "",
      ].join("\n"),
    );

    const skills = await scanVaultRoots([root], "/unused");
    const ids = skills.map((s) => s.id).sort();

    expect(ids).toEqual(["lint-and-validate", "tdd-workflow"]);
  });

  it("synthesizes compatibility aliases from canonical metadata", async () => {
    const root = createTempDir("mcp-vault-alias-");
    createSkillFromContent(
      root,
      "react-best-practices",
      [
        "---",
        "name: react-best-practices",
        "description: React review checklist",
        "metadata:",
        "  aliases: [nextjs-react-expert]",
        "---",
        "# Skill",
      ].join("\n"),
    );

    const skills = await scanVaultRoots([root], "/unused");
    const canonical = skills.find((skill) => skill.id === "react-best-practices");
    const alias = skills.find((skill) => skill.id === "nextjs-react-expert");

    expect(canonical?.canonicalId).toBeUndefined();
    expect(alias).toMatchObject({
      id: "nextjs-react-expert",
      canonicalId: "react-best-practices",
      category: "frontend",
      path: canonical?.path,
    });
  });
});
