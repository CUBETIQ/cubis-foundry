---
name: "python-pro"
description: "Use for production Python with 3.14-era typing, async, packaging, and testing standards."
license: MIT
metadata:
  version: "2.0.0"
  domain: "language"
  role: "specialist"
  stack: "python"
  category: "languages"
  layer: "languages"
  canonical: true
  maturity: "stable"
  aliases: ["python-patterns"]
  baseline: "Python 3.14"
  tags: ["python", "typing", "async", "pytest", "packaging"]
---
# Python Pro

## When to use

- Building backend services, automation, or data pipelines in Python.
- Migrating legacy Python to typed and testable architecture.
- Implementing async I/O with predictable behavior.
- Serving as the language-layer baseline before framework skills like `fastapi-expert` are loaded.

## When not to use

- Frontend-only tasks with no Python runtime involved.
- Database-only tuning or migration work with no Python code change.
- Tiny shell-first automation where Python adds unnecessary packaging/runtime cost.

## Core workflow

1. Establish interpreter/runtime constraints.
2. Define typed interfaces and domain models.
3. Implement sync/async boundaries explicitly.
4. Validate with tests, type checks, and linting.

## Baseline standards

- Type annotate public functions and critical internal APIs.
- Use `pyproject.toml`-first packaging and tooling.
- Use `pytest` for tests and parametrize edge cases.
- Keep business logic separate from framework glue.
- Prefer stdlib clarity before adding dependencies.

## Implementation guidance

- Use `dataclass`/Pydantic models for domain boundaries.
- Use `TaskGroup`-style structured concurrency where possible.
- Preserve exception context; do not swallow root causes.
- Keep I/O async and CPU work isolated where needed.
- Treat free-threaded mode as opt-in until dependencies are validated.

## Debugging and observability

- Preserve exception context and structured log fields at service boundaries.
- Reproduce async bugs with deterministic fixtures before widening scope.
- Use profiling and trace tooling before speculative concurrency changes.

## Performance and reliability

- Set timeout/retry budgets explicitly for external I/O.
- Isolate CPU-heavy work from event loops or request handlers.
- Keep dependency and packaging state reproducible with `pyproject.toml` tooling.

## Avoid

- Untyped public APIs in shared modules.
- Hidden global state in request paths.
- Mixed sync/async call graphs without clear adapters.

## Reference files

| File | Load when |
| --- | --- |
| `references/type-system.md` | Typing strategy, protocols, generics, or boundary models need detail. |
| `references/async-patterns.md` | Async I/O, task groups, or cancellation semantics need detail. |
| `references/testing.md` | Pytest strategy, fixtures, or concurrency-safe tests are needed. |
| `references/packaging.md` | Packaging, dependency layout, or toolchain reproducibility is in scope. |
| `references/standard-library.md` | Standard-library-first options need review before adding dependencies. |
