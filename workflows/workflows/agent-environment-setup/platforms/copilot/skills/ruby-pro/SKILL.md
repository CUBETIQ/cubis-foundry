---
name: "ruby-pro"
description: "Use for modern Ruby 3.4-era backend, scripting, and application engineering with clear object boundaries, concurrency awareness, and test discipline."
metadata:
  version: "2.0.0"
  domain: "language"
  role: "specialist"
  stack: "ruby"
  category: "languages"
  layer: "languages"
  canonical: true
  maturity: "stable"
  baseline: "Ruby 3.4"
  tags: ["ruby", "language", "backend", "scripting", "bundler"]
---
# Ruby Pro

## When to use

- Building or refactoring Ruby services, scripts, or app-layer code.
- Clarifying object boundaries, service layers, and package structure.
- Improving background jobs, test coverage, and runtime safety.

## When not to use

- Rails-only policy questions that need a framework specialist.
- Pure infrastructure or database operations.
- One-off shell work with no Ruby code involved.

## Core workflow

1. Confirm runtime and app structure before editing.
2. Keep object responsibilities small and explicit.
3. Prefer clear data flow over callback-heavy indirection.
4. Make concurrency, I/O, and retries explicit when present.
5. Validate with focused tests and dependency-aware Bundler hygiene.

## Baseline standards

- Use Ruby 3.4+ features: pattern matching (`in`/`=>` patterns), Data classes, and frozen string literals.
- Add `# frozen_string_literal: true` to every file. Mutable strings must be explicit (`String.new` or `.dup`).
- Run RuboCop in CI with project-specific `.rubocop.yml`. Treat offenses as build failures.
- Use Sorbet or RBS type signatures at module boundaries for large codebases.
- Pin gems to exact versions in `Gemfile.lock`. Run `bundle audit` in CI for vulnerability checks.

## Object design

- Keep classes focused on a single responsibility. Extract service objects, value objects, and query objects.
- Prefer composition over inheritance. Use modules for shared behavior, not deep class hierarchies.
- Use `Data.define` (Ruby 3.2+) for immutable value objects instead of `Struct` or `OpenStruct`.
- Use pattern matching with `case`/`in` for structured data decomposition.
- Make method visibility explicit (`public`, `private`, `protected`). Default to private.

## Concurrency

- Use Ractors for CPU-bound parallelism that needs true thread safety.
- Use Fibers and `Async` gem for I/O-bound concurrency within a single thread.
- Use thread-safe data structures (`Queue`, `Mutex`, `Monitor`) when sharing state across threads.
- Background jobs (Sidekiq, GoodJob) are the preferred pattern for async work in web apps.
- Never share mutable state between Ractors — pass messages or use shareable frozen objects.

## Error handling

- Rescue specific exceptions, not bare `rescue` or `rescue Exception`.
- Use custom exception classes per failure domain. Include context in the error message.
- Prefer returning result objects (Success/Failure) for expected failures over exception-based control flow.
- Always re-raise or log rescued exceptions — never swallow errors silently.

## Testing

- Use RSpec or Minitest. Keep test files mirroring the source structure.
- Use `let`, `subject`, and `context` blocks for readable test organization in RSpec.
- Mock external dependencies (HTTP, databases, file I/O) — test business logic in isolation.
- Use FactoryBot or fixtures for test data. Never depend on production database state.
- Run tests with SimpleCov for coverage reporting. Focus on meaningful coverage over percentage targets.

## Performance

- Profile with `ruby-prof`, `stackprof`, or `memory_profiler` before optimizing.
- Use `Enumerable` methods (`map`, `select`, `reduce`) over manual loops. They express intent clearly.
- Prefer `freeze` on constants and frequently reused strings to reduce object allocations.
- Use connection pooling for database connections. Never create connections per-request.
- Cache expensive computations with `Rails.cache`, `Dalli`, or application-level memoization.

## Bundler hygiene

- Group gems by purpose in `Gemfile`: `:development`, `:test`, `:production`.
- Run `bundle outdated` regularly. Update gems in small batches with test verification.
- Audit gems with `bundle audit` before deploy. Block deploys on critical vulnerabilities.
- Prefer gems with active maintainers and recent releases. Avoid abandoned gems.

## Avoid

- `method_missing` without `respond_to_missing?` — makes debugging impossible.
- `eval` and `instance_eval` with user input — injection risk.
- `OpenStruct` in production code — slow, no type safety, memory-heavy.
- Monkey-patching core classes — use Refinements instead when behavior extension is needed.
- Bare `rescue` without exception class — catches everything including `SystemExit`.
- Deep callback chains (Rails `before_action`, `after_commit`) — make control flow invisible.

## Reference files

| File                                         | Load when                                                                                           |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `references/ruby-concurrency-and-testing.md` | Concurrency patterns (Ractors, Fibers, Async), testing strategy, or gem dependency audit is needed. |
