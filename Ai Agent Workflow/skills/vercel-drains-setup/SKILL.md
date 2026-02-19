---
name: vercel-drains-setup
description: "Configure drains for exporting telemetry to external observability stacks."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0.0"
  domain: vercel
  triggers: vercel, observability, drains, setup
  role: specialist
  scope: implementation
  output-format: checklist
  related-skills: monitoring-expert, sre-engineer, error-ux-observability
---

# Vercel Drains Setup

## Purpose
Configure drains for exporting telemetry to external observability stacks.

## When To Use
- Vercel platform changes in the `obs` domain.
- Tasks requiring production-safe rollout and verification evidence.
- Work that needs explicit Vercel-specific constraints and guardrails.

## Operating Checklist
1. Define critical user journeys and map required telemetry coverage.
2. Ensure logs, traces, and metrics share correlation identifiers.
3. Set alert thresholds tied to user impact, not only resource counters.
4. Verify incident drill-down flow from alert to root-cause evidence.

## Output Contract
- Proposed implementation choices and tradeoffs
- Required config, code, and environment changes
- Validation evidence and rollback notes
- Residual risks and follow-up actions
