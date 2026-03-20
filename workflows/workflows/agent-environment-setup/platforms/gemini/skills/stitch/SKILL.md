---
name: stitch
description: Compatibility wrapper for explicit `stitch` requests. Use this when older docs or users name `stitch` directly and route them into the design-first Stitch sequence: frontend-design, prompt enhancement, design-system sync, Stitch orchestration, and implementation handoff.
---
# Stitch Compatibility Wrapper

## Purpose

Preserve compatibility for users or older instructions that still say “use stitch”. This package no longer acts as the one broad Stitch skill. It now routes work into the narrower Stitch skill family so UI generation stays design-first and safe against overuse of the remote Stitch service.

## When to Use

- A user explicitly names `stitch` as the skill to use
- Older generated docs or team notes still reference `stitch`
- You need a compatibility bridge into the current Stitch skill family

## Instructions

1. **Treat this skill as a compatibility entrypoint, not the final procedure** — Convert the request into the current Stitch sequence instead of trying to do everything from this wrapper alone.

2. **Load `frontend-design` first** — Start with visual direction and token intent before any Stitch prompt or tool call.

3. **Then load `stitch-prompt-enhancement`** — Turn rough UI intent into a compact, structured Stitch brief. Do not send vague prompts directly to Stitch.

4. **Use `stitch-design-system` only when needed** — If `docs/foundation/DESIGN.md` is missing, stale, or the work spans multiple screens, generate or refresh it and mirror it to `.stitch/DESIGN.md`.

5. **Use `stitch-design-orchestrator` for actual Stitch operations** — That skill owns MCP preflight, tool discovery, minimal tool selection, safety limits, and suggestion-aware retries.

6. **Use `stitch-implementation-handoff` for repo-native code mapping** — Once Stitch returns the final screen artifact, hand off to the implementation skill instead of pasting generated HTML blindly.

7. **Prefer `/implement` with a Stitch UI scope for fresh work** — If the user is starting new work, route into the workflow-first Stitch path instead of staying inside this compatibility wrapper.

## Output Format

Deliver:

1. **Resolved Stitch sequence** — which narrower skills should run, in order
2. **Design prep summary** — visual direction, token scope, and whether a design-system refresh is required
3. **Execution handoff** — whether the next step is prompt enhancement, Stitch orchestration, or implementation handoff
4. **Safety notes** — any configuration, rate-control, or ambiguity blockers

## References

Load only what the current task requires.

| File | Load when |
| --- | --- |
| `../frontend-design/references/visual-direction.md` | Need to establish the design point of view before any Stitch prompt. |
| `../frontend-design/references/design-tokens.md` | Need to align token vocabulary before Stitch generation or editing. |
| `../stitch-design-system/references/design-template.md` | Need the canonical `docs/foundation/DESIGN.md` structure and the `.stitch/DESIGN.md` mirror contract. |

## Examples

Use these when the task closely matches the example shape.

| File | Use when |
| --- | --- |
| `../stitch-design-orchestrator/examples/01-stitch-ui-route.md` | Need the full workflow-first Stitch sequence. |
| `../stitch-prompt-enhancement/examples/01-dashboard-prompt.md` | Need to sharpen a vague UI request before Stitch. |
| `../stitch-implementation-handoff/examples/01-new-screen.md` | Need the implementation-side handoff after Stitch finishes. |

## Gemini Stitch Compatibility Flow

- Treat this skill as a compatibility wrapper only. Route the real work through `frontend-design`, `stitch-prompt-enhancement`, `stitch-design-system` when needed, `stitch-design-orchestrator`, and `stitch-implementation-handoff`.
- Verify the Foundry Stitch MCP configuration from `.gemini/settings.json` before choosing any Stitch tool path.
- Prefer the shared `/implement` Stitch UI flow for new work so the design-first sequence stays intact on Gemini.

## Gemini Platform Notes

- Workflow and agent routes are compiled into `.gemini/commands/*.toml` TOML command files.
- Commands use `{{args}}` for user input, `!{shell command}` for shell output, `@{file}` for file content.
- Specialists are internal postures (modes of reasoning), not spawned subagent processes.
- Gemini does not support `context: fork` — all skill execution is inline within the current session.
- Skills are loaded via MCP when the Cubis Foundry MCP server is configured. Local `.agents/skills/` paths serve as hints.
- User arguments are passed as natural language in the activation prompt.
- Rules file relative to the mirrored skill directory: `../../rules/GEMINI.md`.
- Reference files are loaded relative to the skill directory under `.agents/skills/<skill-id>/`.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available when MCP is connected.
