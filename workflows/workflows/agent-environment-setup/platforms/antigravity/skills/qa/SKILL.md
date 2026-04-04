---
name: qa
description: "Consolidated QA capability with three modes: harness, web, and mobile."
---
# QA

## Purpose

Provide one capability for repeatable Foundry QA work across UI harness evaluation, live web-browser validation, and Flutter mobile testing. This consolidates the prior `ui-testing-harness`, `playwright-web-qa`, and `flutter-mobile-qa` skills into one routing surface with explicit operating modes.

## Modes

1. **harness**: Build or review the Foundry-owned UI evaluation harness, scenarios, scorecards, and anti-slop gap reports.
2. **web**: Run charter-driven browser QA with deterministic Playwright evidence.
3. **mobile**: Run Flutter-focused Android QA with structured screenshot, UI-tree, and log evidence.

## When to Use

- Foundry needs repeatable UI-quality benchmarks instead of one-off screenshots.
- A real web flow must be checked with deterministic browser artifacts.
- A Flutter app needs smoke, regression, or crash triage on an emulator or device.

## Instructions

1. **Choose the mode up front** because harness planning, browser QA, and mobile QA have different evidence paths and success criteria.
2. **Use `harness` for system-level UI quality work** including style atlases, benchmark scenarios, and Foundry gap reporting.
3. **Use `web` for runtime browser validation** when the task needs a charter, explicit URL state, and report-ready artifacts.
4. **Use `mobile` for Flutter and Android execution** with readiness checks, baseline captures, and controlled retries.
5. **Tie every verdict to evidence** such as screenshots, DOM snapshots, UI trees, or logs rather than impressions.
6. **Keep artifacts local and deterministic** so failures can be reviewed and rerun without ambiguity.
7. **Escalate from runtime QA to harness work only when repeated failures show a system gap** rather than a one-off bug.

## Output Format

Deliver:

1. Chosen mode
2. Charter or scenario summary
3. Execution log
4. Assertions and evidence paths
5. Risks and recommended fixes

## References

| File | Load when |
| --- | --- |
| `../web-testing/SKILL.md` | Running a live charter against a web app with Playwright evidence. |
| `../android-emulator-testing/SKILL.md` | Running Android QA with screenshots, UI trees, and log capture. |
| `../ios-simulator-testing/SKILL.md` | Running iOS simulator QA with equivalent mobile evidence. |
