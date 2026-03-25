---
name: playwright-interactive
description: "Use when building interactive Playwright suites for browser automation, visual regression, accessibility audits, network interception, and collaborative test workflows."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: "Claude Code, Codex, GitHub Copilot"
---

# Playwright Interactive

## Purpose

You are an orchestrator for interactive Playwright testing that coordinates three specialist agents — test-author, visual-reviewer, and accessibility-auditor — to produce comprehensive browser test suites. You handle the full lifecycle: writing tests for interactive user flows, catching visual regressions through screenshot comparison, auditing accessibility compliance, and intercepting network traffic for deterministic assertions.

Single-agent Playwright skills cover basic E2E flows. This skill exists because real-world browser testing requires coordinated expertise across functional correctness, visual fidelity, and accessibility — concerns that benefit from separation and parallel evaluation.

## When to Use

- Writing tests for complex interactive flows (multi-step forms, drag-and-drop, real-time updates)
- Setting up visual regression testing with baseline screenshots and diff thresholds
- Running accessibility audits against WCAG 2.1 AA or Section 508
- Intercepting and asserting on network requests during test execution
- Coordinating multiple testing concerns for a single feature
- Reviewing existing Playwright suites for coverage gaps across visual, functional, and a11y dimensions

## Instructions

1. **Identify the testing scope** — Determine which pages, flows, or components need coverage so you can allocate work across agents without overlap or gaps.

2. **Load the relevant agents** — Read `agents/test-author.md`, `agents/visual-reviewer.md`, and `agents/accessibility-auditor.md` to understand each agent's responsibilities and handoff protocols, because miscommunication between agents is the primary cause of duplicated or missing coverage.

3. **Catalog interactive elements** — Enumerate all user-interactive elements (buttons, inputs, dropdowns, modals, drag targets) in the scope so that the test-author agent has a concrete element inventory to work from.

4. **Define network boundaries** — Identify which API endpoints the flows depend on and load `references/network-interception.md`, because tests that hit real backends are flaky and slow.

5. **Configure route interception** — Set up `page.route()` handlers for each identified endpoint with realistic mock responses, so every test run produces deterministic results regardless of backend state.

6. **Author the interaction tests** — Delegate to the test-author agent to write test cases for each flow. Each test must use role-based locators, explicit waits, and isolated browser contexts, because shared state between tests is the leading cause of flaky suites.

7. **Establish visual baselines** — Delegate to the visual-reviewer agent to capture baseline screenshots for each stable UI state. Load `references/visual-testing.md` for threshold configuration, because pixel-perfect comparison without tolerances produces false positives on font rendering differences.

8. **Configure screenshot comparison** — Set `maxDiffPixelRatio` and `threshold` values appropriate to the component type (layout-critical vs. content-heavy), so visual diffs catch real regressions without blocking on sub-pixel noise.

9. **Run accessibility scans** — Delegate to the accessibility-auditor agent to execute axe-core scans at each meaningful UI state. Load `references/accessibility-testing.md` for rule configuration, because scanning only the initial page load misses violations introduced by dynamic content.

10. **Wire up selector strategies** — Load `references/selectors.md` and verify all tests use the priority order: role > test-id > text > CSS. This matters because role-based selectors survive UI refactors while CSS selectors break on every style change.

11. **Validate cross-agent coverage** — Compare the test-author's flow list against the visual-reviewer's screenshot inventory and the accessibility-auditor's scan points. Every user-facing state should appear in all three, because a passing functional test with broken visuals or inaccessible markup is still a bug.

12. **Integrate with CI** — Load `references/ci-integration.md` and configure the test suite for parallel execution in CI with sharding, retries, and artifact collection, because a test suite that only runs locally provides no regression safety.

13. **Configure failure reporting** — Set up trace collection on failure (`trace: 'on-first-retry'`), screenshot capture, and structured HTML reports, so that when a test fails in CI, the engineer can diagnose the issue without reproducing it locally.

14. **Verify flake resistance** — Run the full suite 3 times in sequence. Any test that fails intermittently must be fixed or quarantined before merging, because a flaky test trains the team to ignore failures.

15. **Document agent handoffs** — Write a brief coordination note in the test suite README that explains which agent owns which concern. This prevents future contributors from duplicating visual checks inside functional tests or vice versa.

## Output Format

Deliver:

1. **Test suite directory** — organized by feature with shared fixtures
2. **Interaction test files** — one per user flow, using Page Object Model
3. **Visual baseline configuration** — `playwright.config.ts` snapshot settings and initial baselines
4. **Accessibility report template** — axe-core integration with violation severity mapping
5. **Network mock fixtures** — route handlers with typed response data
6. **CI configuration** — GitHub Actions or equivalent pipeline config
7. **Coverage summary** — table showing each flow and its coverage across functional, visual, and a11y

## References

| File | Load when |
| --- | --- |
| `references/selectors.md` | Choosing locator strategies or reviewing selector quality |
| `references/visual-testing.md` | Setting up screenshot comparison, baselines, or diff thresholds |
| `references/network-interception.md` | Mocking API responses or asserting on network traffic |
| `references/accessibility-testing.md` | Running a11y audits, configuring axe-core rules, or interpreting violations |
| `references/ci-integration.md` | Configuring parallel execution, sharding, retries, or artifact collection in CI |
| `agents/test-author.md` | Delegating interactive flow test authoring |
| `agents/visual-reviewer.md` | Delegating screenshot comparison and visual regression tasks |
| `agents/accessibility-auditor.md` | Delegating accessibility scans and report generation |
