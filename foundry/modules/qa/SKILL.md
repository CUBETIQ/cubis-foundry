---
name: qa
description: Quality-assurance guidance for validating end-user behavior,
  regression risk, and release readiness beyond narrow unit assertions.
triggers:
  - qa
  - quality
  - testing
  - regression risk
domains:
  - quality
  - testing
whenToUse: When the task needs acceptance-level verification, regression sweeps,
  or release-oriented quality checks.
priority: primary
compatibility:
  - claude
  - codex
  - copilot
  - gemini
  - antigravity
---

# QA

## Purpose

Provide a higher-level verification lens than isolated unit tests. Use this skill to evaluate whether a change is actually ready for handoff, rollout, or review from a user-impact perspective.

## When to Use

- Validating acceptance criteria across multiple surfaces
- Running pre-release regression checks
- Reviewing quality gaps that are broader than one test file

## Instructions

1. Start from user-visible behavior and acceptance criteria.
2. Cover the highest-risk paths first.
3. Record what was verified, what was sampled, and what remains unverified.

## Anti-patterns

- Do not confuse code coverage with release readiness.
- Do not hide known gaps behind a generic “looks good”.

## Output Format

Return tested flows, evidence gathered, blocked areas, and a clear release-readiness recommendation.

## References

- `../unit-testing/SKILL.md`
- `../integration-testing/SKILL.md`
