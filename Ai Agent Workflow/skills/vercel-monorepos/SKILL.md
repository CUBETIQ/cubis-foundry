---
name: vercel-monorepos
description: "Implement monorepo project linking, build isolation, and environment boundaries."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0.0"
  domain: vercel
  triggers: vercel, deployment, monorepos
  role: specialist
  scope: implementation
  output-format: checklist
  related-skills: nextjs-developer, devops-engineer, plan-writing
---

# Vercel Monorepos

## Purpose
Implement monorepo project linking, build isolation, and environment boundaries.

## When To Use
- Vercel platform changes in the `platform` domain.
- Tasks requiring production-safe rollout and verification evidence.
- Work that needs explicit Vercel-specific constraints and guardrails.

## Operating Checklist
1. Confirm project, environment, and branch deployment expectations.
2. Apply the smallest configuration change that satisfies behavior goals.
3. Validate preview and production behavior with explicit rollback plan.
4. Document resulting deployment and operational constraints.

## Output Contract
- Proposed implementation choices and tradeoffs
- Required config, code, and environment changes
- Validation evidence and rollback notes
- Residual risks and follow-up actions
