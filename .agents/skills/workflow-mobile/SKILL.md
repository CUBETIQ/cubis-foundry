---
name: workflow-mobile
description: 'Callable Codex wrapper for /mobile: Drive mobile implementation decisions for Flutter/cross-platform behavior and reliability.'
metadata:
  source: cubis-foundry
  wrapper: workflow
  platform: codex
  workflow-id: 'mobile'
  workflow-command: '/mobile'
---

# Workflow Wrapper: /mobile

Use this skill as a callable replacement for `/mobile` workflow instructions in Codex.

## Invocation Contract
1. Match the current task against this workflow intent before execution.
2. Follow the sequence and guardrails in the source instructions below.
3. Produce actionable output and call out assumptions before edits.

## Source Workflow Instructions

# Mobile Workflow

## When to use
Use this when mobile app architecture, UX behavior, or platform constraints are the focus.

## Routing
- Primary specialist: `$agent-mobile-developer`
- UI support: `$agent-frontend-specialist`
- Verification support: `$agent-test-engineer`

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `mobile-design`, `flutter-expert`
- Supporting skills (optional): `riverpod-3`, `drift-flutter`, `flutter-test-master`

## Workflow steps
1. Confirm platform and UX constraints.
2. Plan navigation/state/offline behavior.
3. Implement or refactor mobile flows.
4. Validate behavior across critical paths.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
- Mobile flow changes
- Platform constraints handled
- Test coverage summary
- Release-readiness notes
