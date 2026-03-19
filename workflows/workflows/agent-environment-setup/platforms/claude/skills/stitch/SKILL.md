---
name: stitch
description: Use when implementing or updating UI from Google Stitch artifacts, screen-to-code handoff, design-to-code diffs, or syncing an existing screen with the latest Stitch output through Cubis Foundry MCP.
allowed-tools: Read Grep Glob Bash Edit Write
context: fork
agent: frontend-specialist
user-invocable: true
argument-hint: "Stitch screen, design artifact, or UI diff to implement"
---

# Stitch

## Purpose

Turn Google Stitch artifacts into production-ready UI changes without guessing the design. This skill is for real Stitch-driven implementation and update work: fetch the latest Stitch artifacts through Cubis Foundry MCP, map them into the repo's actual stack and design system, and apply minimal, accessible changes.

## When to Use

- Implementing a new screen from Stitch artifacts
- Updating an existing screen from refreshed Stitch output
- Performing design-to-code diffs against local UI
- Translating Stitch artifacts into React, Next.js, React Native, Flutter, SwiftUI, or another project framework
- Auditing whether the local screen still matches the current Stitch version

## Instructions

1. **Verify Stitch is reachable before relying on it**. Check `stitch_get_status` and `mcp_gateway_status` first. If Stitch is misconfigured or unavailable, say so clearly and do not invent screen details. See `references/platform-setup.md`.

2. **List enabled Stitch tools before choosing a workflow**. Use `stitch_list_enabled_tools` or the Stitch passthrough namespace to confirm which real upstream tools are available in the current environment.

3. **Normalize the request into a concrete implementation brief**. If the prompt is vague, restate the target screen, destination route or component, framework, responsive expectations, and reuse constraints before editing anything. This follows the same prompt-sharpening idea used in Stitch-first design workflows, but the output here should stay implementation-oriented.

4. **Pull Stitch artifacts before planning implementation**. Fetch the actual screen artifact, code, metadata, and image/snapshot when available. Do not reconstruct the UI from a natural-language guess.

5. **Map Stitch output into the repo's real stack**. Re-express the artifact in the project's framework, routing model, state layer, styling system, and component primitives. Do not paste generated output blindly. See `references/implementation-patterns.md`.

6. **Prefer local component reuse over one-off markup**. If the project already has buttons, cards, typography, layout shells, tokens, or navigation primitives, use them instead of cloning raw Stitch structure.

7. **Keep diffs minimal when updating an existing screen**. Compare the local implementation against the latest Stitch artifact and patch only the changed structure, spacing, copy, tokens, states, and assets. Preserve validated business logic and local architecture. See `references/update-diff-workflow.md`.

8. **Use existing local exports or prior implementations as a diff baseline**. If the repo already contains the target screen or a prior Stitch-derived implementation, compare against that first. Refresh from Stitch when the task requires live parity; otherwise use the local baseline to reduce churn.

9. **Preserve accessibility and interaction states**. Maintain semantic structure, keyboard flow, focus treatment, labels, contrast, loading/error/empty states, and responsive behavior while translating the design.

10. **Call out unavoidable drift explicitly**. If the repo's design system, data model, or framework constraints prevent a literal Stitch match, explain the exact deviation and why it was necessary.

11. **Ask only targeted clarification questions**. Ask when the artifact is ambiguous, multiple Stitch screens plausibly match, or the repo has competing destination surfaces. Otherwise proceed with the best repo-grounded implementation.

## Output Format

Deliver:

1. **Artifact summary** — which Stitch artifact or screen was used
2. **Implementation plan** — target files, framework mapping, and any deviations
3. **Code changes** — minimal production-ready implementation or patch
4. **Diff notes** — what changed relative to the prior local UI, if applicable
5. **Verification** — accessibility, responsive behavior, and any remaining gaps

## References

Load only what the current task requires.

| File | Load when |
| --- | --- |
| `references/platform-setup.md` | Need to verify Stitch availability, gateway status, profile setup, or secure credential expectations. |
| `references/implementation-patterns.md` | Need guidance for mapping Stitch artifacts into web/mobile stacks and existing design systems. |
| `references/update-diff-workflow.md` | Updating an existing implementation from revised Stitch artifacts or running a UI diff workflow. |

## Examples

Use these when the task closely matches the example shape.

| File | Use when |
| --- | --- |
| `examples/01-new-screen.md` | Creating a new screen from Stitch output. |
| `examples/02-update-existing-screen.md` | Patching an existing screen from updated Stitch artifacts. |
| `examples/03-mobile-handoff.md` | Translating Stitch into a mobile framework or native stack. |
| `examples/04-prompt-enhancement.md` | Turning a vague Stitch request into a concrete implementation brief before coding. |
| `examples/05-design-sync-loop.md` | Running an iterative Stitch refresh-and-patch loop for an existing product surface. |

## Claude Stitch Flow

- Use `$ARGUMENTS` as the requested Stitch screen or implementation brief when this skill is invoked directly.
- Resolve any extra guidance from `${CLAUDE_SKILL_DIR}/references/platform-setup.md`, `${CLAUDE_SKILL_DIR}/references/implementation-patterns.md`, and `${CLAUDE_SKILL_DIR}/references/update-diff-workflow.md`.
- Start with Foundry gateway + Stitch status checks, then hand the concrete implementation work to the frontend-specialist fork only after the target artifact and destination surface are clear.

## Claude Platform Notes

- Use `$ARGUMENTS` to access user-provided arguments passed when the skill is invoked.
- Reference skill-local files with `${CLAUDE_SKILL_DIR}/references/<file>` for portable paths.
- When `context: fork` is set, the skill runs in an isolated subagent context; the `agent` field names the fork target.
- Custom subagents live under `../../agents/` relative to the mirrored skill directory and support YAML frontmatter: `name`, `description`, `tools`, `model`, `maxTurns`, `memory`, `handoffs`.
- Use `model` field in agent frontmatter to select model per subagent (e.g., `model: opus` for complex analysis).
- Set `maxTurns` to prevent runaway iterations (default: 25, orchestrator: 30).
- Key agents support `memory: project` for cross-session learning (orchestrator, debugger, researcher, project-planner).
- Hook templates in `.claude/hooks/` provide lifecycle event integration at `UserPromptSubmit` and other events.
- Path-scoped rules live under `../../rules/` with `paths:` frontmatter for targeted guidance.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available for dynamic skill discovery and loading.
- Use `allowed-tools` in frontmatter to restrict tool access for security-sensitive skills.
- Workflow skills can be compiled to `.claude/skills/<workflow-id>/SKILL.md` as `generatedSkills`.
