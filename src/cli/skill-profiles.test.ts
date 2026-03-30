import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { listCanonicalSkillIds, resolveSkillProfileIds } from "./skill-profiles.js";

function makeTempRoot(prefix: string) {
  const root = join(
    tmpdir(),
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  );
  mkdirSync(root, { recursive: true });
  return root;
}

function writeSkill(root: string, skillId: string) {
  const skillDir = join(root, "foundry", "modules", skillId);
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(join(skillDir, "SKILL.md"), `# ${skillId}\n`, "utf8");
}

describe("skill profiles", () => {
  it("lists canonical skill ids from foundry/modules", async () => {
    const root = makeTempRoot("foundry-skill-profiles");
    writeSkill(root, "api-design");
    writeSkill(root, "web-testing");

    await expect(listCanonicalSkillIds(root)).resolves.toEqual([
      "api-design",
      "web-testing",
    ]);
  });

  it("reads curated profile files and filters missing ids", async () => {
    const root = makeTempRoot("foundry-skill-profiles");
    writeSkill(root, "api-design");
    writeSkill(root, "web-testing");
    const profileDir = join(root, "foundry", "catalogs", "skill-profiles");
    mkdirSync(profileDir, { recursive: true });
    writeFileSync(
      join(profileDir, "web-backend.json"),
      JSON.stringify({
        profile: "web-backend",
        skills: ["api-design", "missing-skill", "api-design", "web-testing"],
      }),
      "utf8",
    );

    await expect(resolveSkillProfileIds("web-backend", root)).resolves.toEqual([
      "api-design",
      "web-testing",
    ]);
  });

  it("treats full as all canonical skills", async () => {
    const root = makeTempRoot("foundry-skill-profiles");
    writeSkill(root, "api-design");
    writeSkill(root, "web-testing");

    await expect(resolveSkillProfileIds("full", root)).resolves.toEqual([
      "api-design",
      "web-testing",
    ]);
  });
});
