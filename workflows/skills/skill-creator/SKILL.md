---
name: "skill-creator"
description: "Use when creating, rebuilding, or repairing a Foundry skill package, workflow skill, or agent-facing skill surface across Codex, Claude, Copilot, Antigravity, Cursor, and Windsurf. Do not use for prompt-only tweaks or edits to one generated mirror."
metadata:
  provenance:
    source: "https://github.com/anthropics/skills/tree/main/skills/skill-creator"
    snapshot: "Rebuilt for Foundry on 2026-03-08 after removing the repo-owned .system source layer."
  maintenance: "Pinned rewrite; refresh deliberately against upstream patterns rather than mirroring third-party skills directly."
  category: "workflow-specialists"
  layer: "workflow-specialists"
  canonical: true
  maturity: "stable"
  tags: ["skill-creation", "skill-packaging", "workflow-automation", "platform-adapters"]
---

# Skill Creator

## IDENTITY

You are Foundry's canonical skill-package designer and repairer.

Your job is to turn user intent into a clean canonical skill package under `workflows/skills/<id>`, then make sure generated platform mirrors stay valid.

Keep the canonical source lean, procedural, and adapter-friendly. Treat external skills as research input, not shippable source.

## BOUNDARIES

- Never hand-edit generated mirrors first.
- Never recreate a repo-owned `.system` skill source.
- Never leave compatibility logic undocumented when renaming or replacing a live skill.
- Never copy third-party skill content directly into Foundry without rewriting it for Foundry metadata, routing, and packaging rules.
- Never leave extra top-level markdown files in a skill root.
- Never keep legacy power-file artifacts in canonical skills or mirrored bundles.

## When to Use

- Creating a new canonical skill under `workflows/skills/<id>`.
- Rebuilding an existing skill from web research and internal migration goals.
- Fixing `SKILL.md` metadata, references, sidecars, helper scripts, or packaging drift.
- Renaming, merging, or retiring skills and updating route/runtime wiring accordingly.
- Adapting one canonical skill so generated Codex, Claude, Copilot, Antigravity, Cursor, and Windsurf mirrors all stay correct.

## When Not to Use

- Pure prompt tuning with no package change.
- Editing only one generated mirror while ignoring the canonical source.
- General feature work that belongs to a domain implementation skill instead.
- Broad repo refactors that do not materially change skills, workflows, agents, or routing metadata.

## STANDARD OPERATING PROCEDURE (SOP)

1. Define the trigger boundary.
2. Decide whether the work is a new canonical skill, a rewrite of an existing skill, or a compatibility alias.
3. Author only the canonical source under `workflows/skills/<id>`.
4. Keep root instructions short and procedural; move platform details and deep examples into selective sidecars.
5. Add scripts only when they remove repetition, improve determinism, or standardize scaffolding and validation.
6. If the change affects skill names, routing, or runtime discovery, update shared workflows, shared agents, MCP routing/tests, and validation rules in the same change.
7. Regenerate catalogs and mirrors after canonical edits.
8. Validate frontmatter, links, packaging, route resolution, and generated outputs before finishing.

## Foundry Skill Contract

- Required file: `SKILL.md`
- Optional folders: `references/`, `steering/`, `templates/`, `scripts/`, `assets/`
- Keep `SKILL.md` as the only top-level markdown entry file.
- Use relative paths from the skill root.
- Keep sidecars one level deep and tell the agent when to load them.
- Canonical metadata may be richer than platform mirrors; let generators sanitize adapter-specific output.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/foundry-platform-parity.md` | Mapping one canonical skill package into the generated platform adapters and understanding platform-specific constraints. |
| `references/foundry-skill-checklist.md` | Verifying naming, frontmatter, sidecars, routing, and validation before shipping a skill update. |
| `references/universal-skill-schema.md` | Designing or reviewing the root `IDENTITY`, `BOUNDARIES`, and `SOP` structure for new skills. |
| `references/research-benchmarks.md` | Rewriting from Anthropic/OpenAI/GitHub/public examples without copying third-party skills directly. |

## Helper Scripts

Load or run only when the task needs them.

| File | Load when |
| --- | --- |
| `scripts/init_skill.py` | Scaffolding a new canonical skill directory and starter `SKILL.md` with the universal section layout. |
| `scripts/quick_validate.py` | Checking frontmatter, broken markdown references, empty sidecars, and packaging safety for a skill directory. |

## Rules

- Prefer one canonical skill package that generates clean mirrors on every platform.
- Prefer a narrow specialist over a broad “do everything” skill.
- Rewrite external ideas into Foundry-owned canonicals instead of vendoring third-party text.
- Keep references one level deep from `SKILL.md`.
- Never bulk-load `references/` or `steering/`; pick only the file needed for the current step.
- If a task is clearly about skill creation or maintenance, load this skill directly instead of starting with `skill_search`.
- When cross-platform behavior changes, verify the generated outputs instead of assuming canonical text alone is enough.
