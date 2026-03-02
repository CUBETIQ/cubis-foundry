# Python CLI Development

## Typer (Recommended Modern)

Typer builds on Click with type hints and auto-completion. It's the recommended choice for new Python CLIs.

```bash
pip install typer[all] rich questionary
```

### Full Example

```python
#!/usr/bin/env python3
"""mycli - A project scaffolding and deployment tool."""

import typer
from enum import Enum
from pathlib import Path
from typing import Optional, List
from typing_extensions import Annotated

app = typer.Typer(
    name="mycli",
    help="A project scaffolding and deployment tool.",
    add_completion=True,
    no_args_is_help=True,
)


class Template(str, Enum):
    default = "default"
    fastapi = "fastapi"
    flask = "flask"
    django = "django"


class Environment(str, Enum):
    staging = "staging"
    production = "production"


@app.command()
def init(
    name: Annotated[str, typer.Argument(help="Project name")],
    template: Annotated[Template, typer.Option("--template", "-t", help="Project template")] = Template.default,
    force: Annotated[bool, typer.Option("--force", "-f", help="Overwrite existing directory")] = False,
    no_git: Annotated[bool, typer.Option("--no-git", help="Skip git initialization")] = False,
):
    """Create a new project from a template."""
    from rich.console import Console
    console = Console()

    project_path = Path.cwd() / name
    if project_path.exists() and not force:
        console.print(f"[red]✗ Directory '{name}' already exists. Use --force to overwrite.[/red]")
        raise typer.Exit(code=1)

    console.print(f"[blue]ℹ[/blue] Creating project [bold]{name}[/bold] with template [bold]{template.value}[/bold]...")
    # ... scaffolding logic ...
    console.print(f"[green]✓[/green] Project [bold]{name}[/bold] created successfully!")
    console.print(f"\n  [dim]$[/dim] cd {name}")
    console.print(f"  [dim]$[/dim] python -m venv .venv && source .venv/bin/activate")
    console.print(f"  [dim]$[/dim] pip install -e .[dev]\n")


@app.command()
def deploy(
    env: Annotated[Environment, typer.Option("--env", "-e", help="Target environment")],
    dry_run: Annotated[bool, typer.Option("--dry-run", help="Preview without deploying")] = False,
    tag: Annotated[Optional[str], typer.Option("--tag", help="Deploy specific version tag")] = None,
    timeout: Annotated[int, typer.Option("--timeout", help="Deployment timeout in seconds")] = 300,
):
    """Deploy to target environment."""
    from rich.console import Console
    console = Console()

    if dry_run:
        console.print(f"[yellow]⚠[/yellow] Dry run mode — no changes will be made")

    console.print(f"[blue]ℹ[/blue] Deploying to [bold]{env.value}[/bold]...")
    # ... deployment logic ...
    console.print(f"[green]✓[/green] Deployed to {env.value}")


# --- Nested command group ---
config_app = typer.Typer(help="Manage configuration.")
app.add_typer(config_app, name="config")


@config_app.command("get")
def config_get(
    key: Annotated[str, typer.Argument(help="Configuration key")],
):
    """Get a configuration value."""
    from rich.console import Console
    console = Console()
    # ... load config ...
    console.print(f"  {key} = [bold]value[/bold]")


@config_app.command("set")
def config_set(
    key: Annotated[str, typer.Argument(help="Configuration key")],
    value: Annotated[str, typer.Argument(help="Configuration value")],
):
    """Set a configuration value."""
    from rich.console import Console
    console = Console()
    # ... save config ...
    console.print(f"[green]✓[/green] Set {key} = {value}")


@config_app.command("list")
def config_list(
    json_output: Annotated[bool, typer.Option("--json", help="Output as JSON")] = False,
):
    """List all configuration values."""
    # ... list config ...
    pass


def version_callback(value: bool):
    if value:
        from importlib.metadata import version
        typer.echo(f"mycli {version('mycli')}")
        raise typer.Exit()


@app.callback()
def main(
    version: Annotated[
        Optional[bool],
        typer.Option("--version", "-V", callback=version_callback, is_eager=True, help="Show version"),
    ] = None,
):
    """mycli - A project scaffolding and deployment tool."""
    pass


if __name__ == "__main__":
    app()
```

---

## Click (Widely Used)

Click is the foundation Typer builds on. Use it when you need maximum control.

```bash
pip install click
```

```python
import click


@click.group()
@click.version_option()
@click.option("--verbose", "-v", is_flag=True, help="Enable verbose output")
@click.pass_context
def cli(ctx, verbose):
    """mycli - A project scaffolding and deployment tool."""
    ctx.ensure_object(dict)
    ctx.obj["verbose"] = verbose


@cli.command()
@click.argument("name")
@click.option("--template", "-t", type=click.Choice(["default", "fastapi", "flask"]), default="default")
@click.option("--force", "-f", is_flag=True, help="Overwrite existing directory")
def init(name, template, force):
    """Create a new project from a template."""
    click.echo(f"Creating project {name} with template {template}...")


@cli.command()
@click.option("--env", "-e", type=click.Choice(["staging", "production"]), required=True)
@click.option("--dry-run", is_flag=True, help="Preview without deploying")
def deploy(env, dry_run):
    """Deploy to target environment."""
    if dry_run:
        click.secho("Dry run mode", fg="yellow")
    click.echo(f"Deploying to {env}...")


# Nested group
@cli.group()
def config():
    """Manage configuration."""
    pass


@config.command("get")
@click.argument("key")
def config_get(key):
    """Get a configuration value."""
    click.echo(f"{key} = value")


@config.command("set")
@click.argument("key")
@click.argument("value")
def config_set(key, value):
    """Set a configuration value."""
    click.secho(f"✓ Set {key} = {value}", fg="green")


if __name__ == "__main__":
    cli()
```

---

## Rich Terminal Output

```bash
pip install rich
```

```python
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.syntax import Syntax
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich import print as rprint

console = Console()

# --- Tables ---
table = Table(title="Deployments")
table.add_column("Environment", style="cyan")
table.add_column("Status", style="green")
table.add_column("Version", style="magenta")
table.add_column("Last Deploy", style="dim")

table.add_row("production", "✓ healthy", "v2.1.0", "2024-01-15 14:30")
table.add_row("staging", "✓ healthy", "v2.2.0-rc1", "2024-01-16 09:15")
table.add_row("development", "⚠ degraded", "v2.2.0-dev", "2024-01-16 11:00")

console.print(table)

# --- Panels ---
console.print(Panel(
    "[green]✓ Project created successfully![/green]\n\n"
    "  [dim]$[/dim] cd my-project\n"
    "  [dim]$[/dim] python -m venv .venv\n"
    "  [dim]$[/dim] pip install -e .[dev]",
    title="Next Steps",
    border_style="green",
))

# --- Syntax highlighting ---
code = '''
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello World"}
'''
syntax = Syntax(code, "python", theme="monokai", line_numbers=True)
console.print(Panel(syntax, title="Generated Code"))

# --- Progress bars ---
with Progress(
    SpinnerColumn(),
    TextColumn("[progress.description]{task.description}"),
    transient=True,
) as progress:
    task = progress.add_task("Installing dependencies...", total=None)
    # ... do work ...
    progress.update(task, description="Building project...")
    # ... do work ...
    progress.update(task, description="Running tests...")
    # ... do work ...

console.print("[green]✓[/green] All tasks complete!")

# --- Spinners (simple) ---
with console.status("[bold blue]Deploying to production...") as status:
    # ... step 1 ...
    status.update("[bold blue]Running health checks...")
    # ... step 2 ...
    status.update("[bold blue]Updating DNS records...")
    # ... step 3 ...

console.print("[green]✓[/green] Deployment complete!")
```

---

## Interactive Prompts with Questionary

```bash
pip install questionary
```

```python
import questionary
from questionary import Style

# Custom style
custom_style = Style([
    ("qmark", "fg:cyan bold"),
    ("question", "bold"),
    ("answer", "fg:green bold"),
    ("pointer", "fg:cyan bold"),
    ("highlighted", "fg:cyan bold"),
    ("selected", "fg:green"),
])

# Text input
name = questionary.text(
    "Project name:",
    default="my-project",
    validate=lambda val: True if val.replace("-", "").isalnum() else "Use only alphanumeric characters and hyphens",
    style=custom_style,
).ask()

# Select (single choice)
template = questionary.select(
    "Select a template:",
    choices=[
        questionary.Choice("Default (minimal)", value="default"),
        questionary.Choice("FastAPI", value="fastapi"),
        questionary.Choice("Flask", value="flask"),
        questionary.Choice("Django", value="django"),
    ],
    style=custom_style,
).ask()

# Checkbox (multiple choices)
features = questionary.checkbox(
    "Select features:",
    choices=[
        questionary.Choice("Type checking (mypy)", checked=True),
        questionary.Choice("Linting (ruff)", checked=True),
        questionary.Choice("Testing (pytest)"),
        questionary.Choice("Docker"),
        questionary.Choice("CI/CD (GitHub Actions)"),
        questionary.Choice("Pre-commit hooks"),
    ],
    style=custom_style,
).ask()

# Confirm
init_git = questionary.confirm(
    "Initialize git repository?",
    default=True,
    style=custom_style,
).ask()

# Password
api_key = questionary.password(
    "Enter your API key:",
    style=custom_style,
).ask()

# Handle Ctrl+C (returns None)
if name is None:
    print("\nOperation cancelled.")
    raise SystemExit(130)
```

---

## Argparse (Standard Library)

Use argparse when you want zero dependencies.

```python
import argparse
import sys


def build_parser():
    parser = argparse.ArgumentParser(
        prog="mycli",
        description="A project scaffolding and deployment tool.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
examples:
  %(prog)s init my-project --template fastapi
  %(prog)s deploy --env production --dry-run
  %(prog)s config set api_key sk-1234
        """,
    )
    parser.add_argument("-V", "--version", action="version", version="%(prog)s 1.0.0")
    parser.add_argument("-v", "--verbose", action="store_true", help="Enable verbose output")

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # init
    init_parser = subparsers.add_parser("init", help="Create a new project")
    init_parser.add_argument("name", help="Project name")
    init_parser.add_argument("-t", "--template", choices=["default", "fastapi", "flask"], default="default")
    init_parser.add_argument("-f", "--force", action="store_true", help="Overwrite existing directory")

    # deploy
    deploy_parser = subparsers.add_parser("deploy", help="Deploy to target environment")
    deploy_parser.add_argument("-e", "--env", required=True, choices=["staging", "production"])
    deploy_parser.add_argument("--dry-run", action="store_true")
    deploy_parser.add_argument("--timeout", type=int, default=300, help="Timeout in seconds")

    # config
    config_parser = subparsers.add_parser("config", help="Manage configuration")
    config_sub = config_parser.add_subparsers(dest="config_command")

    get_parser = config_sub.add_parser("get", help="Get a config value")
    get_parser.add_argument("key", help="Configuration key")

    set_parser = config_sub.add_parser("set", help="Set a config value")
    set_parser.add_argument("key", help="Configuration key")
    set_parser.add_argument("value", help="Configuration value")

    # File input example
    import_parser = subparsers.add_parser("import", help="Import configuration")
    import_parser.add_argument("file", type=argparse.FileType("r"), help="Config file to import")

    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()

    if args.command is None:
        parser.print_help()
        sys.exit(2)

    if args.command == "init":
        print(f"Creating {args.name} with template {args.template}")
    elif args.command == "deploy":
        print(f"Deploying to {args.env}")
    elif args.command == "config":
        if args.config_command == "get":
            print(f"{args.key} = value")
        elif args.config_command == "set":
            print(f"Set {args.key} = {args.value}")


if __name__ == "__main__":
    main()
```

---

## Error Handling

```python
import sys
import os
from pathlib import Path
from rich.console import Console

console = Console(stderr=True)


def handle_error(func):
    """Decorator for CLI command error handling."""
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except PermissionError as e:
            console.print(f"\n  [red]✗ Permission denied:[/red] {e.filename}")
            console.print(f"  [dim]Try running with sudo or check file permissions.[/dim]\n")
            raise SystemExit(77)
        except FileNotFoundError as e:
            console.print(f"\n  [red]✗ File not found:[/red] {e.filename}")
            console.print(f"  [dim]Make sure the path exists and is spelled correctly.[/dim]\n")
            raise SystemExit(1)
        except KeyboardInterrupt:
            console.print(f"\n\n  [yellow]Operation cancelled.[/yellow]\n")
            raise SystemExit(130)
        except Exception as e:
            console.print(f"\n  [red]✗ Error:[/red] {e}")
            if os.environ.get("MYCLI_DEBUG"):
                console.print_exception()
            raise SystemExit(1)
    return wrapper


@handle_error
def deploy(env: str, dry_run: bool = False):
    """Deploy with proper error handling."""
    config_path = Path.home() / ".mycli" / "config.json"
    if not config_path.exists():
        raise FileNotFoundError(config_path)

    # ... deployment logic ...
```

---

## Configuration Management

```python
import json
import os
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Config:
    env: str = "development"
    port: int = 3000
    verbose: bool = False
    log_level: str = "info"
    api_url: str = "https://api.example.com"

    @classmethod
    def load(cls, cli_overrides: Optional[dict] = None) -> "Config":
        config = cls()

        # 1. System config
        config._merge_file(Path("/etc/mycli/config.json"))

        # 2. User config
        config._merge_file(Path.home() / ".mycli" / "config.json")

        # 3. Project config
        config._merge_file(Path.cwd() / "mycli.config.json")

        # 4. Environment variables
        env_map = {
            "MYCLI_ENV": "env",
            "MYCLI_PORT": "port",
            "MYCLI_LOG_LEVEL": "log_level",
            "MYCLI_API_URL": "api_url",
        }
        for env_var, attr in env_map.items():
            value = os.environ.get(env_var)
            if value is not None:
                expected_type = type(getattr(config, attr))
                if expected_type == int:
                    value = int(value)
                elif expected_type == bool:
                    value = value.lower() in ("true", "1", "yes")
                setattr(config, attr, value)

        # 5. CLI flags (highest priority)
        if cli_overrides:
            for key, value in cli_overrides.items():
                if value is not None and hasattr(config, key):
                    setattr(config, key, value)

        return config

    def _merge_file(self, path: Path):
        if path.exists():
            try:
                data = json.loads(path.read_text())
                for key, value in data.items():
                    if hasattr(self, key):
                        setattr(self, key, value)
            except (json.JSONDecodeError, OSError):
                pass  # Skip invalid config files silently
```

---

## pyproject.toml Setup

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "mycli"
version = "1.0.0"
description = "A project scaffolding and deployment tool"
readme = "README.md"
requires-python = ">=3.10"
license = "MIT"
authors = [
    { name = "Your Name", email = "you@example.com" },
]
keywords = ["cli", "scaffold", "deploy"]
classifiers = [
    "Development Status :: 4 - Beta",
    "Environment :: Console",
    "Intended Audience :: Developers",
    "Programming Language :: Python :: 3",
]
dependencies = [
    "typer[all]>=0.12.0",
    "rich>=13.0.0",
    "questionary>=2.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-cov>=5.0.0",
    "ruff>=0.4.0",
    "mypy>=1.10.0",
]

[project.scripts]
mycli = "mycli.cli:app"

[tool.ruff]
target-version = "py310"
line-length = 120

[tool.ruff.lint]
select = ["E", "F", "I", "N", "W", "UP"]

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-v --tb=short"

[tool.mypy]
python_version = "3.10"
strict = true
```

---

## Testing CLIs

```python
# tests/test_cli.py
import pytest
from typer.testing import CliRunner
from mycli.cli import app

runner = CliRunner()


def test_version():
    result = runner.invoke(app, ["--version"])
    assert result.exit_code == 0
    assert "1.0.0" in result.output


def test_help():
    result = runner.invoke(app, ["--help"])
    assert result.exit_code == 0
    assert "init" in result.output
    assert "deploy" in result.output
    assert "config" in result.output


def test_init_creates_project(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    result = runner.invoke(app, ["init", "my-project", "--template", "default"])
    assert result.exit_code == 0
    assert "my-project" in result.output
    assert (tmp_path / "my-project").exists()


def test_init_with_template(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    result = runner.invoke(app, ["init", "api-project", "--template", "fastapi"])
    assert result.exit_code == 0
    assert (tmp_path / "api-project").exists()


def test_init_fails_on_existing_dir(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    (tmp_path / "existing").mkdir()
    result = runner.invoke(app, ["init", "existing"])
    assert result.exit_code == 1
    assert "already exists" in result.output


def test_init_force_overwrites(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    (tmp_path / "existing").mkdir()
    result = runner.invoke(app, ["init", "existing", "--force"])
    assert result.exit_code == 0


def test_deploy_requires_env():
    result = runner.invoke(app, ["deploy"])
    assert result.exit_code != 0
    assert "--env" in result.output


def test_invalid_command():
    result = runner.invoke(app, ["nonexistent"])
    assert result.exit_code != 0
```

---

## Progress Bars with tqdm

```bash
pip install tqdm
```

```python
from tqdm import tqdm
import time

# Simple progress bar
for item in tqdm(range(100), desc="Processing"):
    time.sleep(0.02)

# Custom format
for item in tqdm(
    range(100),
    desc="Downloading",
    bar_format="{l_bar}{bar:30}{r_bar}",
    colour="green",
    unit="files",
):
    time.sleep(0.02)

# Multiple bars
from tqdm import tqdm
import concurrent.futures

tasks = {
    "Frontend": 80,
    "Backend": 120,
    "Database": 50,
}

bars = {name: tqdm(total=total, desc=name, position=i) for i, (name, total) in enumerate(tasks.items())}

# Simulate parallel progress
for name, bar in bars.items():
    for _ in range(bar.total):
        time.sleep(0.01)
        bar.update(1)
    bar.close()
```
