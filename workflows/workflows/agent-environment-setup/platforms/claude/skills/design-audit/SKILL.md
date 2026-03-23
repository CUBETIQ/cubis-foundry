---
name: design-audit
description: Diagnose why a UI feels generic, uneven, or hard to validate before making edits. Use for screenshot-first or live-browser review of composition, typography, states, responsiveness, and anti-slop failures.
---

# Design Audit

## Purpose

Run a no-edit diagnosis pass on an existing interface. This is the Foundry command-style review layer for figuring out whether the design has a real point of view, where it collapses into templates, and what the next remediation skill should be.

## When to Use

- A UI feels bland, slop-like, or inconsistent
- You need findings before touching code
- A fixture or implementation needs evidence-backed design review
- Playwright or screenshots already exist and need interpretation

## Instructions

1. **Start from evidence** — Inspect the live UI, screenshots, snapshots, or recordings before judging the design because vague critique is not useful.
2. **Read canonical design context when present** — Use `docs/foundation/DESIGN.md` to separate deliberate choices from accidental drift.
3. **Audit the structure first** — Evaluate composition, hierarchy, density, and repeated motif before talking about colors or polish.
4. **Name the exact anti-patterns** — Call out card stacking, anonymous heroes, safe typography, inert state design, weak mobile re-composition, shell-track waste, empty desktop rails, optical collisions, or other specific failures.
5. **Separate systemic failures from copy nitpicks** — Focus on the visual or behavioral issues that affect the product surface as a whole.
6. **Audit occupancy as well as composition** — Check whether page-level grids, rails, and desktop columns are actually populated because wasted shell tracks read like spacing bugs and should fail review.
7. **Tie each finding to a next move** — Route typography fixes to `design-typeset`, layout rhythm problems to `design-arrange`, safe visual energy to `design-bolder`, clutter to `design-distill`, and near-finished cleanup to `design-polish`.
8. **Use Playwright evidence when available** — Prefer browser artifacts and runtime states over static opinion because repeatable design review needs proof.

## Output Format

Deliver:

1. Overall verdict
2. Findings ordered by severity
3. Repeated anti-patterns
4. Recommended next remediation skill
5. Evidence paths or runtime observations

## References

| File | Load when |
| --- | --- |
| `../frontend-design/references/visual-direction.md` | Checking whether the interface has a clear point of view or collapsed into generic defaults. |
| `../ui-testing-harness/references/scoring-rubric.md` | Aligning findings with the anti-slop harness score dimensions. |
| `../playwright-web-qa/SKILL.md` | The audit needs fresh browser evidence instead of existing screenshots. |

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
