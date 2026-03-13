````markdown
---
inclusion: manual
name: nodejs-best-practices
description: "Use for modern Node.js backend architecture, runtime choices, worker or queue boundaries, edge-vs-server tradeoffs, reliability controls, and production-safe service implementation in the current LTS era."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---

# Node.js Best Practices

## Purpose

Use for modern Node.js backend architecture, runtime choices, worker or queue boundaries, edge-vs-server tradeoffs, reliability controls, and production-safe service implementation in the current LTS era.

## When to Use

- Choosing Node backend structure for APIs, workers, or service code.
- Making runtime, framework, validation, queue, and observability decisions.
- Hardening Node services for concurrency, deployment, and failure handling.
- Reviewing service code for event-loop safety, background work boundaries, and production behavior.

## Instructions

1. Confirm runtime context: container, serverless, edge, worker, queue consumer, or long-lived process.
2. Pick the smallest framework/runtime shape that fits latency, I/O profile, and deployment constraints.
3. Keep transport, business logic, persistence, and background execution boundaries explicit.
4. Add validation, timeout, retry, backpressure, and observability controls before shipping.
5. Verify graceful shutdown, health checks, worker behavior, and dependency failure handling.

### Baseline standards

- Prefer typed boundaries and explicit schema validation.
- Avoid blocking the event loop in request paths.
- Use workers or queues when CPU-heavy or long-lived background work would distort request latency.
- Add correlation IDs and consistent error envelopes.
- Use graceful shutdown and readiness probes.
- Measure CPU, heap, and I/O hot paths before optimizing.

### Constraints

- Avoid framework-by-habit decisions.
- Avoid hidden background work with no timeout or cancellation path.
- Avoid running CPU-bound work on the main event loop when workers or out-of-process jobs are needed.
- Avoid unbounded retries and silent downstream failures.
- Avoid secret handling or auth logic without explicit least-privilege boundaries.

## Output Format

Provide implementation guidance, code examples, and configuration as appropriate to the task.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/runtime-reliability-checklist.md` | You need a deeper checklist for runtime choice, shutdown, workers or queues, edge-vs-server tradeoffs, validation, retries, observability, and production failure handling. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me with nodejs best practices best practices in this project"
- "Review my nodejs best practices implementation for issues"
````
