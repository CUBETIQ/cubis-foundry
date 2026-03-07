---
name: "skill-authoring"
description: "Use when creating a new Foundry skill or updating an existing one: scaffolding SKILL.md, fixing metadata, wiring references and scripts, removing legacy power files, and making the package work across Codex, Antigravity, Copilot, Cursor, and Windsurf. Do not use for prompt tuning without a skill package change or for editing only one generated mirror."
metadata:
  provenance:
    source: "https://github.com/anthropics/skills/tree/main/skills/skill-creator"
    snapshot: "Adapted from the local Codex system skill on 2026-03-06"
  maintenance: "Pinned snapshot; refresh manually when upstream changes are intentionally adopted."
---

# Skill Authoring

## Overview

Use this skill to create or repair Foundry skills from the canonical source layer. It is adapted from Anthropic's `skill-creator`, but rewritten for Foundry's cross-platform model and packaging rules.

## When to Use

- Creating a new skill under `workflows/skills/<id>`
- Updating `name`, `description`, `metadata`, or `compatibility` in `SKILL.md`
- Repairing broken `references/`, `steering/`, or `templates/` links
- Replacing legacy power-file patterns with canonical skill packaging
- Adapting a skill so its generated Codex, Antigravity, Copilot, Cursor, and Windsurf bundles stay valid
- Adding or updating helper scripts that make a skill deterministic and reusable

## When Not to Use

- Pure prompt tuning with no skill package changes
- Editing only a generated mirror when the canonical source is unchanged
- General feature work that should route to an implementation, review, or domain skill instead

## Core Workflow

1. Clarify the trigger boundary and package scope with concrete examples.
2. Edit the canonical skill only. Never hand-edit platform mirrors first.
3. Keep `SKILL.md` concise and move variant detail into one-level-deep sidecar files.
4. Add scripts only when they remove repetition or make execution more reliable.
5. Validate frontmatter, links, sidecar content, and platform packaging before finishing.
6. Regenerate mirrors and rule assets, then verify the skill is discoverable and readable at runtime.

## Foundry Skill Contract

- Required file: `SKILL.md`
- Optional folders: `references/`, `steering/`, `templates/`, `scripts/`, `assets/`
- Keep only `SKILL.md` at the skill root. Do not leave extra top-level markdown files.
- Use relative paths from the skill root, not platform-specific absolute paths.
- Reference files must be loaded selectively with explicit `Load when` guidance.
- Do not ship legacy power files in canonical or platform-facing skill bundles.
- Canonical metadata can stay richer, but platform mirrors are generated and sanitized automatically.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/foundry-platform-parity.md` | Adapting a skill for Codex, Antigravity, Copilot, Cursor, or Windsurf packaging and metadata rules. |
| `references/foundry-skill-checklist.md` | Verifying naming, frontmatter, sidecars, routing, and validation before shipping a skill update. |

## Helper Scripts

Load or run only when the task needs them.

| File | Load when |
| --- | --- |
| `scripts/init_skill.py` | Scaffolding a new canonical skill directory and starter `SKILL.md`. |
| `scripts/quick_validate.py` | Checking frontmatter, broken markdown references, empty sidecars, and packaging safety for a skill directory. |

## Rules

- Prefer one canonical skill package that generates clean mirrors on every platform.
- Keep references one level deep from `SKILL.md`.
- Never bulk-load `references/` or `steering/`; pick only the file needed for the current step.
- If a task is clearly about skill creation or maintenance, load this skill directly instead of starting with `skill_search`.
- When cross-platform behavior changes, verify the generated outputs instead of assuming canonical text alone is enough.
