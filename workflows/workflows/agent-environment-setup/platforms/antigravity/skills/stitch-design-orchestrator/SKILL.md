---
name: stitch-design-orchestrator
description: Orchestrate safe, design-first Google Stitch generation and editing by sequencing frontend-design, canonical design-system sync, prompt enhancement, Stitch MCP tool selection, and implementation handoff.
---
# Stitch Design Orchestrator

## Purpose

Coordinate Google Stitch work as a workflow-first, skill-driven sequence. This skill ensures UI generation or editing does not jump straight into remote Stitch calls without first establishing design direction, compact prompt structure, canonical design-system context, and an implementation plan for the repo's real stack.

## When to Use

- Generating a new UI screen with Stitch
- Editing an existing Stitch screen with a targeted change
- Creating variants before choosing one direction
- Running a design-first flow before converting Stitch output into code
- Keeping Stitch usage safe, bounded, and consistent across multiple screens

## Instructions

1. **Treat Stitch as a remote design engine, not the source of production truth** - Use Stitch to generate or edit visual artifacts, then hand those artifacts into repo-native implementation. Do not paste returned HTML or markup blindly.
2. **Start with `frontend-design`** - Always establish the style contract, direction name, and thesis set before forming a Stitch prompt.
3. **Resolve the modern design route next** - Use `design` to choose the owning execution surface and decide whether the design language must be refreshed before Stitch runs.
4. **Require a canonical design-system context for iterative or multi-screen work** - If `docs/foundation/DESIGN.md` is missing, stale, or the request spans multiple screens, run `design-system` first and mirror the resolved state to the Stitch-facing design context only after the canonical file is ready.
5. **Run `stitch-prompt-enhancement` before any Stitch tool call** - Convert rough user intent into a compact structured brief that names the platform, layout, components, visual mood, and change scope.
6. **Verify Stitch availability before trusting it** - Run `stitch_get_status`, `mcp_gateway_status`, and `stitch_list_enabled_tools` before choosing a tool flow. If Stitch is unavailable, stop treating it as authoritative input.
7. **Reuse before creating** - Call `list_projects` before `create_project` and reuse an existing project when it already represents the current feature or product area. Call `list_screens` before planning follow-up work so edits stay attached to the current screen set instead of spawning unnecessary new artifacts.
8. **Choose the minimal tool path** - Use `generate_screen_from_text` for a net-new screen, `edit_screens` for targeted revisions, `generate_variants` for controlled alternatives, and `create_design_system` or `apply_design_system` only when the design system itself is the current task. Default to `GEMINI_3_1_PRO` for complex new screens, multi-screen work, and design-system-heavy tasks. Use `GEMINI_3_FLASH` only when the user explicitly wants a speed-first draft or the task is a lightweight edit.
9. **Surface Stitch suggestions instead of brute-forcing retries** - If Stitch returns suggestion-bearing components or follow-up guidance, show that guidance and incorporate it before retrying.
10. **Rate-limit yourself** - By default, allow one Stitch generation or edit action per user turn, prefer `edit_screens` over full regeneration once a screen exists, and stop after two automatic retries with backoff.
11. **Recover intelligently after timeouts** - For `generate_screen_from_text` and `generate_variants`, a timeout can still leave a finished screen in Stitch. Check `list_screens` before assuming the generation failed, then continue from the recovered screen instead of creating a new project.
12. **Fetch the final screen artifact before implementation handoff** - Use `get_screen` after the final generation or edit pass so the downstream implementation step receives the actual latest artifact, not a guessed description.
13. **Finish with `stitch-implementation-handoff`** - Once the design output is settled, hand off the artifact so the repo implementation reuses local components, tokens, and architecture.

## Output Format

Deliver:

1. **Design prep summary** - direction name, style contract, thesis set, and whether design-system refresh is needed
2. **Tool plan** - which Stitch tools will be used and why
3. **Safety state** - status checks, retry budget, and any blocker
4. **Artifact handoff** - which final screen or project artifact is ready for implementation

## References

| File | Load when |
| --- | --- |
| `references/tool-selection.md` | Need to choose the right Stitch tool path for new screens, edits, variants, or design-system work. |
| `references/anti-abuse.md` | Need retry, backoff, or prompt-budget rules before using the remote Stitch service. |
| `../design/references/visual-direction.md` | Need to define the interface mood and composition before writing a Stitch prompt. |
| `../design/references/design-tokens.md` | Need semantic token language before sending UI instructions to Stitch. |
| `../design/references/execution-contract.md` | Need the modern split between public intake, critique, systemization, and execution surfaces. |

## Examples

| File | Use when |
| --- | --- |
| `examples/01-stitch-ui-route.md` | Routing a new Stitch UI request through the full design-first sequence. |
