````markdown
---
inclusion: manual
name: cli-developer
description: Build command-line interfaces with argument parsing, subcommands, interactive prompts, terminal UX, output formatting, and cross-platform compatibility.
license: Apache-2.0
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot, Gemini CLI
---

# CLI Developer

## Purpose

Guide the design and implementation of command-line interfaces. Covers argument parsing, subcommand architecture, interactive prompts, terminal UX patterns, and cross-platform compatibility.

## When to Use

- Building a new CLI tool from scratch
- Adding subcommands or flags to an existing CLI
- Implementing interactive prompts and wizards
- Designing CLI output formats (tables, JSON, progress bars)
- Making CLIs cross-platform (Windows, macOS, Linux)
- Reviewing CLI usability and documentation

## Instructions

### Step 1 — Design the Command Structure

**Naming conventions**:

- Use verb-noun pattern for commands: `create project`, `list users`, `delete cache`
- Short flags for common options: `-v` (verbose), `-q` (quiet), `-f` (force)
- Long flags for clarity: `--output`, `--format`, `--dry-run`
- Positional arguments for required inputs: `mycli deploy <environment>`

**Subcommand architecture**:

```
mycli
├── init              (one-time setup)
├── config
│   ├── get <key>
│   ├── set <key> <value>
│   └── list
├── project
│   ├── create <name>
│   ├── list
│   └── delete <id>
└── deploy <env>      (positional argument)
```

**Rules**:

- Every command has `--help` (automatic with good parsers)
- Support `--version` at the root level
- Common flags go on the root command, specific flags on subcommands
- Use `--dry-run` for destructive operations

### Step 2 — Implement Argument Parsing

**Choose the right parser**:
| Language | Recommended |
|----------|-------------|
| Node.js | Commander, yargs, citty |
| Python | Click, Typer |
| Go | Cobra, urfave/cli |
| Rust | Clap |

**Validation**:

- Validate early, fail with clear error messages
- Show the closest valid option on typos (did-you-mean)
- Report all validation errors at once, not one at a time

### Step 3 — Design Terminal UX

**Output hierarchy**:

1. Primary output goes to stdout (pipeable)
2. Status messages go to stderr (logs, progress)
3. Errors go to stderr with non-zero exit code

**Formatting**:

- Default: human-readable (tables, colors, emoji)
- `--json`: machine-parseable JSON output
- `--quiet`: errors only, minimal output
- Detect TTY: disable colors and interactivity when piped

**Progress feedback**:

- Spinner for short operations (< 10s)
- Progress bar for operations with known total
- Log lines for multi-step operations (✓ Step 1... ✓ Step 2...)

**Colors** (use sparingly):

- Green: success
- Red: error
- Yellow: warning
- Blue/cyan: information
- Dim/gray: secondary information
- Always support `NO_COLOR` environment variable

### Step 4 — Interactive Prompts

**When to prompt**:

- Missing required information not provided as flags
- Confirmation before destructive operations
- Multi-step wizards for complex setup

**Prompt types**:
| Type | When |
|------|------|
| Text input | Free-form strings (names, paths) |
| Password | Secrets (mask input) |
| Select | Single choice from a list |
| Multi-select | Multiple choices from a list |
| Confirm | Yes/no decision |

**Rules**:

- Show defaults in brackets: `Port [3000]:`
- Allow non-interactive mode via flags (CI environments)
- Validate input inline and let the user retry
- Support Ctrl+C graceful cancellation

### Step 5 — Error Handling & Exit Codes

**Exit codes**:
| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Misuse / invalid arguments |
| 126 | Permission denied |
| 127 | Command not found |
| 130 | Terminated by Ctrl+C (SIGINT) |

**Error messages**:

```
Error: Could not connect to database at localhost:5432
  Cause: Connection refused
  Fix: Ensure PostgreSQL is running: `pg_ctl start`
```

Include: what failed, why, and how to fix.

## Output Format

```
## CLI Architecture
[command structure and flag design]

## Implementation
[code with argument parsing and command handlers]

## UX Considerations
[output formatting, interactivity, error handling]
```

## Examples

**User**: "Build a CLI for managing our API deployments"

**Response approach**: Design subcommand structure (deploy, rollback, status, logs). Implement with Commander/Click/Cobra. Add deploy confirmation prompt, progress bar for upload, JSON output for CI. Handle rollback with `--to-version` flag.

**User**: "Our CLI has bad error messages — users don't know what went wrong"

**Response approach**: Audit error handling. Add context to every error (what, why, fix). Implement did-you-mean for typos. Add `--verbose` flag for debug output. Ensure proper exit codes for scripting.
````
