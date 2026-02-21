````markdown
---
inclusion: manual
name: "cli-developer"
displayName: "CLI Developer"
description: "Build intuitive, cross-platform CLI tools with argument parsing, interactive prompts, progress indicators, and shell completions across Node.js, Python, and Go"
keywords:
  [
    "cli",
    "command-line",
    "terminal",
    "argument parsing",
    "shell completion",
    "interactive prompt",
    "progress bar",
    "commander",
    "click",
    "typer",
    "cobra",
  ]
---

# CLI Developer

## Overview

Senior CLI developer expertise for building fast, intuitive command-line tools across Node.js, Python, and Go ecosystems. Focus on <50ms startup time, comprehensive shell completions, and delightful developer UX.

## When to Use

- Building CLI tools and terminal applications
- Implementing argument parsing and subcommands
- Creating interactive prompts and forms
- Adding progress bars and spinners
- Implementing shell completions (bash, zsh, fish)
- Optimizing CLI performance and startup time
- Designing command hierarchies and flag conventions

## Core Workflow

1. Analyze UX — identify user workflows, command hierarchy, common tasks
2. Design commands — plan subcommands, flags, arguments, configuration
3. Implement — build with appropriate CLI framework for the language
4. Polish — add completions, help text, error messages, progress indicators
5. Test — cross-platform testing, performance benchmarks

## Quick Reference

### Framework Selection

| Language | Recommended   | Alternative     |
| -------- | ------------- | --------------- |
| Node.js  | Commander.js  | Yargs, oclif    |
| Python   | Typer         | Click, argparse |
| Go       | Cobra + Viper | urfave/cli      |

### Command Structure

```
mycli                           # Root command
├── init [options]              # Simple command
├── config
│   ├── get <key>              # Nested subcommand
│   ├── set <key> <value>
│   └── list
├── deploy [environment]        # Command with args
│   ├── --dry-run              # Flag
│   ├── --force
│   └── --config <file>        # Option with value
└── plugins
    ├── install <name>
    ├── list
    └── remove <name>
```

### Exit Codes

| Code | Meaning           |
| ---- | ----------------- |
| 0    | Success           |
| 1    | General error     |
| 2    | Invalid arguments |
| 77   | Permission denied |
| 127  | Not found         |
| 130  | Ctrl+C (SIGINT)   |

## Constraints

### MUST DO

- Keep startup time under 50ms
- Provide clear, actionable error messages
- Support `--help` and `--version` flags
- Use consistent flag naming conventions
- Handle SIGINT (Ctrl+C) gracefully
- Validate user input early
- Support both interactive and non-interactive modes
- Test on Windows, macOS, and Linux

### MUST NOT DO

- Block on synchronous I/O unnecessarily
- Print to stdout if output will be piped
- Use colors when output is not a TTY
- Break existing command signatures (breaking changes)
- Require interactive input in CI/CD environments
- Hardcode paths or platform-specific logic
- Ship without shell completions

## Steering Files

| File                 | Load When                                                    |
| -------------------- | ------------------------------------------------------------ |
| `design-patterns.md` | Command hierarchy, flags, config layers, plugin architecture |
| `node-cli.md`        | Commander, Yargs, Inquirer, Chalk, Ora                       |
| `python-cli.md`      | Typer, Click, argparse, Rich, questionary                    |
| `go-cli.md`          | Cobra, Viper, Bubble Tea, progress bars                      |
| `ux-patterns.md`     | Progress indicators, colors, help text, error messages       |
````
