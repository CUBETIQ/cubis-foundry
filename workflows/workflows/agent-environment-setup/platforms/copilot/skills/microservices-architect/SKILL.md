---
name: "microservices-architect"
description: "Use when decomposing systems into services, designing service boundaries, choosing sync and async integration patterns, and managing distributed-system reliability tradeoffs."
license: MIT
metadata:
  version: "3.0.0"
  domain: "architecture"
  role: "specialist"
  stack: "distributed-systems"
  category: "frameworks-runtimes"
  layer: "frameworks-runtimes"
  canonical: true
  maturity: "stable"
  baseline: "modern distributed-service architecture"
  tags: ["microservices", "ddd", "distributed-systems", "events", "services", "resilience"]
---
# Microservices Architect

## When to use

- Decomposing a monolith or clarifying service boundaries.
- Choosing sync vs async integration between services.
- Designing distributed consistency, retries, timeouts, and failure isolation.
- Reviewing whether a system is becoming a distributed monolith.

## When not to use

- Single-service architecture where microservices are not justified.
- Generic backend work with no service-boundary decision.
- Database-specific optimization with no distributed-system concern.

## Core workflow

1. Prove the organizational or product reason for multiple services.
2. Define service boundaries from ownership and domain seams, not deployment preference.
3. Choose communication and consistency strategy per interaction.
4. Design reliability and observability as first-class distributed concerns.
5. Check whether the proposed split actually reduces coordination risk.

## Baseline standards

- Prefer clear bounded contexts over premature service count growth.
- Keep contracts explicit and versionable.
- Design for retries, timeouts, idempotency, and degraded modes.
- Treat tracing, logs, and metrics as required, not optional.
- Use async boundaries deliberately where coupling or latency demand it.

## Avoid

- Splitting services without ownership clarity.
- Shared databases masquerading as autonomy.
- Chatty synchronous call chains with no resilience model.
- Event-driven complexity when direct boundaries would be simpler.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/service-boundary-checklist.md` | You need a more detailed playbook for service seams, contracts, async boundaries, idempotency, and distributed failure modes. |
