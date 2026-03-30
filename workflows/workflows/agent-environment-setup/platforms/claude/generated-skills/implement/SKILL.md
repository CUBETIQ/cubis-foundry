---
name: implement
description: "Execute a scoped change end-to-end, using the smallest set of skills and checks required to finish correctly."
license: MIT
metadata:
  author: cubis-foundry
  route-kind: "workflow"
  route-id: "implement"
  platform: "Claude Code"
  command: "/implement"
compatibility: Claude Code
---
# Implement Workflow
## What this workflow does

Routes directly to delivery, keeping planning overhead low while still enforcing verification and concise reporting.

## When to use

Use this when the task is understood, the acceptance criteria are clear, and the main need is execution rather than discovery.

## Agent chain

`implementer`

## Step details

1. Inspect the target code and nearby tests.
2. Make the smallest coherent change.
3. Run focused verification and fix regressions introduced during implementation.

## Skill routing

- Load the domain skill for the affected subsystem.
- Add the owning language or framework skill when code-level verification is needed.
- Add `web-testing`, `android-emulator-testing`, or `ios-simulator-testing` when user-visible runtime verification is needed.

## Context notes

Provide the acceptance criteria, relevant files, and any verification commands that must pass.

## Verification

Completion requires changed files, executed checks, and a short explanation of behavior change.

## Output contract

```yaml
IMPLEMENT_WORKFLOW_RESULT:
  files_changed:
    - <path>
  verification:
    - <command>
  behavior_change: <summary>
```

## Follow-up items

Typical next step: `/review` or `/test`