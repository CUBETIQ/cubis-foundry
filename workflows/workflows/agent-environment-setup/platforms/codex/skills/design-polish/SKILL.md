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
