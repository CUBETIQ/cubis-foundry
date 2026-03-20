# Workflow Prompt: /loop

Bounded autonomous iteration: run a task loop with explicit completion criteria, validation gates, and a hard iteration cap.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `kaizen-iteration`, `system-design`, `prompt-engineering`, `unit-testing`, `code-review`, `systematic-debugging`.
- Local skill file hints if installed: `.github/skills/kaizen-iteration/SKILL.md`, `.github/skills/system-design/SKILL.md`, `.github/skills/prompt-engineering/SKILL.md`, `.github/skills/unit-testing/SKILL.md`, `.github/skills/code-review/SKILL.md`, `.github/skills/systematic-debugging/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
# Loop Workflow

## When to use

Use when a task needs repeated attempt, validation, and correction until it satisfies a clear completion contract. This workflow is explicit and bounded. It must never start implicitly.

## Agent Chain

`orchestrator` -> delegates to `planner`, `implementer`, `tester`, and `reviewer` as needed

## Routing

1. **Scope**: `@orchestrator` turns the request into a bounded loop with a task, completion criteria, max iterations, and validation command.
2. **Plan**: `@planner` defines the first pass and stop conditions when the task is not already obvious.
3. **Execute**: `@implementer` applies the next increment.
4. **Validate**: `@tester` runs the required check or suite.
5. **Review**: `@reviewer` confirms the output is acceptable.
6. **Repeat**: `@orchestrator` decides whether another iteration is needed or the loop should stop.

## Skill Routing

- Primary skills: `kaizen-iteration`, `system-design`
- Supporting skills (optional): `prompt-engineering`, `unit-testing`, `code-review`, `systematic-debugging`

## Context notes

- Require explicit `--task`, `--completion-criteria`, and `--max-iterations` when the loop is started.
- Keep each iteration small and evidence-based.
- Stop when the completion criteria are met, validation fails repeatedly, or the iteration cap is reached.

## Workflow steps

1. Define the bounded task, completion criteria, and validation command.
2. Run one implementation increment.
3. Validate the increment.
4. Review the result against the completion criteria.
5. Repeat only if the loop still has room and the criteria are not satisfied.
6. Persist the result, evidence, and final status.

## Verification

- Completion criteria are explicit before the first iteration.
- Validation is run at least once per iteration.
- The loop stops at or before the configured iteration cap.
- Final output includes evidence, stop reason, and any follow-up items.

## Output Contract

```yaml
WORKFLOW_RESULT:
  primary_agent: orchestrator
  loop_status: <complete|blocked|stopped|failed>
  iteration_count: <number>
  completion_criteria_met: <boolean>
  validation_status: <pass|fail>
  follow_up_items: [<string>] | []
```
