---
name: spec-driven-delivery
description: Use when turning a non-trivial request into a Git-tracked spec pack, maintaining traceability during execution, and updating specs before code when requirements or architecture change.
---
# Spec-Driven Delivery

## Purpose

Create and maintain a lightweight source of truth for non-trivial work. This skill turns requirements, decisions, acceptance criteria, and architecture impact into a spec pack under the `docs/specs/<spec-id>/` workspace area, then keeps that pack aligned as implementation evolves.

## When to Use

- Planning a medium or large feature before implementation
- Capturing acceptance criteria, traceability, and architecture impact in Git
- Reusing or refreshing an existing spec pack for a follow-up change
- Bridging native plan-mode output into durable project documents
- Keeping implementation, verification, and documentation aligned across sessions

## Instructions

1. **Classify the task first** because trivial work should not pay spec overhead. Use this skill only when the task is multi-step, cross-session, cross-domain, risky, or likely to change architecture, testing strategy, or team coordination.
2. **Look for an existing spec pack before creating a new one** because duplicate specs create drift. Reuse the closest matching spec directory when the current request extends an active initiative.
3. **Create a stable `spec_id` and spec root** because the same identifier should survive planning, execution, review, and follow-up changes.
4. **Write the minimum viable pack** because the goal is durable coordination, not bureaucracy. Keep the brief, acceptance, tasks, traceability, and handoff documents concise and testable.
5. **Use `sadd` when turning requirements into assertions** because spec quality depends on extracting testable behavior instead of leaving requirements vague.
6. **Record architecture impact explicitly** because implementation must stay aligned with the project architecture contract and current-state tech map. Mark whether the change affects architecture style, module boundaries, dependency rules, design system, deployment shape, or testing strategy.
7. **Update the spec before implementation changes behavior** because traceability breaks when code changes first and docs lag behind.
8. **Keep the task graph execution-ready** because `/implement-track` and `/orchestrate` should be able to act on the spec without replanning. Every task should have ownership, dependencies, acceptance criteria, and a verification path.
9. **Route external research through `deep-research`** because repo-first planning still needs disciplined escalation when freshness or public comparison matters.
10. **Emit a clear next route** because spec work usually hands off into `/create`, `/implement-track`, `/orchestrate`, or `/architecture`.
11. **Report `doc_impact` and `traceability_status`** because feature work should surface whether the architecture contract or tech map must be refreshed at the end.
12. **Keep the pack alive during execution** because a stale spec is worse than none. Update acceptance, tasks, and traceability when scope or constraints change.

## Output Format

Deliver:

1. **Spec summary** — `spec_id`, `spec_root`, goal, scope, and why spec mode is warranted
2. **Acceptance and traceability state** — requirements, open gaps, and `traceability_status`
3. **Execution-ready plan** — tasks, owners, dependencies, and verification checkpoints
4. **Architecture and doc impact** — `architecture_impact` plus `doc_impact`
5. **Recommended next route** — exact workflow, agent, or skill to continue from the spec

## References

| File | Load when |
| --- | --- |
| `../sadd/SKILL.md` | Need requirement mining, GIVEN-WHEN-THEN specs, or traceability patterns. |
| `../architecture-doc/SKILL.md` | Need ADRs, system boundaries, or architecture-document structure. |
| `../deep-research/SKILL.md` | Need repo-first research escalation or evidence labeling rules. |

## Examples

| File | Use when |
| --- | --- |
| `../sadd/references/spec-mining.md` | Turning loose requirements into testable spec entries. |
| `../sadd/references/coverage-mapping.md` | Building a traceability matrix that links specs, tests, and code. |

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
