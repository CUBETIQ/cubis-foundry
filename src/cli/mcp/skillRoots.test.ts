import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveMcpSkillRootCandidates } from "./skillRoots.js";

describe("resolveMcpSkillRootCandidates", () => {
  it("returns an explicit skills root ahead of auto-detection", () => {
    const cwd = path.join("D:", "repo", "workspace");
    const candidates = resolveMcpSkillRootCandidates({
      scope: "project",
      cwd,
      explicitSkillsRoot: ".custom-skills",
      homeDir: path.join("C:", "Users", "tester"),
    });

    expect(candidates).toEqual([path.resolve(cwd, ".custom-skills")]);
  });

  it("prefers foundry modules before installed skill mirrors in project scope", () => {
    const workspaceRoot = path.join("D:", "repo", "workspace");
    const candidates = resolveMcpSkillRootCandidates({
      scope: "project",
      cwd: path.join(workspaceRoot, "packages", "app"),
      homeDir: path.join("C:", "Users", "tester"),
      workspaceRoot,
    });

    expect(candidates.slice(0, 5)).toEqual([
      path.join(workspaceRoot, "foundry", "modules"),
      path.join(workspaceRoot, "workflows", "skills"),
      path.join(workspaceRoot, ".agents", "skills"),
      path.join(workspaceRoot, ".github", "skills"),
      path.join(workspaceRoot, ".agent", "skills"),
    ]);
  });

  it("prefers home installs before workspace roots in global scope", () => {
    const workspaceRoot = path.join("D:", "repo", "workspace");
    const homeDir = path.join("C:", "Users", "tester");
    const candidates = resolveMcpSkillRootCandidates({
      scope: "global",
      cwd: workspaceRoot,
      homeDir,
      workspaceRoot,
    });

    expect(candidates.slice(0, 3)).toEqual([
      path.join(homeDir, ".agents", "skills"),
      path.join(homeDir, ".copilot", "skills"),
      path.join(homeDir, ".gemini", "antigravity", "skills"),
    ]);
    expect(candidates).toContain(path.join(workspaceRoot, "foundry", "modules"));
  });
});
