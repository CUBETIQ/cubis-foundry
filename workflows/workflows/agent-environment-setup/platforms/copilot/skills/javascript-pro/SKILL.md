---
name: "javascript-pro"
description: "Use for modern JavaScript architecture and implementation across browser, Node, and edge runtimes with runtime-aware production practices."
license: MIT
metadata:
  version: "2.0.0"
  domain: "language"
  role: "specialist"
  stack: "javascript"
  baseline: "Runtime-policy baseline (Node/browser/edge)"
---
# JavaScript Pro

## When to use

- Implementing feature work in plain JavaScript.
- Refactoring legacy JS toward modern modules and async flows.
- Improving performance and reliability in browser/Node runtimes.

## When not to use

- Type-driven architecture work where TypeScript is the actual project language.
- Database-only investigation with no JavaScript runtime behavior involved.
- One-off shell automation that should remain shell-native.

## Core workflow

1. Confirm runtime constraints (browser targets, Node/edge version).
2. Choose module boundaries and async strategy.
3. Implement with explicit error and cancellation handling.
4. Verify behavior with tests and runtime checks.

## Baseline standards

- Prefer ESM for new code unless compatibility blocks it.
- Use `AbortSignal` for cancellable async operations.
- Keep side effects at edges; pure logic in reusable modules.
- Validate untrusted input at boundaries.
- Keep dependency surface intentionally small.

## Implementation guidance

- Use `Promise.all` for independent parallel operations.
- Use structured logging and consistent error shapes.
- Use streams for large payloads to avoid memory spikes.
- Use feature detection, not UA sniffing, in browser code.

## Debugging and observability

- Reproduce runtime-specific failures in the exact target environment: browser, Node, or edge.
- Surface async failures with structured errors and explicit logging context.
- Use performance tooling before redesigning hot paths or caching strategy.

## Performance and reliability

- Keep bundle/runtime boundaries explicit so shared code does not assume unavailable APIs.
- Bound parallelism and cancellation for network-heavy flows.
- Prefer streaming, chunking, and incremental parsing for large payloads.

## Avoid

- Silent promise rejections.
- Heavy framework coupling in low-level modules.
- Copy-paste utility proliferation without consolidation.

## Reference files

| File | Load when |
| --- | --- |
| `references/modern-syntax.md` | Choosing modern syntax/features for current runtime targets. |
| `references/async-patterns.md` | Cancellation, retries, concurrency, or promise orchestration needs detail. |
| `references/modules.md` | ESM/CJS/module-boundary tradeoffs are in scope. |
| `references/browser-apis.md` | Browser-specific APIs, capability checks, or UX/runtime constraints matter. |
| `references/node-essentials.md` | Node runtime behavior, streams, files, or process concerns matter. |
