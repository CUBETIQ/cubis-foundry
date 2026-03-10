---
name: playwright-e2e
description: "Use when writing or reviewing browser end-to-end tests with Playwright, debugging flaky UI automation, validating auth or checkout flows, or tightening CI evidence with traces and web-first assertions."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---
# Playwright E2E

## Purpose

Use when writing or reviewing browser end-to-end tests with Playwright, debugging flaky UI automation, validating auth or checkout flows, or tightening CI evidence with traces and web-first assertions.

## When to Use

- Writing or refactoring Playwright browser tests for critical user journeys.
- Debugging flaky E2E failures, locator instability, or auth state leakage in CI.
- Choosing between fixtures, reusable helpers, and page-level abstractions.
- Reviewing traces, screenshots, videos, and network activity to isolate browser failures.

## Instructions

1. Choose the smallest browser journeys that actually protect revenue, auth, or release confidence.
2. Prefer role, label, text, or explicit test-id locators over DOM-shape selectors.
3. Keep tests isolated with deterministic data, reusable auth setup, and minimal hidden shared state.
4. Use web-first assertions, traces, and network evidence before calling a test flaky.
5. Leave CI with artifacts that explain the failure path instead of screenshots alone.

### Baseline standards

- Test user-visible behavior rather than component internals or CSS structure.
- Avoid `waitForTimeout`; let locators, assertions, and explicit app signals do the waiting.
- Reuse authenticated state only through deliberate setup, not test-to-test coupling.
- Mock or route third-party dependencies you do not control.
- Treat trace review as the default path for CI-only failures.

### Constraints

- Avoid xPath or fragile class-chain selectors when resilient contracts exist.
- Avoid giant page-object hierarchies for short or single-owner flows.
- Avoid browser suites that duplicate unit or integration checks with no added confidence.
- Avoid marking tests flaky without a trace, reproduction note, and suspected instability source.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/locator-trace-flake-checklist.md` | You need a deeper checklist for locator choice, auth setup, trace-driven debugging, retries, CI artifacts, or flake triage. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with playwright e2e best practices in this project"
- "Review my playwright e2e implementation for issues"
