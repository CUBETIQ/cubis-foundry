---
name: review
description: "Audit a change set for correctness, regression risk, missing tests, and security issues."
license: MIT
metadata:
  author: cubis-foundry
  route-kind: "workflow"
  route-id: "review"
  platform: "Codex"
  command: "/review"
compatibility: Codex
---
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