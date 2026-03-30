# Workflow Prompt: /debug

Investigate a failure systematically, confirm the root cause, and verify the fix path.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `systematic-debugging`, `web-testing`, `android-emulator-testing`, `ios-simulator-testing`.
- Local skill file hints if installed: `.github/skills/systematic-debugging/SKILL.md`, `.github/skills/web-testing/SKILL.md`, `.github/skills/android-emulator-testing/SKILL.md`, `.github/skills/ios-simulator-testing/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
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
