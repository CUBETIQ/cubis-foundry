````markdown
---
inclusion: manual
name: "nodejs-best-practices"
description: "Decision framework for modern Node.js backend architecture, operations, and security using current LTS-era practices."
license: MIT
metadata:
  version: "2.0.0"
  domain: "backend"
  role: "decision-guide"
  stack: "nodejs"
  baseline: "Node 22/24 LTS era"
---

# Node.js Best Practices

## Purpose

Use this skill to choose the right Node backend patterns for the actual constraints of the task, not by habit.

## Decision flow

1. Clarify deployment target (container, serverless, edge).
2. Select framework/runtime shape based on latency and team constraints.
3. Define API, validation, auth, and observability boundaries.
4. Implement smallest safe slice, then harden.

## Core guidance

- Prefer typed boundaries (TypeScript + schema validation).
- Keep transport concerns out of business logic.
- Standardize error envelopes and correlation IDs.
- Enforce timeout, retry, and circuit-breaker strategy for downstream calls.
- Use graceful shutdown and health/readiness probes.

## Security and reliability

- Validate all request input before business logic.
- Use least-privilege credentials and secret rotation.
- Avoid blocking the event loop in request paths.
- Add rate limits and abuse controls on external endpoints.

## Performance

- Measure before optimizing.
- Profile CPU and heap in realistic workloads.
- Use streaming/backpressure for large I/O paths.

## Output expectation

Return concrete architecture choices with tradeoffs, then implementation steps and verification criteria.
````
