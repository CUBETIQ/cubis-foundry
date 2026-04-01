# Python Best Practices — Eval Assertions

## Eval 1: Typing Migration (python-typing-migration)

This eval tests whether the skill correctly migrates legacy typing idioms to Python 3.13+ modern syntax.

### Assertions

1. **PEP 695 type parameter syntax** — The response must use the new `class Foo[T]:` and `def bar[K, V](...)` syntax introduced in PEP 695 instead of creating explicit `TypeVar` bindings. This is the defining feature of modern Python generics.

2. **Optional replaced with union syntax** — `Optional[T]` must become `T | None`. The pipe union syntax is shorter, clearer, and consistent with how unions appear in `isinstance` checks and `match` statements.

3. **Lowercase built-in generics** — `List[T]` must become `list[T]`, `Dict[K, V]` must become `dict[K, V]`. Since Python 3.9, built-in collections are directly subscriptable, and the `typing` module versions are legacy.

4. **Union replaced with pipe syntax** — `Union[str, int, None]` must become `str | int | None`. The PEP 604 union syntax has been available since Python 3.10 and is the standard form.

5. **Removed TypeVar and Generic imports** — The explicit `T = TypeVar('T')` declarations and `from typing import Generic` must be removed because PEP 695 scopes type parameters directly to the class or function, making manual `TypeVar` creation unnecessary.

## Eval 2: Async Service Implementation (python-async-service)

This eval tests whether the skill produces a well-structured async worker with modern concurrency patterns.

### Assertions

1. **TaskGroup for structured concurrency** — The response must use `asyncio.TaskGroup` (Python 3.11+) rather than bare `asyncio.create_task` or `asyncio.gather`. TaskGroup propagates exceptions and cancels sibling tasks on failure.

2. **Graceful shutdown handling** — The service must handle SIGTERM by setting a shutdown event or cancelling the TaskGroup. Production services must drain in-flight work before exiting rather than terminating abruptly.

3. **Async context managers for resources** — Connection pools for Redis and PostgreSQL must be managed with `async with` blocks to guarantee cleanup even under cancellation or exception.

4. **Structured error handling** — The response must define custom exception types or use explicit exception handling rather than bare `except:` or `except Exception:`. Error handling strategy must be visible and intentional.

5. **Structured logging with context** — Log entries must include contextual information (message IDs, worker names, operation durations) because structured logs with context are essential for debugging production async services.
