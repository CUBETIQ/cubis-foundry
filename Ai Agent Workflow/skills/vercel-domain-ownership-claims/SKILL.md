---
name: vercel-domain-ownership-claims
description: "Handle domain ownership claims and re-verification procedures."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0.0"
  domain: vercel
  triggers: vercel, domains, domain, ownership, claims
  role: specialist
  scope: implementation
  output-format: checklist
  related-skills: devops-engineer, server-management, security-reviewer
---

# Vercel Domain Ownership Claims

## Purpose
Handle domain ownership claims and re-verification procedures.

## When To Use
- Vercel platform changes in the `network` domain.
- Tasks requiring production-safe rollout and verification evidence.
- Work that needs explicit Vercel-specific constraints and guardrails.

## Operating Checklist
1. Confirm ownership and DNS authority for each managed domain.
2. Apply changes with TTL and propagation windows accounted for.
3. Validate certificate state and endpoint reachability after updates.
4. Prepare rollback records for every production DNS change.

## Output Contract
- Proposed implementation choices and tradeoffs
- Required config, code, and environment changes
- Validation evidence and rollback notes
- Residual risks and follow-up actions
