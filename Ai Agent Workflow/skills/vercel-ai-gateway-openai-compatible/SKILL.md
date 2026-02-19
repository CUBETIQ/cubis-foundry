---
name: vercel-ai-gateway-openai-compatible
description: "Use OpenAI-compatible AI Gateway endpoints without lock-in risk."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0.0"
  domain: vercel
  triggers: vercel, ai, gateway, openai, compatible
  role: specialist
  scope: implementation
  output-format: checklist
  related-skills: prompt-engineer, monitoring-expert, secure-code-guardian
---

# Vercel Ai Gateway Openai Compatible

## Purpose
Use OpenAI-compatible AI Gateway endpoints without lock-in risk.

## When To Use
- Vercel platform changes in the `ai` domain.
- Tasks requiring production-safe rollout and verification evidence.
- Work that needs explicit Vercel-specific constraints and guardrails.

## Operating Checklist
1. Define model quality, latency, and cost objectives for each endpoint.
2. Implement routing, fallback, and authentication policy explicitly.
3. Instrument token usage, latency, and error classes for all calls.
4. Run safety and regression checks before broad rollout.

## Output Contract
- Proposed implementation choices and tradeoffs
- Required config, code, and environment changes
- Validation evidence and rollback notes
- Residual risks and follow-up actions
