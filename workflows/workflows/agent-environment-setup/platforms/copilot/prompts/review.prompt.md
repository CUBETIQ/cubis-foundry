# Workflow Prompt: /review

Audit a change set for correctness, regression risk, missing tests, and security issues.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `code-review`, `owasp-security-review`.
- Local skill file hints if installed: `.github/skills/code-review/SKILL.md`, `.github/skills/owasp-security-review/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
# Review Workflow

## What this workflow does

Performs a findings-first review of a change set, concentrating on defects, regressions, and missing verification.

## When to use

Use this on PR review, before handoff, or whenever the user asks for a code review rather than implementation.

## Agent chain

`reviewer`

## Step details

1. Inspect the diff and affected files.
2. Identify correctness, coverage, and security concerns.
3. Return findings ordered by severity with concrete references.

## Skill routing

- `code-review` is mandatory.
- Add `owasp-security-review` when the change touches auth, secrets, input handling, or external boundaries.

## Context notes

Provide the diff, branch, or file list under review and any known concerns.

## Verification

The result should cite code evidence and avoid speculative or preference-only feedback.

## Output contract

```yaml
REVIEW_WORKFLOW_RESULT:
  findings:
    - severity: high | medium | low
      file: <path>
      issue: <problem>
  residual_risks:
    - <risk>
```

## Follow-up items

Typical next step: `/implement`
