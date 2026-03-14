# Python Modern Type System (3.12–3.14)

## PEP 695: Type Parameter Syntax (Python 3.12+)

The `type` statement and inline type parameter syntax replace explicit `TypeVar` creation.

### Before (Legacy)

```python
from typing import TypeVar, Generic

T = TypeVar("T")
K = TypeVar("K")
V = TypeVar("V", bound=Comparable)

class Cache(Generic[K, V]):
    def get(self, key: K) -> V | None: ...

def first(items: list[T]) -> T | None: ...
```

### After (PEP 695)

```python
class Cache[K, V: Comparable]:
    def get(self, key: K) -> V | None: ...

def first[T](items: list[T]) -> T | None: ...

# Type aliases use the `type` statement
type Vector[T] = list[T]
type Matrix[T] = list[Vector[T]]
type JSONValue = str | int | float | bool | None | list["JSONValue"] | dict[str, "JSONValue"]
```

### Key differences

- Type parameters are scoped to the class or function — no module-level `TypeVar` pollution.
- Bounds use `: Bound` syntax (e.g., `T: Comparable`).
- Constraints use `T: (int, str)` for "must be one of these types."
- `type` statement creates lazy type aliases that support forward references without strings.

## PEP 696: TypeVar Defaults (Python 3.13+)

Type parameters can have defaults, reducing boilerplate for generic classes where one parameter is usually the same type.

```python
class Response[T = dict[str, Any]]:
    """HTTP response. Defaults to JSON dict if not specified."""
    def __init__(self, data: T, status: int = 200) -> None:
        self.data = data
        self.status = status

# Usage
r1: Response = Response({"key": "value"})       # T defaults to dict[str, Any]
r2: Response[list[str]] = Response(["a", "b"])  # T explicitly list[str]
```

### When to use defaults

- Generic containers where 80%+ of callsites use the same type.
- Builder patterns where intermediate types resolve to a final type.
- Not for cases where the default hides an important type decision.

## PEP 742: TypeIs (Python 3.14)

`TypeIs` is a stricter replacement for `TypeGuard` that narrows both branches of a conditional.

```python
from typing import TypeIs

def is_string_list(val: list[str | int]) -> TypeIs[list[str]]:
    return all(isinstance(x, str) for x in val)

def process(items: list[str | int]) -> None:
    if is_string_list(items):
        # items is list[str] here
        print(items[0].upper())
    else:
        # items is list[str | int] here (TypeGuard would say list[str | int] too,
        # but TypeIs GUARANTEES the negative branch excludes list[str])
        pass
```

### TypeIs vs TypeGuard

| Feature | TypeGuard | TypeIs |
| --- | --- | --- |
| True branch | Narrows to the guard type | Narrows to the guard type |
| False branch | Original type (no narrowing) | Excludes the guard type |
| Requirement | Return True when input matches | Return True if and ONLY if input matches |
| Use when | Narrowing is approximate | Narrowing is exact |

## Union Syntax (PEP 604)

```python
# Old
from typing import Optional, Union
x: Optional[int]          # -> int | None
y: Union[str, int, None]  # -> str | int | None

# New (3.10+)
x: int | None
y: str | int | None
```

Works in `isinstance`: `isinstance(x, str | int)`.

## Built-in Generic Syntax (PEP 585)

Since Python 3.9, built-in collections are directly subscriptable:

```python
# Old                      # New
list[int]                  # list[int] (same — but no import needed)
typing.List[int]           # list[int]
typing.Dict[str, int]      # dict[str, int]
typing.Tuple[int, ...]     # tuple[int, ...]
typing.Set[str]            # set[str]
typing.FrozenSet[str]      # frozenset[str]
typing.Type[MyClass]       # type[MyClass]
```

## Mypy / Pyright Configuration

### mypy (pyproject.toml)

```toml
[tool.mypy]
python_version = "3.13"
strict = true
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
disallow_any_generics = true
```

### pyright (pyproject.toml)

```toml
[tool.pyright]
pythonVersion = "3.13"
typeCheckingMode = "strict"
reportMissingTypeStubs = "warning"
reportUnnecessaryTypeIgnoreComment = "error"
```

### Choosing between mypy and pyright

- **mypy**: Mature, wider plugin ecosystem, stricter on some edge cases.
- **pyright**: Faster, better VSCode integration, handles new PEP syntax sooner.
- Both are valid; pick one and run it in CI. Do not run both on the same codebase — they disagree on edge cases and the resulting `# type: ignore` comments conflict.

## Typing Anti-Patterns

1. **Bare `# type: ignore`** — always include the error code: `# type: ignore[assignment]`.
2. **`Any` in public APIs** — `Any` disables type checking. Use `object` for "any type" and `Any` only for interop with untyped libraries.
3. **`cast()` to bypass checks** — `cast` is a lie to the type checker. Prefer `isinstance` guards or redesign the types.
4. **Overusing `Protocol`** — protocols are for structural typing across package boundaries. Within a single package, concrete types or ABCs are simpler.
5. **`Optional` in 3.10+ code** — use `X | None`. `Optional` is a confusing name because it does not mean "optional parameter."
