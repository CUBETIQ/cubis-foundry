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

## Codex Platform Notes

- Codex supports native subagents via `.codex/agents/*.toml` files with `name`, `description`, and `developer_instructions`.
- Each subagent TOML can specify `model` and `model_reasoning_effort` to optimize cost per task difficulty:
  - Light tasks (exploration, docs): `model = "gpt-5.3-codex-spark"`, `model_reasoning_effort = "medium"`
  - Heavy tasks (security audit, orchestration): `model = "gpt-5.4"`, `model_reasoning_effort = "high"`
  - Standard tasks (implementation): inherit parent model (omit `model` field).
- Built-in agents: `default`, `worker`, `explorer`. Custom agents extend these via TOML definitions.
- Codex operates under network restrictions — skills should not assume outbound HTTP access.
- Use `$ARGUMENTS` to access user-provided arguments when the skill is invoked.
- All skill guidance executes within the sandbox; file I/O is confined to the workspace.
- Skills are installed at `.agents/skills/<skill-id>/SKILL.md`. Workflow skills can also be compiled to `.agents/skills/<workflow-id>/SKILL.md` as `generatedSkills`.
- Codex supports three autonomy levels: `suggest`, `auto-edit`, `full-auto`.
- MCP skill tools are available when the Cubis Foundry MCP server is connected.
