````markdown
---
inclusion: manual
name: vercel-ai-gateway
description: "Complete Vercel AI Gateway integration: LLM traffic routing, authentication/BYOK, fallback chains, model-provider routing policies, usage observability, and OpenAI-compatible endpoints."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0.0"
  domain: vercel
  triggers: vercel, ai, gateway, llm, byok, fallback, model routing, openai compatible, token usage, ai observability
  role: specialist
  scope: implementation
  output-format: checklist
  related-skills: prompt-engineer, monitoring-expert, secure-code-guardian, vercel-observability
  consolidates: vercel-ai-gateway-core, vercel-ai-gateway-auth-byok, vercel-ai-gateway-fallbacks, vercel-ai-gateway-model-routing, vercel-ai-gateway-observability, vercel-ai-gateway-openai-compatible
---

# Vercel AI Gateway

## Purpose

Route LLM traffic through Vercel AI Gateway with unified controls covering authentication, model-provider routing, resilient fallback chains, usage observability, and OpenAI-compatible endpoint compatibility.

## When To Use

- Routing AI/LLM requests through Vercel's managed gateway.
- Configuring bring-your-own-key (BYOK) authentication for AI providers.
- Implementing retries and fallback chains for resilient AI responses.
- Designing model and provider routing policies for latency, quality, and cost.
- Monitoring AI Gateway usage, latency, and spend.
- Using OpenAI-compatible endpoints without provider lock-in.

## Domain Areas

### Core Routing

- Define unified gateway endpoint and routing config.
- Set per-model quality, latency, and cost objectives.

### Authentication & BYOK

- Configure provider API key management and BYOK controls.
- Scope key access per project/environment.

### Fallbacks & Resilience

- Implement retry policies and fallback provider chains.
- Define circuit-breaker thresholds.

### Model Routing Policies

- Route by latency, cost, capability, or custom weights.
- Support multi-provider and multi-region strategies.

### Observability

- Instrument token usage, latency, and error rates per model.
- Set spend thresholds and alerting.

### OpenAI Compatibility

- Use OpenAI-compatible request/response format.
- Migrate between providers without application changes.

## Operating Checklist

1. Define model quality, latency, and cost objectives for each endpoint.
2. Configure authentication and BYOK key scoping per environment.
3. Implement routing, fallback, and retry policies explicitly.
4. Instrument token usage, latency, and error classes for all calls.
5. Validate OpenAI-compatible endpoint compatibility if needed.
6. Run safety and regression checks before broad rollout.

## Output Contract

- Proposed routing and authentication architecture with tradeoffs
- Required config, code, and environment changes
- Fallback chain definition and circuit-breaker settings
- Validation evidence (spend limits, latency targets, error budgets)
- Residual risks and follow-up actions
````
