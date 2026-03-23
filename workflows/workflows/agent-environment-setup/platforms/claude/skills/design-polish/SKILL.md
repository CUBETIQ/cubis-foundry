---
name: design-polish
description: Run the final design cleanup pass on a functionally complete UI. Use when the direction is already chosen and the remaining work is alignment, state completeness, consistency, and ship-quality detail.
---

# Design Polish

## Purpose

Apply the last high-signal refinement pass before a UI is reviewed as finished. This skill should clean up spacing, alignment, visual consistency, state coverage, and quality details without re-litigating the whole concept.

## When to Use

- The feature is already functionally complete
- The visual direction is acceptable, but the details still feel rough
- QA exposed state gaps, awkward spacing, or inconsistent styling
- A design needs cleanup before screenshots, review, or handoff

## Instructions

1. **Polish only after the feature works** — If the structure or direction is still weak, use `design-audit`, `design-bolder`, or `design-distill` first.
2. **Fix the system before the symptom** — Normalize spacing, alignment, focus treatment, and state patterns at the component level when possible.
3. **Complete interaction states** — Ensure hover, focus, active, disabled, loading, success, error, and empty states are explicit where relevant.
4. **Tighten detail quality** — Remove awkward gaps, optical misalignment, inconsistent casing, weak feedback text, and unbalanced whitespace.
5. **Respect the canonical design context** — Keep typography, palette, borders, and motion consistent with `docs/foundation/DESIGN.md` rather than adding one-off flourish.
6. **Verify with real usage** — Use the UI and confirm that the polished state still feels deliberate at desktop and mobile sizes.

## Output Format

Deliver:

1. Preconditions checked
2. Polish targets
3. Key fixes applied or required
4. Remaining risks
5. Verification notes

## References

| File | Load when |
| --- | --- |
| `../frontend-design/references/design-tokens.md` | Cleaning up token usage or inconsistent visual values. |
| `../frontend-design/references/accessibility.md` | Finishing focus, contrast, or semantic state details. |
| `../playwright-web-qa/SKILL.md` | Revalidating the final polished pass in-browser. |

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
