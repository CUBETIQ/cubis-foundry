---
name: "playwright-e2e"
description: "Use when writing or reviewing browser end-to-end tests with Playwright, debugging flaky UI automation, validating auth or checkout flows, or tightening CI evidence with traces and web-first assertions."
license: MIT
metadata:
  version: "1.0.0"
  domain: "quality"
  role: "specialist"
  stack: "playwright"
  category: "workflow-specialists"
  layer: "workflow-specialists"
  canonical: true
  maturity: "stable"
  baseline: "current Playwright locator, trace, and isolation guidance"
  tags: ["playwright", "e2e", "browser-testing", "qa", "flaky-tests", "ui", "ci"]
---

# Playwright E2E

## When to use

- Writing or refactoring Playwright browser tests for critical user journeys.
- Debugging flaky E2E failures, locator instability, or auth state leakage in CI.
- Choosing between fixtures, reusable helpers, and page-level abstractions.
- Reviewing traces, screenshots, videos, and network activity to isolate browser failures.

## When not to use

- Broad testing strategy across unit, integration, contract, and browser layers.
- Pure component, API, or backend verification with no browser surface.
- Generic frontend review where the main task is UI quality rather than automation behavior.

## Core workflow

1. Choose the smallest browser journeys that actually protect revenue, auth, or release confidence.
2. Prefer role, label, text, or explicit test-id locators over DOM-shape selectors.
3. Keep tests isolated with deterministic data, reusable auth setup, and minimal hidden shared state.
4. Use web-first assertions, traces, and network evidence before calling a test flaky.
5. Leave CI with artifacts that explain the failure path instead of screenshots alone.

## Baseline standards

- Test user-visible behavior rather than component internals or CSS structure.
- Avoid `waitForTimeout`; let locators, assertions, and explicit app signals do the waiting.
- Reuse authenticated state only through deliberate setup, not test-to-test coupling.
- Mock or route third-party dependencies you do not control.
- Treat trace review as the default path for CI-only failures.

## Avoid

- XPath or fragile class-chain selectors when resilient contracts exist.
- Giant page-object hierarchies for short or single-owner flows.
- Browser suites that duplicate unit or integration checks with no added confidence.
- Marking tests flaky without a trace, reproduction note, and suspected instability source.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/locator-trace-flake-checklist.md` | You need a deeper checklist for locator choice, auth setup, trace-driven debugging, retries, CI artifacts, or flake triage. |
