---
name: vercel-speed-insights
description: "Use Speed Insights to improve Core Web Vitals and render performance."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0.0"
  domain: vercel
  triggers: vercel, observability, speed, insights
  role: specialist
  scope: implementation
  output-format: checklist
  related-skills: monitoring-expert, sre-engineer, error-ux-observability
---

# Vercel Speed Insights

## Purpose
Use Speed Insights to improve Core Web Vitals and render performance.

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
