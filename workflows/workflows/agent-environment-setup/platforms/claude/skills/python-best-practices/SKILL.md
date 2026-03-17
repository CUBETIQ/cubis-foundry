---
name: python-best-practices
description: "Use when writing production Python 3.12–3.14 code: modern typing with PEP 695/696 syntax, async service patterns, packaging with pyproject.toml, pytest-based testing, and standard-library-first design."
allowed-tools: Read Grep Glob Bash Edit Write
user-invocable: true
argument-hint: "Python module, file, or pattern to analyze"
---

# Python Best Practices

## Purpose

Production-grade guidance for Python 3.12–3.14 covering the modern type system (type parameter syntax, TypeVar defaults, TypeIs), async/await patterns for services and workers, contemporary packaging with pyproject.toml and build backends, pytest-driven testing strategies, and disciplined use of the standard library before reaching for third-party dependencies.

## When to Use

- Writing new Python services, libraries, or CLI tools targeting 3.12+.
- Migrating legacy code from older typing idioms (TypeVar(), Optional, Union) to PEP 695/696 syntax.
- Designing async services with aiohttp, FastAPI, or raw asyncio.
- Setting up test suites with pytest, fixtures, and parametrize.
- Packaging projects with pyproject.toml, hatch, or setuptools.

## Instructions

1. **Target Python 3.12+ as the baseline** — use `type` statement syntax (PEP 695) for all type aliases and generics because it is more readable and avoids forward-reference strings. Fall back to `typing.TypeVar` only when supporting 3.11 or earlier.

2. **Use the new type parameter syntax for generics** — write `def first[T](items: list[T]) -> T` instead of creating explicit TypeVar bindings because PEP 695 scopes type parameters to their function or class, eliminating stale-variable bugs. Apply `TypeVar` defaults (PEP 696, Python 3.13+) when a generic has a sensible default type.

3. **Replace `Optional[X]` with `X | None`** — the union syntax is clearer and mirrors runtime `isinstance` checks. Use `TypeIs` (PEP 742, Python 3.14) instead of `TypeGuard` when the narrowing function guarantees the negative case, because `TypeIs` narrows both branches.

4. **Design async code around structured concurrency** — use `asyncio.TaskGroup` (3.11+) instead of bare `create_task` because it propagates exceptions and cancels siblings on failure. Avoid mixing `asyncio.gather` with manual exception handling; `TaskGroup` replaces that pattern cleanly.

5. **Never block the event loop** — offload CPU-bound or blocking-IO work with `asyncio.to_thread()` or a `ProcessPoolExecutor`. If a third-party library lacks async support, wrap it in `to_thread` rather than calling it directly in an `async def` because one blocking call stalls every coroutine in the loop.

6. **Structure async services with graceful shutdown** — handle `SIGTERM`/`SIGINT` by cancelling the root `TaskGroup` or setting a shutdown event. Use `async with` resource managers for database pools, HTTP sessions, and message-queue connections because context managers guarantee cleanup even under cancellation.

7. **Package with `pyproject.toml` exclusively** — do not create `setup.py` or `setup.cfg` for new projects. Declare build backend (`hatchling`, `setuptools>=69`, or `flit-core`), dependencies, optional-dependencies, and entry points in `pyproject.toml` because PEP 621 metadata is the only standard the ecosystem converges on.

8. **Pin dependencies with lock files** — use `uv lock`, `pip-compile`, or `pdm lock` to produce a reproducible lock file. Keep `pyproject.toml` for loose constraints and the lock file for exact pins because reproducible builds require deterministic resolution.

9. **Write tests with pytest, not unittest** — use `@pytest.fixture` for setup/teardown, `@pytest.mark.parametrize` for input matrices, and `tmp_path` for filesystem isolation. Prefer plain `assert` statements because pytest rewrites them for rich diffs automatically.

10. **Test async code with `pytest-asyncio`** — mark async tests with `@pytest.mark.asyncio` and use `asyncio_mode = "auto"` in `pyproject.toml` to avoid per-test markers. Mock time with `freezegun` or `time-machine` rather than `asyncio.sleep` in tests because deterministic time prevents flaky CI.

11. **Enforce type checking in CI** — run `mypy --strict` or `pyright` in basic mode at minimum. Treat type errors as build failures because type regressions in merged code are far more expensive to fix than at PR time. Use `# type: ignore[code]` with specific error codes, never bare `# type: ignore`.

12. **Lint and format with ruff** — replace flake8, isort, and black with `ruff check` and `ruff format` because ruff is orders of magnitude faster and covers the same rule sets. Configure in `pyproject.toml` under `[tool.ruff]`.

13. **Use dataclasses or attrs for value objects** — prefer `@dataclass(frozen=True, slots=True)` for immutable records because slots reduce memory and frozen prevents accidental mutation. Use Pydantic `BaseModel` only when validation of external input is needed; do not use it for internal data transfer.

14. **Prefer standard-library solutions first** — use `pathlib` over `os.path`, `tomllib` (3.11+) over `tomli`, `importlib.resources` over `pkg_resources`, and `argparse` or `sys.argv` for simple CLIs before reaching for click or typer. Third-party deps are justified only when the stdlib alternative requires significantly more code.

15. **Handle errors with explicit exception hierarchies** — define a base exception for your library (`class MyLibError(Exception)`) and subclass it for each failure mode. Catch specific exceptions; never use bare `except:` or `except Exception:` at module boundaries without re-raising because it silences bugs.

16. **Log with `structlog` or stdlib `logging`** — use structured key-value logging (JSON in production, console in development). Attach request IDs, trace context, and operation names to every log entry because grep-friendly logs cut incident response time.

## Output Format

Produces Python code using PEP 695 type syntax, asyncio structured concurrency, pytest test suites, and pyproject.toml packaging. Includes type annotations on all public APIs, structured error hierarchies, and inline comments explaining non-obvious design choices.

## References

| File | Load when |
| --- | --- |
| `references/type-system.md` | Modern typing syntax, PEP 695/696/742 details, or mypy/pyright configuration needed. |
| `references/async-patterns.md` | Async service design, TaskGroup, shutdown, or event-loop discipline needed. |
| `references/testing.md` | Pytest fixtures, parametrize, async test setup, or coverage configuration needed. |
| `references/packaging.md` | pyproject.toml structure, build backends, dependency management, or publishing needed. |
| `references/standard-library.md` | Choosing stdlib over third-party, or using pathlib/tomllib/importlib.resources. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Migrate this service's typing from TypeVar/Optional to PEP 695 type parameter syntax and union types."
- "Design an async worker that processes messages from a queue with graceful shutdown and structured concurrency."
- "Set up a pytest suite with fixtures, parametrize, and async test support for this FastAPI application."

## Claude Platform Notes

- Use `$ARGUMENTS` to access user-provided arguments passed when the skill is invoked.
- Reference skill-local files with `${CLAUDE_SKILL_DIR}/references/<file>` for portable paths.
- When `context: fork` is set, the skill runs in an isolated subagent context; the `agent` field names the fork target.
- Custom subagents in `.claude/agents/*.md` support YAML frontmatter: `name`, `description`, `tools`, `model`, `maxTurns`, `memory`, `handoffs`.
- Use `model` field in agent frontmatter to select model per subagent (e.g., `model: opus` for complex analysis).
- Set `maxTurns` to prevent runaway iterations (default: 25, orchestrator: 30).
- Key agents support `memory: project` for cross-session learning (orchestrator, debugger, researcher, project-planner).
- Hook templates in `.claude/hooks/` provide lifecycle event integration at `UserPromptSubmit` and other events.
- Path-scoped rules: `.claude/rules/*.md` with `paths:` frontmatter for targeted guidance.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available for dynamic skill discovery and loading.
- Use `allowed-tools` in frontmatter to restrict tool access for security-sensitive skills.
- Workflow skills can be compiled to `.claude/skills/<workflow-id>/SKILL.md` as `generatedSkills`.
