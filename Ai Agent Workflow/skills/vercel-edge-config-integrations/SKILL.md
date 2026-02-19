---
name: vercel-edge-config-integrations
description: "Integrate Edge Config with external flag/config providers safely."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0.0"
  domain: vercel
  triggers: vercel, storage, edge, config, integrations
  role: specialist
  scope: implementation
  output-format: checklist
  related-skills: database-design, postgres-pro, server-management
---

# Vercel Edge Config Integrations

## Purpose
Integrate Edge Config with external flag/config providers safely.

## When To Use
- Vercel platform changes in the `storage` domain.
- Tasks requiring production-safe rollout and verification evidence.
- Work that needs explicit Vercel-specific constraints and guardrails.

## Operating Checklist
1. Map data access patterns and retention requirements first.
2. Choose storage primitive that matches latency, consistency, and cost goals.
3. Implement access control and environment isolation for each data path.
4. Validate migration and recovery procedures before production rollout.

## Output Contract
- Proposed implementation choices and tradeoffs
- Required config, code, and environment changes
- Validation evidence and rollback notes
- Residual risks and follow-up actions
