---
name: stitch-implementation-handoff
description: Convert final Stitch screen artifacts into minimal, repo-native frontend changes by reusing local components, preserving validated logic, and documenting any intentional drift from the design source.
---
# Stitch Implementation Handoff

## Purpose

Turn the final Stitch artifact into production-ready UI changes without guessing the design. This skill owns the repo-native mapping step after Stitch generation or editing is finished.

## When to Use

- Implementing a new screen from a finalized Stitch artifact
- Updating an existing screen from refreshed Stitch output
- Performing design-to-code diffs against local UI
- Translating Stitch output into React, Next.js, React Native, Flutter, SwiftUI, or another real project framework
- Auditing whether the local screen still matches the current Stitch version

## Instructions

1. **Pull the actual final Stitch artifact before coding** — Use the latest screen artifact, metadata, and image/snapshot from Stitch. Do not reconstruct the screen from memory or from a stale prompt.

2. **Map Stitch output into the repo's real stack** — Re-express the artifact in the project's framework, routing model, styling system, tokens, and component primitives.

3. **Prefer local component reuse over one-off markup** — If the project already has buttons, cards, typography, navigation, or layout primitives, use those instead of cloning raw Stitch structure.

4. **Keep diffs minimal on existing screens** — Compare the local implementation against the refreshed Stitch artifact and patch only the changed structure, spacing, copy, tokens, states, and assets.

5. **Preserve business logic and architecture** — Keep local data flow, validation, submission logic, navigation contracts, and test seams unless the task explicitly requires structural changes.

6. **Preserve accessibility and interaction states** — Maintain semantic structure, keyboard flow, focus treatment, labels, contrast, loading/error/empty states, and responsive behavior while translating the design.

7. **Call out unavoidable drift explicitly** — If the repo's design system, data model, or framework constraints prevent a literal Stitch match, explain the exact deviation and why it was necessary.

## Output Format

Deliver:

1. **Artifact summary** — which final Stitch artifact or screen was used
2. **Implementation plan** — target files, framework mapping, and any deviations
3. **Code changes** — minimal production-ready implementation or patch
4. **Diff notes** — what changed relative to the prior local UI, if applicable
5. **Verification** — accessibility, responsive behavior, and remaining gaps

## References

| File | Load when |
| --- | --- |
| `../stitch/references/platform-setup.md` | Need to verify Stitch availability, gateway status, or secure credential expectations. |
| `../stitch/references/implementation-patterns.md` | Need guidance for mapping Stitch artifacts into web or mobile stacks and existing design systems. |
| `../stitch/references/update-diff-workflow.md` | Updating an existing implementation from revised Stitch artifacts or running a UI diff workflow. |
| `../frontend-design/references/component-architecture.md` | Need to map a Stitch screen into reusable primitives and composite components. |

## Examples

| File | Use when |
| --- | --- |
| `examples/01-new-screen.md` | Creating a new screen from Stitch output. |
| `examples/02-update-existing-screen.md` | Patching an existing screen from updated Stitch artifacts. |
| `examples/03-mobile-handoff.md` | Translating Stitch into a mobile framework or native stack. |

## Gemini Stitch Implementation Handoff

- Pull the final Stitch artifact before coding, then map it into the repo's real framework, tokens, routing, and components.
- Preserve existing business logic, tests, and accessibility behavior while applying the UI diff.
- Keep the result repo-native on Gemini: reuse local primitives and explain any intentional drift from the Stitch artifact.

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
