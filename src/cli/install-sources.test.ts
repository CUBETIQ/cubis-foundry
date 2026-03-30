import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { resolveInstallSourcePath } from "./install-sources.js";

function makeTempRoot(prefix: string) {
  const root = join(
    tmpdir(),
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  );
  mkdirSync(root, { recursive: true });
  return root;
}

describe("resolveInstallSourcePath()", () => {
  it("prefers the legacy bundle platform source tree when it exists", () => {
    const root = makeTempRoot("foundry-install-source");
    const bundleSource = join(
      root,
      "workflows",
      "workflows",
      "agent-environment-setup",
      "platforms",
      "codex",
      "agents",
      "debugger.toml",
    );
    mkdirSync(join(bundleSource, ".."), { recursive: true });
    writeFileSync(bundleSource, "bundle-source", "utf8");

    const resolved = resolveInstallSourcePath({
      repoRoot: root,
      bundleId: "agent-environment-setup",
      platform: "codex",
      relativeSourcePath: join("agents", "debugger.toml"),
      workspaceRelativeDestinationPath: ".codex/agents/debugger.toml",
    });

    expect(resolved).toBe(bundleSource);
  });

  it("falls back to generated runtime assets when the bundle platform tree is absent", () => {
    const root = makeTempRoot("foundry-install-source");
    const runtimeSource = join(
      root,
      "generated",
      "runtime-assets",
      "codex",
      ".codex",
      "agents",
      "debugger.toml",
    );
    mkdirSync(join(runtimeSource, ".."), { recursive: true });
    writeFileSync(runtimeSource, "runtime-source", "utf8");

    const resolved = resolveInstallSourcePath({
      repoRoot: root,
      bundleId: "agent-environment-setup",
      platform: "codex",
      relativeSourcePath: join("agents", "debugger.toml"),
      workspaceRelativeDestinationPath: ".codex/agents/debugger.toml",
    });

    expect(resolved).toBe(runtimeSource);
  });

  it("returns the legacy bundle path when neither source exists so callers preserve current error reporting", () => {
    const root = makeTempRoot("foundry-install-source");

    const resolved = resolveInstallSourcePath({
      repoRoot: root,
      bundleId: "agent-environment-setup",
      platform: "codex",
      relativeSourcePath: join("agents", "debugger.toml"),
      workspaceRelativeDestinationPath: ".codex/agents/debugger.toml",
    });

    expect(resolved).toBe(
      join(
        root,
        "workflows",
        "workflows",
        "agent-environment-setup",
        "platforms",
        "codex",
        "agents",
        "debugger.toml",
      ),
    );
  });

  it("tries multiple runtime destination candidates in order", () => {
    const root = makeTempRoot("foundry-install-source");
    const runtimeSource = join(
      root,
      "generated",
      "runtime-assets",
      "codex",
      ".agents",
      "skills",
      "workflow-plan",
    );
    mkdirSync(runtimeSource, { recursive: true });

    const resolved = resolveInstallSourcePath({
      repoRoot: root,
      bundleId: "agent-environment-setup",
      platform: "codex",
      relativeSourcePath: join("generated-skills", "plan"),
      workspaceRelativeDestinationPaths: [
        ".agents/skills/plan",
        ".agents/skills/workflow-plan",
      ],
    });

    expect(resolved).toBe(runtimeSource);
  });

  it("falls back to a repo-relative source when runtime assets are absent", () => {
    const root = makeTempRoot("foundry-install-source");
    const repoSource = join(root, "AGENTS.md");
    writeFileSync(repoSource, "# Rules\n", "utf8");

    const resolved = resolveInstallSourcePath({
      repoRoot: root,
      bundleId: "agent-environment-setup",
      platform: "codex",
      relativeSourcePath: "platforms/codex/rules/AGENTS.md",
      workspaceRelativeDestinationPath: "AGENTS.md",
      repoRelativeFallbackPath: "AGENTS.md",
    });

    expect(resolved).toBe(repoSource);
  });
});
