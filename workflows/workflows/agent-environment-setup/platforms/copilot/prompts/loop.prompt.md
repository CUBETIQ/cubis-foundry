# Workflow Prompt: /loop

Run a bounded autonomous iteration loop that keeps executing, verifying, and tightening scope until the task is done or blocked.

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
