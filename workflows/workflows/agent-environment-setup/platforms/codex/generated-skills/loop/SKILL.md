---
name: loop
description: "Run a bounded autonomous iteration loop that keeps executing, verifying, and tightening scope until the task is done or blocked."
license: MIT
metadata:
  author: cubis-foundry
  route-kind: "workflow"
  route-id: "loop"
  platform: "Codex"
  command: "/loop"
compatibility: Codex
---
# Loop Workflow
## What this workflow does

Keeps a bounded execution cycle moving through small units of work, verifying each iteration before deciding whether to continue.

## When to use

Use this for contained tasks that benefit from repeated tighten-and-verify passes, not for open-ended product exploration.

## Agent chain

`orchestrator`

## Step details

1. Define the finish line and iteration limit.
2. Execute a small slice of work.
3. Verify, adjust scope, and continue until done or blocked.

## Skill routing

- Load only the skills needed for the current slice.
- Add the owning language or framework skill for code-level verification.
- Add `web-testing`, `android-emulator-testing`, or `ios-simulator-testing` when the loop needs runtime evidence.

## Context notes

Provide the target outcome, hard stop conditions, and any constraints on time or scope.

## Verification

Each loop must end with evidence. If progress stalls, the workflow should stop rather than hiding failure.

## Output contract

```yaml
LOOP_WORKFLOW_RESULT:
  iterations: <count>
  completed:
    - <item>
  evidence:
    - <verification>
  stopped_reason: <done | blocked | limit-reached>
```

## Follow-up items

Typical next step: `/review` or user escalation