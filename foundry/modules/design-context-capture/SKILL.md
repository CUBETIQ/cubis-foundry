---
name: design-context-capture
description: Capture or refresh the project's canonical design context in `docs/foundation/DESIGN.md` so downstream design, implementation, and QA skills stop relying on vague taste or one-off prompts.
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot, Gemini CLI, Antigravity
---

# Design Context Capture

## Purpose

Establish the short, durable design document that the rest of Foundry should treat as the source of truth for visual direction. Use this when a repo has no coherent design context yet, when the design language has drifted, or when a benchmark needs to be translated into Foundry-owned language instead of copied raw.

## When to Use

- Starting a new product surface with no canonical design context
- Refreshing design intent after major UI drift
- Translating benchmark references into project-owned design rules
- Preparing the repo for `frontend-design`, Stitch work, or UI harness runs

## Instructions

1. **Use `docs/foundation/DESIGN.md` as the canonical path** — Create it when missing and refresh it when stale because downstream skills need one predictable place for design truth.
2. **Capture design decisions, not moodboard prose** — Record typography voice, palette behavior, spacing rhythm, composition moves, motion rules, state principles, and anti-patterns in short operational language.
3. **Ground the file in repo or benchmark evidence** — Pull from existing product surfaces, screenshots, fixtures, or approved references because the goal is to encode intent that can be executed and reviewed.
4. **State what must not happen** — List banned defaults such as card nesting, default system typography, generic gradients, or weak mobile collapse because exclusions are part of anti-slop control.
5. **Keep it compact** — A concise design context is more reusable than a giant narrative brief. Prefer bullets and short sections over long prose.
6. **Route external references through Foundry language** — Convert benchmarks into Foundry-owned terms instead of copying raw prompts or long passages.
7. **Feed follow-on work into the right skill** — Use `frontend-design-style-selector` and `frontend-design-screen-brief` for new work, or the remediation skills when fixing existing UI.
8. **Mirror for Stitch only when needed** — If the task explicitly enters a Stitch flow, hand the resolved design state to `stitch-design-system` so `.stitch/DESIGN.md` stays aligned.

## Output Format

Deliver:

1. Canonical path used or created
2. Short design thesis
3. Typography, palette, spacing, composition, and motion rules
4. Explicit anti-patterns to avoid
5. Recommended next design skill

## References

| File | Load when |
| --- | --- |
| `../frontend-design/references/visual-direction.md` | Defining the point of view, dominant motif, and anti-generic checks. |
| `../frontend-design/references/design-tokens.md` | Translating visual language into token-ready rules. |
| `../stitch-design-system/SKILL.md` | The task also needs Stitch-facing design state kept in sync. |
