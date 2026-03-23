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
