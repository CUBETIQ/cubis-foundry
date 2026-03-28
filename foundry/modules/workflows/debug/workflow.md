---
name: debug
command: "/debug"
description: Investigate a failure systematically, confirm the root cause, and verify the fix path.
triggers:
  - debug
  - bug
  - failure
  - broken
agentChain:
  - debugger
primarySkills:
  - systematic-debugging
supportingSkills:
  - web-testing
  - android-emulator-testing
  - ios-simulator-testing
whenToUse: "When the current behavior is wrong and the root cause is not yet proven."
priority: high
compatibility:
  - claude
  - codex
  - copilot
  - gemini
  - antigravity
---

# Debug Workflow

## What this workflow does

Turns a vague failure report into a reproducible symptom, a confirmed cause, and a verified fix path.

## When to use

Use this when reproduction, diagnosis, and evidence matter more than immediately editing code.

## Agent chain

`debugger`

## Step details

1. Reproduce or precisely restate the failure.
2. Test hypotheses against evidence until the root cause is confirmed.
3. Propose or apply the fix and verify that the symptom is gone.

## Skill routing

- Always load `systematic-debugging`.
- Add the relevant domain skill only after the failure surface is known.
- Keep code-level unit and integration checks inside the owning language or framework skill.
- Use `web-testing`, `android-emulator-testing`, or `ios-simulator-testing` when the bug only proves out in a live browser or device runtime.

## Context notes

Provide the observed symptom, expected behavior, reproduction steps, and recent changes if known.

## Verification

The workflow is complete only when the root cause is explicit and the fix is validated against the original symptom.

## Output contract

```yaml
DEBUG_WORKFLOW_RESULT:
  symptom: <failure>
  root_cause: <cause>
  evidence:
    - <proof>
  verification: <fix confirmation>
```

## Follow-up items

Typical next step: `/implement` or `/test`
