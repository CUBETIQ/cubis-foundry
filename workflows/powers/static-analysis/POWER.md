````markdown
---
inclusion: manual
name: static-analysis
description: Configure and use static analysis tools including linters, formatters, type checkers, and custom rules to enforce code quality and consistency.
license: Apache-2.0
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot, Gemini CLI
---

# Static Analysis

## Purpose

Guide the setup and use of static analysis tools — linters, formatters, type checkers, and custom rules — to catch bugs early, enforce conventions, and maintain code quality automatically.

## When to Use

- Setting up linting and formatting for a new project
- Configuring ESLint, Prettier, Biome, or equivalent tools
- Writing custom lint rules for team conventions
- Fixing lint errors or understanding why a rule exists
- Integrating static analysis into CI/CD
- Choosing between competing tools

## Instructions

### Step 1 — Choose the Right Tools

| Language      | Linter        | Formatter       | Type Checker       |
| ------------- | ------------- | --------------- | ------------------ |
| TypeScript/JS | ESLint, Biome | Prettier, Biome | TypeScript (`tsc`) |
| Python        | Ruff, Flake8  | Black, Ruff     | mypy, pyright      |
| Go            | golangci-lint | gofmt           | Go compiler        |
| Rust          | Clippy        | rustfmt         | Rust compiler      |

**Recommended approach**:

- Biome for TypeScript/JS projects (replaces ESLint + Prettier, faster)
- Ruff for Python (replaces Flake8 + Black + isort, faster)
- Use the language's official formatter when available

### Step 2 — Configure Incrementally

**Start strict, relax as needed**:

1. Start with recommended preset (`"extends": ["recommended"]`)
2. Enable formatting rules (consistent style, no debates)
3. Enable correctness rules (actual bugs: unused vars, unreachable code)
4. Enable performance rules (avoidable perf issues)
5. Add custom rules specific to your team after the baseline is stable

**Don't**:

- Enable everything at once on an existing codebase
- Disable rules because they're "annoying" without understanding them
- Use `// eslint-disable` without a comment explaining why

### Step 3 — Key Rules by Category

**Correctness** (catch bugs):

- No unused variables/imports
- No unreachable code
- No implicit type coercion in comparisons
- No floating promises (unhandled async)
- No shadowed variables in nested scopes

**Consistency** (enforce style):

- Consistent naming conventions (camelCase, PascalCase, SCREAMING_SNAKE)
- Consistent import ordering
- Consistent quote style and semicolons
- Consistent use of `const` vs `let`

**Security** (prevent vulnerabilities):

- No `eval()` or `Function()` constructor
- No `innerHTML` assignments (XSS risk)
- No hardcoded secrets or credentials
- No `any` type in TypeScript (use `unknown` for unknown types)

**Performance** (avoid waste):

- No unnecessary re-renders (React-specific)
- No synchronous file operations in async contexts
- No `console.log` in production code

### Step 4 — Integrate into Workflow

**Local development**:

- Editor integration (real-time feedback as you type)
- Format on save
- Pre-commit hook (lint-staged + husky or lefthook)

**CI/CD**:

- Run lint check on every PR
- Fail the build on lint errors (not warnings — fix or disable)
- Cache lint results between runs

**Migration strategy** (existing codebase):

- Fix auto-fixable issues in one PR (formatting, import order)
- Enable new rules as warnings first, then promote to errors
- Fix rules incrementally by directory, not all at once

### Step 5 — Write Custom Rules

When team conventions aren't covered by existing rules:

**ESLint custom rule example** (no importing from internal paths):

```javascript
module.exports = {
  meta: {
    type: "problem",
    messages: { noInternal: "Do not import from internal modules" },
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        if (node.source.value.includes("/internal/")) {
          context.report({ node, messageId: "noInternal" });
        }
      },
    };
  },
};
```

## Output Format

```
## Tool Configuration
[config files and settings]

## Rules Enabled
[categorized list of rules with rationale]

## CI Integration
[pipeline step definition]

## Migration Plan
[how to adopt incrementally on existing code]
```

## Examples

**User**: "Set up ESLint and Prettier for our TypeScript React project"

**Response approach**: Recommend Biome as modern alternative. If staying with ESLint: configure with typescript-eslint, eslint-plugin-react, prettier integration. Show config file, ignore patterns, and pre-commit hook setup.

**User**: "We have 5000 lint errors — how do we fix this?"

**Response approach**: Auto-fix formatting issues first (one big PR). Establish baseline with current errors suppressed. Enable rules as warnings. Fix incrementally by directory. Add CI check that blocks new violations.
````
