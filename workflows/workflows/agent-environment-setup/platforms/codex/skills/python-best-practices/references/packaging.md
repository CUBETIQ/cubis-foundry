# Python Packaging with pyproject.toml

## pyproject.toml as the Single Source of Truth

All new Python projects must use `pyproject.toml` (PEP 621) as the only metadata file. Do not create `setup.py`, `setup.cfg`, or `MANIFEST.in` for new projects.

## Full pyproject.toml Template

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "my-package"
version = "1.0.0"
description = "What this package does"
readme = "README.md"
license = "MIT"
requires-python = ">=3.12"
authors = [
    { name = "Your Name", email = "you@example.com" },
]
classifiers = [
    "Development Status :: 5 - Production/Stable",
    "Programming Language :: Python :: 3.12",
    "Programming Language :: Python :: 3.13",
    "Typing :: Typed",
]
dependencies = [
    "httpx>=0.27",
    "pydantic>=2.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-asyncio>=0.23",
    "pytest-cov>=5.0",
    "mypy>=1.11",
    "ruff>=0.6",
]
docs = [
    "mkdocs-material>=9.5",
]

[project.scripts]
my-cli = "my_package.cli:main"

[project.urls]
Homepage = "https://github.com/org/my-package"
Documentation = "https://my-package.readthedocs.io"
Repository = "https://github.com/org/my-package"

# --- Tool configuration ---

[tool.ruff]
target-version = "py312"
line-length = 100

[tool.ruff.lint]
select = ["E", "W", "F", "I", "N", "UP", "ANN", "B", "A", "C4", "SIM", "TCH"]
ignore = ["ANN101"]  # self annotation

[tool.ruff.lint.isort]
known-first-party = ["my_package"]

[tool.mypy]
python_version = "3.13"
strict = true
warn_return_any = true
disallow_untyped_defs = true

[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
addopts = "-ra --strict-markers"

[tool.coverage.run]
source = ["src/my_package"]
branch = true

[tool.coverage.report]
fail_under = 85
show_missing = true
```

## Build Backends

### Choosing a Backend

| Backend | Best for | Key feature |
| --- | --- | --- |
| `hatchling` | General purpose, monorepos | Plugins, version from VCS |
| `setuptools>=69` | Legacy migration, C extensions | Broadest ecosystem support |
| `flit-core` | Pure Python, minimal config | Simplest possible setup |
| `maturin` | Rust extensions (PyO3) | Builds Rust + Python |
| `pdm-backend` | PDM users | PEP 582 local packages |

### Version from VCS (hatchling)

```toml
[build-system]
requires = ["hatchling", "hatch-vcs"]
build-backend = "hatchling.build"

[tool.hatch.version]
source = "vcs"

[tool.hatch.build.hooks.vcs]
version-file = "src/my_package/_version.py"
```

## Source Layout

```
my-package/
  pyproject.toml
  src/
    my_package/
      __init__.py
      py.typed        # PEP 561 marker for type stubs
      cli.py
      core.py
  tests/
    conftest.py
    test_core.py
```

### Why `src/` layout

- Prevents accidentally importing the source tree instead of the installed package during tests.
- Matches how the package looks when installed.
- Required by some build backends by default (hatchling).

## Dependency Management

### Lock Files

```bash
# uv (fastest)
uv lock                    # Creates uv.lock from pyproject.toml
uv sync                    # Installs from uv.lock
uv pip compile pyproject.toml -o requirements.lock  # pip-compatible lock

# pip-compile (pip-tools)
pip-compile pyproject.toml -o requirements.lock
pip-sync requirements.lock

# pdm
pdm lock
pdm install
```

### Constraint Philosophy

- `pyproject.toml` declares loose constraints: `httpx>=0.27` (minimum version).
- Lock files pin exact versions: `httpx==0.27.2` (reproducible installs).
- Libraries keep constraints loose; applications pin everything.

## py.typed and Type Stubs

For packages that export type information:

```
src/my_package/
  __init__.py
  py.typed          # Empty file — marks package as typed (PEP 561)
  core.py           # Inline type annotations
```

If you cannot annotate a third-party package, create stub files:

```
stubs/
  third_party_lib/
    __init__.pyi    # Type stub for third_party_lib
```

And add to mypy configuration:

```toml
[tool.mypy]
mypy_path = "stubs"
```

## Publishing

```bash
# Build
python -m build

# Check
twine check dist/*

# Upload to PyPI
twine upload dist/*

# Or use trusted publishing (GitHub Actions)
# https://docs.pypi.org/trusted-publishers/
```

### Trusted Publishing (Recommended)

```yaml
# .github/workflows/publish.yml
jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      id-token: write  # Required for trusted publishing
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.13"
      - run: python -m build
      - uses: pypa/gh-action-pypi-publish@release/v1
```

No API tokens needed — PyPI verifies the GitHub Actions identity directly.

## Common Mistakes

1. **Mixing setup.py and pyproject.toml** — choose one. If migrating, move everything to pyproject.toml.
2. **Pinning in library dependencies** — use `>=` not `==`. Let the application's lock file handle exact pins.
3. **Missing `py.typed`** — without this marker file, mypy and pyright ignore your inline annotations for downstream consumers.
4. **`requirements.txt` as the source of truth** — it should be generated from pyproject.toml, not maintained by hand.
5. **Not specifying `requires-python`** — without it, pip will install your package on incompatible Python versions.
