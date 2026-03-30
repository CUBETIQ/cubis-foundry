# Workflow Prompt: /implement

Execute a scoped change end-to-end, using the smallest set of skills and checks required to finish correctly.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `spec-driven-delivery`, `web-testing`.
- Local skill file hints if installed: `.github/skills/spec-driven-delivery/SKILL.md`, `.github/skills/web-testing/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
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
