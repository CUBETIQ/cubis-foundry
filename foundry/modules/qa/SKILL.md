---
name: qa
description: Legacy QA alias for broad quality requests. Route browser work to
  web-testing, native mobile work to android-emulator-testing or
  ios-simulator-testing, and code-level testing to the owning language or
  framework skill.
triggers:
  - qa
  - quality
  - testing
  - regression risk
domains:
  - quality
  - testing
whenToUse: When the request says QA generically and you need to choose the
  correct canonical testing surface.
priority: secondary
compatibility:
  - claude
  - codex
  - copilot
  - gemini
  - antigravity
---

# QA

## Purpose

Provide a thin compatibility layer for generic QA requests. Do not stay in this skill if a more specific testing surface is available.

## When to Use

- The request says "QA" or "testing" without naming the correct surface yet
- You need to route browser testing into `web-testing`
- You need to route native mobile testing into `android-emulator-testing` or `ios-simulator-testing`
- You need to route code-level unit or integration coverage into the owning language or framework skill

## Instructions

1. Decide whether the testing need is browser, native mobile, or code-level.
2. Route browser QA to `../web-testing/SKILL.md`.
3. Route Android emulator work to `../android-emulator-testing/SKILL.md`.
4. Route iOS simulator work to `../ios-simulator-testing/SKILL.md`.
5. Route unit and integration coverage into the language or framework skill that owns the code under test.

## Anti-patterns

- Do not treat this wrapper as the final testing surface.
- Do not send browser automation back through `playwright-interactive` as the primary entrypoint.
- Do not keep unit or integration guidance detached from the owning stack.

## Output Format

Return the chosen canonical testing surface, why it was selected, and any release-readiness gaps that still matter.

## References

- `../web-testing/SKILL.md`
- `../android-emulator-testing/SKILL.md`
- `../ios-simulator-testing/SKILL.md`
