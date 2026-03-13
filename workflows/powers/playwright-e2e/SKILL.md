---
name: playwright-e2e
description: "Use when writing or reviewing browser end-to-end tests with Playwright, debugging flaky UI automation, validating auth or checkout flows, or tightening CI evidence with traces and web-first assertions."
license: MIT
metadata:
  author: cubis-foundry
  version: "2.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Playwright E2E

## Purpose

Use when writing or reviewing browser end-to-end tests with Playwright, debugging flaky UI automation, validating auth or checkout flows, or tightening CI evidence with traces and web-first assertions. When Playwright MCP upstream is configured in Cubis Foundry, leverage browser automation tools for live page inspection, snapshot-based debugging, and interactive test development.

## When to Use

- Writing or refactoring Playwright browser tests for critical user journeys.
- Debugging flaky E2E failures, locator instability, or auth state leakage in CI.
- Choosing between fixtures, reusable helpers, and page-level abstractions.
- Reviewing traces, screenshots, videos, and network activity to isolate browser failures.
- Using Playwright MCP tools for live browser navigation, snapshot capture, and interactive element inspection during test development.

## Instructions

1. Choose the smallest browser journeys that actually protect revenue, auth, or release confidence.
2. Prefer role, label, text, or explicit test-id locators over DOM-shape selectors.
3. Keep tests isolated with deterministic data, reusable auth setup, and minimal hidden shared state.
4. Use web-first assertions, traces, and network evidence before calling a test flaky.
5. Leave CI with artifacts that explain the failure path instead of screenshots alone.

### Playwright MCP tools

When the Playwright upstream is configured in the Cubis Foundry MCP gateway, these tool categories are available for interactive browser automation:

- **Navigation**: `browser_navigate`, `browser_go_back`, `browser_go_forward`, `browser_wait` — open pages, navigate history, wait for network idle.
- **Snapshots**: `browser_snapshot` — capture an accessibility-tree snapshot of the current page for element inspection and locator discovery.
- **Interaction**: `browser_click`, `browser_type`, `browser_select_option`, `browser_hover`, `browser_drag` — interact with page elements using accessibility refs from snapshots.
- **Keyboard & files**: `browser_press_key`, `browser_file_upload` — press keys or upload files.
- **Tabs**: `browser_tab_list`, `browser_tab_new`, `browser_tab_select`, `browser_tab_close` — manage browser tabs.
- **Utilities**: `browser_console_messages`, `browser_generate_playwright_test`, `browser_network_requests`, `browser_install` — read console logs, generate test code, inspect network, install browsers.

Use MCP tools during development to inspect live pages and generate locator-accurate test code. Use the Playwright test runner and CI pipeline for execution.

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

| File                                          | Load when                                                                                                                                          |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `references/locator-trace-flake-checklist.md` | You need a deeper checklist for locator choice, auth setup, trace-driven debugging, retries, CI artifacts, flake triage, or MCP workflow patterns. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with playwright e2e best practices in this project"
- "Review my playwright e2e implementation for issues"
- "Use Playwright MCP to inspect the login page and generate test code"
- "Check playwright upstream status and available browser tools"
