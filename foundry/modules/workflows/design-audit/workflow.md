---
name: design-audit
command: "/design-audit"
description: Diagnose visual and UX weaknesses in an existing interface and return prioritized, concrete remediation guidance.
triggers:
  - design audit
  - ui critique
  - visual quality
  - ux review
agentChain:
  - reviewer
primarySkills:
  - design-audit
supportingSkills:
  - design
whenToUse: "When an interface exists already and the task is to critique, prioritize, and improve it."
priority: medium
compatibility:
  - claude
  - codex
  - copilot
  - gemini
  - antigravity
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

- `design-audit` is primary.
- `design` supports broader system-level visual reasoning when needed.

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
