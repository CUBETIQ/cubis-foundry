---
name: "nodejs-best-practices"
description: "Use for modern Node.js backend architecture, runtime choices, worker or queue boundaries, edge-vs-server tradeoffs, reliability controls, and production-safe service implementation in the current LTS era."
license: MIT
metadata:
  version: "3.0.0"
  domain: "backend"
  role: "specialist"
  stack: "nodejs"
  category: "frameworks-runtimes"
  layer: "frameworks-runtimes"
  canonical: true
  maturity: "stable"
  baseline: "Node 22/24 LTS era"
  tags: ["nodejs", "backend", "runtime", "services", "reliability", "security"]
---
# Node.js Best Practices

## When to use

- Choosing Node backend structure for APIs, workers, or service code.
- Making runtime, framework, validation, queue, and observability decisions.
- Hardening Node services for concurrency, deployment, and failure handling.
- Reviewing service code for event-loop safety, background work boundaries, and production behavior.

## When not to use

- Pure frontend React or Next.js component work.
- Language-only TypeScript questions with no Node runtime concern.
- Infra-only deployment policy with no Node service behavior in scope.

## Core workflow

1. Confirm runtime context: container, serverless, edge, worker, queue consumer, or long-lived process.
2. Pick the smallest framework/runtime shape that fits latency, I/O profile, and deployment constraints.
3. Keep transport, business logic, persistence, and background execution boundaries explicit.
4. Add validation, timeout, retry, backpressure, and observability controls before shipping.
5. Verify graceful shutdown, health checks, worker behavior, and dependency failure handling.

## Baseline standards

- Prefer typed boundaries and explicit schema validation.
- Avoid blocking the event loop in request paths.
- Use workers or queues when CPU-heavy or long-lived background work would distort request latency.
- Add correlation IDs and consistent error envelopes.
- Use graceful shutdown and readiness probes.
- Measure CPU, heap, and I/O hot paths before optimizing.

## Avoid

- Framework-by-habit decisions.
- Hidden background work with no timeout or cancellation path.
- Running CPU-bound work on the main event loop when workers or out-of-process jobs are needed.
- Unbounded retries and silent downstream failures.
- Secret handling or auth logic without explicit least-privilege boundaries.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/runtime-reliability-checklist.md` | You need a deeper checklist for runtime choice, shutdown, workers or queues, edge-vs-server tradeoffs, validation, retries, observability, and production failure handling. |
