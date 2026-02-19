---
name: vercel-edge-to-node-migration
description: "Migrate Edge Runtime workloads to Node runtime when compatibility requires it."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0.0"
  domain: vercel
  triggers: vercel, functions, edge, to, node, migration
  role: specialist
  scope: implementation
  output-format: checklist
  related-skills: nextjs-developer, nodejs-best-practices, devops-engineer
---

# Vercel Edge To Node Migration

## Purpose
Migrate Edge Runtime workloads to Node runtime when compatibility requires it.

## When To Use
- Vercel platform changes in the `compute` domain.
- Tasks requiring production-safe rollout and verification evidence.
- Work that needs explicit Vercel-specific constraints and guardrails.

## Operating Checklist
1. Choose runtime and region behavior from measurable latency and compatibility needs.
2. Set duration and memory limits that match workload characteristics.
3. Validate cold start, steady-state latency, and failure handling paths.
4. Record runtime constraints and escalation triggers for incidents.

## Output Contract
- Proposed implementation choices and tradeoffs
- Required config, code, and environment changes
- Validation evidence and rollback notes
- Residual risks and follow-up actions
