---
name: debug
description: "Systematic bug investigation: explore, isolate the root cause, fix the bug, test the fix, and review the change."
license: MIT
metadata:
  author: cubis-foundry
  route-kind: "workflow"
  route-id: "debug"
  platform: "Claude Code"
  command: "/debug"
compatibility: Claude Code
---
# Debug Workflow
## When to use

Use for bug reports, error investigations, test failures, and any issue where the root cause is not immediately obvious.

## Agent Chain

`explorer` -> `debugger` -> `tester` -> `reviewer`

## Routing

1. **Explore**: `@explorer` gathers context - reads error logs, traces code paths, identifies the affected area.
2. **Debug**: `@debugger` uses the 5-step protocol to find and fix the root cause.
3. **Test**: `@tester` verifies the fix and checks for regressions.
4. **Review**: `@reviewer` evaluates the fix for correctness and side effects.

## Skill Routing

- Primary skills: `systematic-debugging`, `deep-research`
- Supporting skills (optional): `unit-testing`, `flutter-mobile-qa`, `code-review`

## Context notes

- Provide the error message, stack trace, reproduction steps, and expected vs. actual behavior.
- Debugger follows the 5-step protocol: capture, reproduce, isolate, fix, verify.

## Workflow steps

1. Explorer reads the bug report and maps the affected code paths.
2. Debugger reproduces the issue, traces to root cause, and implements a minimal fix.
3. Tester runs the previously failing test plus regression tests.
4. Reviewer checks the fix is correct, minimal, and introduces no new issues.
5. If the fix is insufficient, debugger iterates with new evidence.

## Verification

- Root cause identified and documented.
- Fix is minimal and targeted (no unrelated changes).
- Previously failing test passes and no regressions introduced.

## Output Contract

```yaml
WORKFLOW_RESULT:
  primary_agent: debugger
  supporting_agents: [explorer, tester, reviewer]
  root_cause: <string>
  fix_summary: <string>
  changed_artifacts: [<path>]
  regression_checks: [<command or test>]
  follow_up_items: [<string>] | []
```