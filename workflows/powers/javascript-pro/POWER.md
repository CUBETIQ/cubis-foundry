````markdown
---
inclusion: manual
name: "javascript-pro"
description: "Use for modern JavaScript architecture and implementation across browser, Node, and edge runtimes with ES2025+ practices."
license: MIT
metadata:
  version: "2.0.0"
  domain: "language"
  role: "specialist"
  stack: "javascript"
  baseline: "ES2025+"
---

# JavaScript Pro

## When to use

- Implementing feature work in plain JavaScript.
- Refactoring legacy JS toward modern modules and async flows.
- Improving performance and reliability in browser/Node runtimes.

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

## Avoid

- Silent promise rejections.
- Heavy framework coupling in low-level modules.
- Copy-paste utility proliferation without consolidation.

## Reference files

- `references/modern-syntax.md`
- `references/async-patterns.md`
- `references/modules.md`
- `references/browser-apis.md`
- `references/node-essentials.md`
````
