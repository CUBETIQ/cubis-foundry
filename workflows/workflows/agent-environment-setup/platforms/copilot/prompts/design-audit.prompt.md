# Workflow Prompt: /design-audit

Diagnose visual and UX weaknesses in an existing interface and return prioritized, concrete remediation guidance.

Execution contract:
1. Treat route selection as already resolved by this command; do not begin with skill discovery.
2. Read `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, and `docs/foundation/TECH.md` in that order when they exist before non-trivial execution.
Attached skills:
- Load these exact skill IDs first: `design`, `web-ui-design`, `mobile-ui-design`, `desktop-ui-design`.
- Local skill file hints if installed: `.github/skills/design/SKILL.md`, `.github/skills/web-ui-design/SKILL.md`, `.github/skills/mobile-ui-design/SKILL.md`, `.github/skills/desktop-ui-design/SKILL.md`.
- Treat the skill bundle as already resolved for this workflow. Do not start with route discovery.
3. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
4. Route to the workflow's primary specialist and only add supporting specialists when needed.
5. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
6. Return actions taken, verification evidence, and any gaps.

Workflow source:
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
