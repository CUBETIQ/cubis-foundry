# Workflow Prompt: /test

Add or harden verification so the target behavior is covered by repeatable tests and focused checks.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `unit-testing`, `integration-testing`, `web-testing`, `android-emulator-testing`, `ios-simulator-testing`.
- Local skill file hints if installed: `.github/skills/unit-testing/SKILL.md`, `.github/skills/integration-testing/SKILL.md`, `.github/skills/web-testing/SKILL.md`, `.github/skills/android-emulator-testing/SKILL.md`, `.github/skills/ios-simulator-testing/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
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

- Start with `unit-testing` for narrow code-level coverage and add `integration-testing` when the proof crosses a real boundary.
- Route browser QA to `web-testing`.
- Route Android emulator work to `android-emulator-testing`.
- Route iOS simulator work to `ios-simulator-testing`.
- Load the owning language or framework skill alongside these testing surfaces when the target stack has specific test conventions.

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
