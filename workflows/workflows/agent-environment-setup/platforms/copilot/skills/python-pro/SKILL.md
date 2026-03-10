---
name: python-pro
description: "Use for production Python with 3.14-era typing, async, packaging, and testing standards. Use when building Python backend services, migrating legacy Python to typed architecture, implementing async I/O, or setting up pytest and packaging workflows."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---
# Python Pro

## Purpose

Provide language-layer guidance for production Python — type annotations, async patterns, packaging, testing, and ecosystem tooling. Acts as the foundation before framework skills like `fastapi-expert` are loaded.

## When to Use

- Building backend services, automation, or data pipelines in Python.
- Migrating legacy Python to typed and testable architecture.
- Implementing async I/O with structured concurrency.
- Setting up pytest, packaging, or toolchain workflows.
- Serving as the language-layer baseline before loading framework-specific skills.

## Instructions

1. Establish interpreter and runtime constraints before writing code, because Python version determines which typing and async features are available.
2. Type annotate public functions and critical internal APIs using `Protocol` for structural subtyping and `TypeVar`/`ParamSpec` for generic boundaries. Use `object` over `Any` at public boundaries because `Any` silences the type checker.
3. Use `pyproject.toml`-first packaging with `hatchling`, `setuptools`, or `flit` as build backend. Do not use `setup.py` for new projects because `pyproject.toml` is the current standard.
4. Use `dataclass(frozen=True, slots=True)` for plain value objects and Pydantic `BaseModel` for external data validation (API input, config files) because Pydantic provides runtime schema enforcement.
5. Use `TaskGroup` (3.11+) for structured concurrency — child tasks are automatically cancelled if any raises. Use `asyncio.timeout` instead of `asyncio.wait_for` for cleaner timeout handling.
6. Keep sync and async call paths separate. Do not call `asyncio.run()` inside an already-running loop. Use `asyncio.to_thread()` to bridge sync-blocking code into async context.
7. Set explicit timeout and concurrency limits on external I/O because unbounded fan-out is the most common async performance bug.
8. Use `pytest` for tests with `@pytest.mark.parametrize` for edge cases. Use `hypothesis` for property-based testing when input domains are large.
9. Use `ruff` for all-in-one linting and formatting. Use `mypy` for strict type checking in CI and `pyright` for IDE feedback.
10. Use `uv` for fast dependency resolution and virtual environment management. Fall back to `pip` + `venv` when `uv` is unavailable.
11. Preserve exception context at service boundaries — do not swallow root causes. Keep business logic separate from framework glue.
12. Do not use untyped public APIs in shared modules because they propagate type uncertainty to consumers.
13. Do not use hidden global state in request paths because it creates unpredictable concurrency behavior.
14. Do not mix sync and async call graphs without clear adapters because it leads to blocking the event loop.

## Output Format

- Python source files with type annotations on public APIs.
- `pyproject.toml` for packaging configuration.
- Test files under `tests/` using pytest conventions.
- Structured as modules with explicit `__init__.py` exports.

## References

| File                             | Load when                                                               |
| -------------------------------- | ----------------------------------------------------------------------- |
| `references/type-system.md`      | Typing strategy, protocols, generics, or boundary models need detail.   |
| `references/async-patterns.md`   | Async I/O, task groups, or cancellation semantics need detail.          |
| `references/testing.md`          | Pytest strategy, fixtures, or concurrency-safe tests are needed.        |
| `references/packaging.md`        | Packaging, dependency layout, or toolchain reproducibility is in scope. |
| `references/standard-library.md` | Standard-library-first options need review before adding dependencies.  |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Set up a Python FastAPI project with proper typing and async patterns"
- "Migrate this legacy Python module to use dataclasses and type annotations"
- "Configure pytest with parametrize for this validation function"
