---
command: "/debug"
description: "Isolate root cause quickly and apply the smallest safe remediation with verification."
triggers: ["debug", "bug", "error", "incident", "stack trace"]
---
# Debug Workflow

## When to use
Use this when behavior is failing or inconsistent.

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `systematic-debugging`, `find-bugs`
- Supporting skills (optional): `monitoring-expert`, `error-ux-observability`

## Workflow steps
1. Reproduce issue and collect evidence.
2. Narrow fault domain and identify root cause.
3. Apply focused fix with low regression risk.
4. Verify resolution and monitor for recurrence.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
- Reproduction notes
- Root cause summary
- Fix summary
- Regression checks performed
