---
name: design-bolder
description: Increase visual conviction when a UI is safe, bland, or too polite. Use to strengthen hierarchy, contrast, motif repetition, and brand character without making the surface chaotic.
---

# Design Bolder

## Purpose

Push a safe design toward a clearer visual thesis. This skill should make the surface more memorable by strengthening one or two deliberate moves, not by adding random effects.

## When to Use

- The design is competent but forgettable
- Hierarchy is too even and nothing leads the eye
- The current implementation feels like a polite template
- The UI needs stronger voice without a full redesign

## Instructions

1. **Strengthen only a few moves** — Increase conviction through typography, composition, contrast, or motif repetition instead of changing everything at once.
2. **Preserve usability** — Make the interface sharper without damaging scannability, readability, or action clarity.
3. **Prefer systemic changes** — Amplify headline behavior, border treatment, layout contrast, or accent logic across the surface rather than in one isolated section.
4. **Do not substitute noise for conviction** — Avoid gimmick gradients, random shadows, novelty fonts, or decorative motion when they do not support the product job.
5. **Check mobile impact** — Stronger desktop expression must still stage correctly on small screens.

## Output Format

Deliver:

1. What feels too safe
2. The one or two moves to amplify
3. Specific changes to hierarchy, contrast, or motif
4. Usability guardrails
5. Verification notes

## References

| File | Load when |
| --- | --- |
| `../frontend-design/references/visual-direction.md` | Choosing which visual moves to amplify and repeat. |
| `../frontend-design/references/animation.md` | Adding emphasis through motion only when it serves hierarchy or feedback. |

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
