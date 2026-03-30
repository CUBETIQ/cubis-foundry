---
name: design-audit
description: "Diagnose visual and UX weaknesses in an existing interface and return prioritized, concrete remediation guidance."
license: MIT
metadata:
  author: cubis-foundry
  route-kind: "workflow"
  route-id: "design-audit"
  platform: "Codex"
  command: "/design-audit"
compatibility: Codex
---
# Design Audit Workflow
## What this workflow does

Reviews an existing interface for hierarchy, layout, typography, affordance, and consistency issues, then prioritizes fixes.

## When to use

Use this when the product is built enough to inspect and the user wants critique or remediation guidance.

## Agent chain

`reviewer`

## Step details

1. Inspect the relevant screens or UI implementation.
2. Identify the highest-impact design defects.
3. Return prioritized findings with concrete remediation guidance.

## Skill routing

- `design` is primary in audit mode.
- `web-ui-design`, `mobile-ui-design`, or `desktop-ui-design` support the remediation route once the audit identifies the failing surface.

## Context notes

Provide screenshots, page routes, or component references and note whether the ask is critique-only or critique plus implementation.

## Verification

The result should prioritize specific issues rather than offering generic taste-based feedback.

## Output contract

```yaml
DESIGN_AUDIT_WORKFLOW_RESULT:
  findings:
    - severity: high | medium | low
      issue: <problem>
      fix: <recommended action>
  strengths:
    - <what already works>
```

## Follow-up items

Typical next step: `/design-screen` or `/implement`