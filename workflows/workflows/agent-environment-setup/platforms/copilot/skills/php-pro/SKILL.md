---
name: "php-pro"
description: "Use for modern PHP 8.4-era backend and application engineering with strict typing, framework-aware architecture, testing, and operational safety."
metadata:
  version: "2.0.0"
  domain: "language"
  role: "specialist"
  stack: "php"
  category: "languages"
  layer: "languages"
  canonical: true
  maturity: "stable"
  baseline: "PHP 8.4"
  tags: ["php", "backend", "language", "strict-types", "composer"]
---
# PHP Pro

## When to use

- Building or refactoring PHP services and applications.
- Tightening typing, dependency boundaries, and package hygiene.
- Improving request handling, background jobs, and test structure.

## When not to use

- Framework-specific work where the framework skill should lead (Laravel, Symfony, etc.).
- Database tuning with no PHP changes.
- Frontend-only or infrastructure-only tasks.

## Core workflow

1. Confirm runtime, framework, and PHP version baseline.
2. Enable strict typing and explicit contracts at module boundaries.
3. Keep service, controller, and persistence responsibilities separate.
4. Prefer deterministic Composer and test workflows.
5. Validate with targeted tests and static analysis where available.

## Baseline standards

- Add `declare(strict_types=1);` to every PHP file. No exceptions.
- Use typed properties, parameter types, and return types on all public methods.
- Run PHPStan or Psalm at level 8+ in CI. Treat analysis failures as build failures.
- Use PHP CS Fixer or PHP_CodeSniffer for consistent formatting.
- Pin Composer dependencies to exact versions in `composer.lock`. Commit the lock file.

## Type system

- Use union types (`string|int`), intersection types (`Countable&Iterator`), and `never` return type where they add clarity.
- Use enums (backed or pure) instead of string/int constants for fixed value sets.
- Use readonly properties and readonly classes for immutable data transfer objects.
- Prefer named arguments for functions with many optional parameters.
- Use `null` as a return type only when null is a meaningful domain value — prefer exceptions or result objects for errors.

## Architecture patterns

- Separate request handling (controllers) from business logic (services) from persistence (repositories).
- Use dependency injection (constructor injection preferred) — avoid `new` inside business logic.
- Keep controllers thin: validate input, call service, return response. No business logic in controllers.
- Use value objects for domain concepts (Money, Email, UserId) instead of primitive types.
- Use interfaces at module boundaries. Concrete implementations are internal details.

## Error handling

- Use specific exception classes per failure domain (e.g., `UserNotFoundException`, `ValidationException`).
- Catch exceptions at the boundary layer (controller, middleware) — not inside business logic unless recovery is possible.
- Never catch `\Exception` or `\Throwable` silently. At minimum, log the exception.
- Use result objects or typed return values instead of exceptions for expected failure paths (validation, not-found).

## Testing

- Use PHPUnit for unit and integration tests. Use Pest for more readable test syntax when the team prefers it.
- Mock external dependencies (HTTP clients, databases, file systems) — test business logic in isolation.
- Use data providers for parameterized tests instead of copy-paste test methods.
- Run tests in CI with code coverage reporting. Target meaningful coverage, not 100%.
- Use fixtures and factories for test data — never rely on production database state.

## Composer and dependencies

- Run `composer audit` in CI to catch known vulnerabilities.
- Use `composer outdated` to identify stale dependencies. Update regularly.
- Prefer well-maintained packages with active security patch records.
- Use autoloading via `composer.json` PSR-4 — never use `require`/`include` for class loading.

## Performance

- Use OPcache in production with preloading for frequently used classes.
- Profile with Xdebug or Blackfire before optimizing. Measure, don't guess.
- Use connection pooling (Swoole, FrankenPHP, or external proxy) for high-concurrency workloads.
- Cache expensive computations and database queries — invalidate on writes.

## Avoid

- `mixed` type as a lazy escape — use proper union types or generics (via PHPStan/Psalm).
- `@` error suppression operator — handle errors explicitly.
- Global functions or static state for business logic — makes testing impossible.
- Concatenating SQL strings — use prepared statements or query builders.
- Storing sensitive data in plain-text config files — use environment variables or vault.

## Reference files

| File                                          | Load when                                                                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `references/php84-strict-typing-checklist.md` | Strict typing migration, enum patterns, readonly properties, PHPStan configuration, or Composer security audit is needed. |
