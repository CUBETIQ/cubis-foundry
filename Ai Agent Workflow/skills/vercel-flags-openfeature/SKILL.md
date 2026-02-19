---
name: vercel-flags-openfeature
description: "Integrate Vercel Flags with OpenFeature-compatible interfaces."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0.0"
  domain: vercel
  triggers: vercel, flags, openfeature
  role: specialist
  scope: implementation
  output-format: checklist
  related-skills: feature-forge, qa-automation-engineer, monitoring-expert
---

# Vercel Flags Openfeature

## Purpose
Integrate Vercel Flags with OpenFeature-compatible interfaces.

## When To Use
- Vercel platform changes in the `flags` domain.
- Tasks requiring production-safe rollout and verification evidence.
- Work that needs explicit Vercel-specific constraints and guardrails.

## Operating Checklist
1. Define rollout cohorts and success/failure metrics before toggling flags.
2. Implement flag evaluation boundaries close to request decision points.
3. Test override and fallback behavior for each environment.
4. Plan cleanup path for stale flags and expired experiments.

## Output Contract
- Proposed implementation choices and tradeoffs
- Required config, code, and environment changes
- Validation evidence and rollback notes
- Residual risks and follow-up actions
