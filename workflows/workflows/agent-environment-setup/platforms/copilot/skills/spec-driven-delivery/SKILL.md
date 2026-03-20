---
name: spec-driven-delivery
description: Use when turning a non-trivial request into a Git-tracked spec pack, maintaining traceability during execution, and updating specs before code when requirements or architecture change.
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
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
5. **Turn requirements into testable assertions** because spec quality depends on concrete behavior, acceptance checks, and traceability rather than vague intent.
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
| `../architecture-doc/SKILL.md` | Need ADRs, system boundaries, or architecture-document structure. |
| `../deep-research/SKILL.md` | Need repo-first research escalation or evidence labeling rules. |

## Copilot Platform Notes

- Custom agents live under `../../agents/` relative to the mirrored skill directory and use YAML frontmatter such as `name`, `description`, `tools`, `model`, and `handoffs`.
- Agent `handoffs` can guide workflow transitions (for example, `@planner` → `@implementer`).
- Skill files are stored under `.github/skills/` (skill markdown) and `.github/prompts/` (prompt files).
- Path-scoped instructions live under `../../instructions/` and provide file-pattern-targeted guidance via `applyTo` frontmatter.
- User arguments are provided as natural language input in the prompt, not through a `$ARGUMENTS` variable.
- Frontmatter keys `context: fork` and `allowed-tools` are not natively supported; guidance is advisory.
- Reference files can be included via `#file:references/<name>.md` syntax in Copilot Chat.
- MCP configuration lives in `.vscode/mcp.json`. MCP skill tools are available when configured.
- Rules file relative to the mirrored skill directory: `../../rules/copilot-instructions.md` — broad and stable, not task-specific.
