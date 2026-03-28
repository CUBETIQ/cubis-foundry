---
name: test
command: "/test"
description: Add or harden verification so the target behavior is covered by repeatable tests and focused checks.
triggers:
  - test
  - coverage
  - verify
  - regression
agentChain:
  - tester
primarySkills:
  - web-testing
supportingSkills:
  - android-emulator-testing
  - ios-simulator-testing
whenToUse: "When behavior needs stronger proof, especially after code changes or bug fixes."
priority: high
compatibility:
  - claude
  - codex
  - copilot
  - gemini
  - antigravity
---

# Test Workflow

## What this workflow does

Chooses the right test layer, adds or improves coverage, and records what behavior is now verified.

## When to use

Use this when the implementation exists but verification is weak, missing, or too manual.

## Agent chain

`tester`

## Step details

1. Identify the behavior that must be proven.
2. Add the narrowest useful tests or checks.
3. Run them and report both coverage added and remaining gaps.

## Skill routing

- Route browser QA to `web-testing`.
- Route Android emulator work to `android-emulator-testing`.
- Route iOS simulator work to `ios-simulator-testing`.
- For code-level unit or integration coverage, load the owning language or framework skill instead of generic testing wrappers.

## Context notes

Provide the change summary, risk areas, and any known flaky or expensive checks.

## Verification

Completion requires executed evidence, not just proposed test ideas.

## Output contract

```yaml
TEST_WORKFLOW_RESULT:
  coverage_added:
    - <test>
  commands_run:
    - <command>
  remaining_gaps:
    - <gap>
```

## Follow-up items

Typical next step: `/review`
