---
name: "ruby-pro"
description: "Use for modern Ruby 3.4-era backend, scripting, and application engineering with clear object boundaries, concurrency awareness, and test discipline."
metadata:
  category: "languages"
  layer: "languages"
  canonical: true
  maturity: "stable"
  tags: ["ruby", "language", "backend", "scripting", "bundler"]
---
# Ruby Pro

## When to Use

- Building or refactoring Ruby services, scripts, or app-layer code.
- Clarifying object boundaries, service layers, and package structure.
- Improving background jobs, test coverage, and runtime safety.

## When Not to Use

- Rails-only policy questions that need a framework specialist.
- Pure infrastructure or database operations.
- One-off shell work with no Ruby code involved.

## Core workflow

1. Confirm runtime and app structure before editing.
2. Keep object responsibilities small and explicit.
3. Prefer clear data flow over callback-heavy indirection.
4. Make concurrency, I/O, and retries explicit when present.
5. Validate with focused tests and dependency-aware Bundler hygiene.
