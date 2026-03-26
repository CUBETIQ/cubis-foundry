---
name: rules-core
description: Shared engineering rules covering correctness, testing, security,
  file hygiene, and platform-specific instruction surfaces.
triggers:
  - rules core
  - delivery
  - correctness
  - security
  - file hygiene
  - shared engineering rules
  - codex
  - copilot
domains:
  - delivery
whenToUse: When defining or applying repository-wide guardrails that should
  project into platform-native instruction files.
priority: secondary
compatibility:
  - claude
  - codex
  - copilot
  - gemini
  - antigravity
---

# Rules Core

## Purpose

Define the universal guardrails Foundry should project into runtime-native instruction files. This skill explains what the rules are for, when they apply, and how to keep them specific enough to help rather than vague enough to be ignored.

## When to Use

- Creating or updating shared engineering rules
- Translating platform-neutral rules into Claude, Codex, Copilot, Gemini, or Antigravity surfaces
- Auditing whether the generated instruction files still reflect the intended guardrails

## Instructions

1. Keep common rules short, enforceable, and platform-neutral.
2. Put only genuinely platform-specific guidance into platform override files.
3. Prefer behavior rules over aspirational slogans.
4. Keep security, testing, and change hygiene explicit because these are the highest-value shared constraints.
5. When platform limits differ, document the degraded behavior rather than pretending parity exists.

## Anti-patterns

- Do not hide critical rules in one platform file only.
- Do not write rules that cannot be verified or reasonably followed.
- Do not let generated instruction files drift from the canonical rules directory.

## Output Format

Return the affected rule surfaces, the changed behaviors, and any runtime-specific degradations.

## References

- `rules/common.md`
- `rules/claude.md`
- `rules/codex.md`
- `rules/copilot.md`
- `rules/gemini.md`
- `rules/antigravity.md`
