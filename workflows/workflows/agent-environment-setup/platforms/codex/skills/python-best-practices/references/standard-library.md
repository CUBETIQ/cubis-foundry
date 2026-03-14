# Python Standard Library First

## Principle

Reach for the standard library before adding a dependency. Third-party packages are justified when the stdlib alternative requires significantly more code, lacks important functionality, or has known deficiencies.

## pathlib over os.path

```python
# AVOID
import os

path = os.path.join("data", "output", "results.json")
if os.path.exists(path):
    with open(path) as f:
        content = f.read()
base = os.path.splitext(os.path.basename(path))[0]

# PREFER
from pathlib import Path

path = Path("data") / "output" / "results.json"
if path.exists():
    content = path.read_text()
base = path.stem
```

### pathlib advantages

- Object-oriented API with `/` operator for path construction.
- `read_text()`, `read_bytes()`, `write_text()`, `write_bytes()` reduce boilerplate.
- `.stem`, `.suffix`, `.parent`, `.name` are properties, not function calls.
- Works cross-platform without `os.sep` concerns.

### When os.path is still needed

- `os.fspath()` for APIs that require string paths (rare in modern code).
- Low-level file descriptor operations (`os.open`, `os.read`).
- `os.scandir()` for performance-critical directory traversal (though `Path.iterdir()` covers most cases).

## tomllib (Python 3.11+)

```python
# AVOID: third-party tomli for reading TOML
import tomli  # pip install tomli

# PREFER: stdlib tomllib (read-only, Python 3.11+)
import tomllib

with open("pyproject.toml", "rb") as f:
    config = tomllib.load(f)

# For writing TOML, you still need tomli-w or tomlkit
import tomli_w
with open("output.toml", "wb") as f:
    tomli_w.dump(config, f)
```

### Note on tomllib

- Read-only by design. The stdlib provides parsing but not serialization.
- Use `tomli-w` for writing. The `tomlkit` library preserves formatting and comments.
- If supporting Python 3.10, use `tomli` as a fallback:

```python
try:
    import tomllib
except ModuleNotFoundError:
    import tomli as tomllib
```

## importlib.resources over pkg_resources

```python
# AVOID: pkg_resources (slow, deprecated)
import pkg_resources
data = pkg_resources.resource_string("my_package", "data/config.json")
path = pkg_resources.resource_filename("my_package", "data/config.json")

# PREFER: importlib.resources (Python 3.9+, improved 3.12+)
from importlib.resources import files

# Read a file from package data
config_text = files("my_package").joinpath("data/config.json").read_text()

# Get a traversable path (may be in a zip)
with files("my_package").joinpath("data/config.json").open() as f:
    config = json.load(f)

# For files that need a real filesystem path (e.g., native libraries)
from importlib.resources import as_file

with as_file(files("my_package").joinpath("data/model.bin")) as path:
    load_model(path)  # path is a real Path on disk
```

## dataclasses over hand-rolled __init__

```python
# AVOID
class Point:
    def __init__(self, x: float, y: float) -> None:
        self.x = x
        self.y = y

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Point):
            return NotImplemented
        return self.x == other.x and self.y == other.y

    def __repr__(self) -> str:
        return f"Point(x={self.x}, y={self.y})"

# PREFER
from dataclasses import dataclass

@dataclass(frozen=True, slots=True)
class Point:
    x: float
    y: float
```

### dataclass options

| Option | Effect | Use when |
| --- | --- | --- |
| `frozen=True` | Makes instances immutable | Value objects, dict keys, set members |
| `slots=True` | Uses `__slots__` for memory efficiency | High-volume instances (3.10+) |
| `kw_only=True` | All fields are keyword-only | Preventing positional argument mistakes (3.10+) |
| `order=True` | Generates comparison operators | Sortable records |

### When to use Pydantic instead

- Validating external input (API requests, file parsing, environment variables).
- Complex validation rules (email format, value ranges, cross-field validation).
- JSON serialization with camelCase conversion or field aliases.
- Do NOT use Pydantic for internal data transfer — dataclasses have zero overhead.

## argparse for CLI

```python
# Simple CLI — argparse is sufficient
import argparse

def main() -> None:
    parser = argparse.ArgumentParser(description="Process data files")
    parser.add_argument("input", type=Path, help="Input file path")
    parser.add_argument("-o", "--output", type=Path, default=Path("output.json"))
    parser.add_argument("-v", "--verbose", action="store_true")
    parser.add_argument("--format", choices=["json", "csv"], default="json")
    args = parser.parse_args()

    process(args.input, args.output, args.verbose, args.format)
```

### When to use click/typer instead

- CLI with subcommands (e.g., `git commit`, `docker compose up`).
- Interactive prompts or progress bars.
- Complex argument types with custom validation.
- Automatic help text generation from type hints (typer).

## functools and itertools

### functools essentials

```python
from functools import cache, lru_cache, partial, reduce

# Unbounded memoization (Python 3.9+)
@cache
def fibonacci(n: int) -> int:
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# Bounded cache
@lru_cache(maxsize=256)
def expensive_lookup(key: str) -> Result:
    return db.query(key)

# Partial application
from operator import mul
double = partial(mul, 2)
```

### itertools essentials

```python
from itertools import chain, islice, batched, groupby

# Flatten nested iterables
flat = list(chain.from_iterable(nested_lists))

# Batch processing (Python 3.12+)
for batch in batched(large_list, 100):
    process_batch(batch)

# Lazy slicing
first_ten = list(islice(infinite_generator(), 10))
```

## contextlib for Context Managers

```python
from contextlib import contextmanager, asynccontextmanager, suppress

# Simple context manager without a class
@contextmanager
def timer(label: str):
    start = time.monotonic()
    yield
    elapsed = time.monotonic() - start
    logger.info(f"{label}: {elapsed:.3f}s")

# Suppress specific exceptions
with suppress(FileNotFoundError):
    Path("optional.json").unlink()

# Stack multiple context managers
from contextlib import ExitStack

with ExitStack() as stack:
    files = [stack.enter_context(open(f)) for f in file_paths]
    process_all(files)
```

## When Third-Party Is Justified

| Need | Stdlib | Third-party | Use third-party when |
| --- | --- | --- | --- |
| HTTP client | `urllib.request` | `httpx` | You need async, HTTP/2, or connection pooling |
| JSON schema | `json` | `pydantic`, `msgspec` | You need validation, not just parsing |
| Logging | `logging` | `structlog` | You need structured key-value JSON logs |
| CLI | `argparse` | `click`, `typer` | You need subcommands or interactive prompts |
| Date/time | `datetime` | `pendulum`, `arrow` | You need timezone-aware arithmetic (but try `zoneinfo` first) |
| Testing | `unittest` | `pytest` | Always — pytest is strictly better |
