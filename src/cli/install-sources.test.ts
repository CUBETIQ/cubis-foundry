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

  it("returns the bundle path when the bundle platform tree is absent so callers fail on missing generated sources", () => {
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

  it("does not use runtime destination candidates once the bundle source tree is authoritative again", () => {
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

    expect(resolved).not.toBe(runtimeSource);
    expect(resolved).toBe(
      join(
        root,
        "workflows",
        "workflows",
        "agent-environment-setup",
        "platforms",
        "codex",
        "generated-skills",
        "plan",
      ),
    );
  });

  it("falls back to a repo-relative source when the bundle source is intentionally rooted elsewhere", () => {
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
