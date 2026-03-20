---
name: stitch-design-orchestrator
description: Orchestrate safe, design-first Google Stitch generation and editing by sequencing frontend-design, prompt enhancement, design-system sync, Stitch MCP tool selection, and implementation handoff.
---

# Stitch Design Orchestrator

## Purpose

Coordinate Google Stitch work as a workflow-first, skill-driven sequence. This skill ensures UI generation or editing does not jump straight into remote Stitch calls without first establishing design direction, compact prompt structure, design-system context, and an implementation plan for the repo's real stack.

## When to Use

- Generating a new UI screen with Stitch
- Editing an existing Stitch screen with a targeted change
- Creating variants before choosing one direction
- Running a design-first flow before converting Stitch output into code
- Keeping Stitch usage safe, bounded, and consistent across multiple screens

## Instructions

1. **Treat Stitch as a remote design engine, not the source of production truth** — Use Stitch to generate or edit visual artifacts, then hand those artifacts into repo-native implementation. Do not paste returned HTML or markup blindly.

2. **Load `frontend-design` first** — Always establish the visual direction and token language before forming a Stitch prompt. Start with `../frontend-design/references/visual-direction.md` and `../frontend-design/references/design-tokens.md`. Add other frontend references only when the task truly needs them.

3. **Run `stitch-prompt-enhancement` before any Stitch tool call** — Convert rough user intent into a compact structured brief that names the platform, layout, components, visual mood, and change scope.

4. **Require a design-system context for iterative or multi-screen work** — If `docs/foundation/DESIGN.md` is missing, stale, or the request spans multiple screens, run `stitch-design-system` to create or refresh `docs/foundation/DESIGN.md` and mirror it to `.stitch/DESIGN.md`.

5. **Verify Stitch availability before trusting it** — Run `stitch_get_status`, `mcp_gateway_status`, and `stitch_list_enabled_tools` before choosing a tool flow. If Stitch is unavailable, stop treating it as authoritative input.

6. **Choose the minimal tool path** — Use `generate_screen_from_text` for a net-new screen, `edit_screens` for targeted revisions, `generate_variants` for controlled alternatives, and `create_design_system` or `apply_design_system` only when the design system itself is the current task. See `references/tool-selection.md`.

7. **Surface Stitch suggestions instead of brute-forcing retries** — If Stitch returns suggestion-bearing components or follow-up guidance, show that guidance and incorporate it before retrying.

8. **Rate-limit yourself** — By default, allow one Stitch generation or edit action per user turn, prefer `edit_screens` over full regeneration once a screen exists, and stop after two automatic retries with backoff. See `references/anti-abuse.md`.

9. **Fetch the final screen artifact before implementation handoff** — Use `get_screen` after the final generation or edit pass so the downstream implementation step receives the actual latest artifact, not a guessed description.

10. **Finish with `stitch-implementation-handoff`** — Once the design output is settled, hand off the artifact so the repo implementation reuses local components, tokens, and architecture.

## Output Format

Deliver:

1. **Design prep summary** — visual direction, token scope, and whether design-system refresh is needed
2. **Tool plan** — which Stitch tools will be used and why
3. **Safety state** — status checks, retry budget, and any blocker
4. **Artifact handoff** — which final screen or project artifact is ready for implementation

## References

| File | Load when |
| --- | --- |
| `references/tool-selection.md` | Need to choose the right Stitch tool path for new screens, edits, variants, or design-system work. |
| `references/anti-abuse.md` | Need retry, backoff, or prompt-budget rules before using the remote Stitch service. |
| `../frontend-design/references/visual-direction.md` | Need to define the interface mood and composition before writing a Stitch prompt. |
| `../frontend-design/references/design-tokens.md` | Need semantic token language before sending UI instructions to Stitch. |

## Examples

| File | Use when |
| --- | --- |
| `examples/01-stitch-ui-route.md` | Routing a new Stitch UI request through the full design-first sequence. |

## Claude Stitch Orchestration

- Run this as a workflow-first sequence: design prep, prompt enhancement, optional design-system refresh, Stitch preflight, minimal tool selection, then implementation handoff.
- Verify `stitch_get_status`, `mcp_gateway_status`, and `stitch_list_enabled_tools` before any generation or edit call.
- Treat Stitch as a rate-sensitive remote service on Claude: allow one generation or edit action per turn by default, prefer `edit_screens` over full regeneration, and stop after two automatic retries with backoff.

## Claude Platform Notes

- Use `$ARGUMENTS` to access user-provided arguments passed when the skill is invoked.
- Reference skill-local files with `${CLAUDE_SKILL_DIR}/references/<file>` for portable paths.
- When `context: fork` is set, the skill runs in an isolated subagent context; the `agent` field names the fork target.
- Custom subagents live under `../../agents/` relative to the mirrored skill directory and support YAML frontmatter: `name`, `description`, `tools`, `model`, `maxTurns`, `memory`, `handoffs`.
- Use `model` field in agent frontmatter to select model per subagent (e.g., `model: opus` for complex analysis).
- Set `maxTurns` to prevent runaway iterations (default: 25, orchestrator: 30).
- Current project-memory agents are `orchestrator` and `planner`; use them for durable project context.
- Hook templates in `.claude/hooks/` provide lifecycle event integration at `UserPromptSubmit` and other events.
- Path-scoped rules live under `../../rules/` with `paths:` frontmatter for targeted guidance.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available for dynamic skill discovery and loading.
- Use `allowed-tools` in frontmatter to restrict tool access for security-sensitive skills.
- Workflow skills can be compiled to `.claude/skills/<workflow-id>/SKILL.md` as `generatedSkills`.
