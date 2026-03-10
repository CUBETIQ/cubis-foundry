---
name: webapp-testing
description: "Use when choosing test depth for a web product, balancing unit, integration, browser, accessibility, and contract checks, or reviewing whether a change has the right verification shape before release."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Webapp Testing

## Purpose

Use when choosing test depth for a web product, balancing unit, integration, browser, accessibility, and contract checks, or reviewing whether a change has the right verification shape before release.

## When to Use

- Planning verification depth for a web feature, refactor, bug fix, or release candidate.
- Choosing what belongs in unit, component, integration, contract, or browser coverage.
- Reviewing gaps in coverage, flaky suites, or low-signal tests.
- Auditing whether a frontend or API change has enough evidence to merge safely.

## Instructions

1. Map the change surface to business risk, user-visible impact, and regression blast radius.
2. Put the cheapest reliable check at the lowest layer that can prove the behavior.
3. Add browser coverage only for flows that need cross-layer confidence.
4. Pair coverage with deterministic fixtures, contract clarity, and failure evidence.
5. Call out what remains manual, unverified, or risky instead of hiding gaps behind suite size.

### Baseline standards

- Test behavior users or dependent systems care about, not implementation trivia.
- Keep component and integration checks faster and more numerous than browser tests.
- Include accessibility and error-state coverage in critical paths, not only happy paths.
- Prefer contract or integration checks for API correctness before adding UI duplication.
- Treat flaky tests as defects in the product, test, or environment, not a permanent condition.

### Constraints

- Avoid one-size-fits-all coverage targets with no risk model.
- Avoid using browser tests to compensate for missing contract or unit design.
- Avoid counting snapshots or shallow assertions as evidence of behavior correctness.
- Avoid treating manual QA as a substitute for repeatable regression protection on critical paths.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/browser-api-state-checklist.md` | You need a deeper playbook for test-layer selection, accessibility coverage, API-vs-UI duplication, flaky-suite triage, or release gating for web apps. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with webapp testing best practices in this project"
- "Review my webapp testing implementation for issues"
