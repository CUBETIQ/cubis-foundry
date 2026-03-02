````markdown
---
inclusion: manual
name: "python-pro"
description: "Use for production Python with 3.14-era typing, async, packaging, and testing standards."
license: MIT
metadata:
  version: "2.0.0"
  domain: "language"
  role: "specialist"
  stack: "python"
  baseline: "Python 3.14"
---

# Python Pro

## When to use

- Building backend services, automation, or data pipelines in Python.
- Migrating legacy Python to typed and testable architecture.
- Implementing async I/O with predictable behavior.

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

## Avoid

- Untyped public APIs in shared modules.
- Hidden global state in request paths.
- Mixed sync/async call graphs without clear adapters.

## Reference files

- `references/type-system.md`
- `references/async-patterns.md`
- `references/testing.md`
- `references/packaging.md`
- `references/standard-library.md`
````
