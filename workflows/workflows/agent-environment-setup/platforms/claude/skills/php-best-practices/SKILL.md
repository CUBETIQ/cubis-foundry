---
name: php-best-practices
description: "Use when writing, reviewing, or refactoring modern PHP, including readonly classes, enums, property hooks, Composer package design, strict types, and security hardening."
allowed-tools: Read Grep Glob Bash Edit Write
user-invocable: true
argument-hint: "PHP file, class, or pattern to analyze"
---

# PHP Best Practices

## Purpose

Production-grade guidance for PHP 8.4+ application engineering. Covers strict typing with property hooks and asymmetric visibility, Fiber-based concurrency for non-blocking I/O, enum-driven domain modeling, readonly classes for immutable data transfer, Composer package design with autoloading and security auditing, and defense-in-depth security practices.

## When to Use

- Building new PHP services, APIs, or packages targeting PHP 8.4+.
- Designing typed service layers with readonly classes, enums, and property hooks.
- Implementing non-blocking I/O with Fibers or async runtimes (ReactPHP, Revolt, AMPHP).
- Creating Composer packages with proper autoloading, versioning, and CI.
- Hardening PHP applications against injection, CSRF, deserialization, and session attacks.
- Reviewing PHP code for type safety, architectural issues, or security vulnerabilities.

## Instructions

1. **Add `declare(strict_types=1)` to every PHP file without exception** because without it PHP silently coerces types at call boundaries, turning type declarations into documentation rather than enforcement. Automate this with PHP CS Fixer's `declare_strict_types` rule.

2. **Use typed properties, parameters, return types, and union/intersection types on all public APIs** because PHP 8.4's type system is rich enough to express precise contracts. Use `string|int` for unions, `Countable&Iterator` for intersections, `never` for functions that always throw or exit, and `null` only when null is a meaningful domain value.

3. **Use enums for all fixed value sets instead of string/int constants** because enums are type-safe, auto-complete friendly, and exhaustively matchable in `match` expressions. Use backed enums (`enum Status: string`) when values must serialize to storage or APIs. Implement interfaces on enums when they need to satisfy polymorphic contracts.

4. **Use readonly classes and readonly properties for immutable DTOs and value objects** because readonly enforcement prevents accidental mutation after construction, making objects safe to pass across service boundaries without defensive copying. Use constructor promotion (`public readonly string $name`) for concise declaration.

5. **Adopt property hooks (PHP 8.4) for computed and validated properties** because hooks replace magic `__get`/`__set` with type-safe, per-property get/set logic that the engine optimizes. Use `set` hooks for validation at assignment time and `get` hooks for lazy computation, eliminating boilerplate getter/setter methods.

6. **Use asymmetric visibility (PHP 8.4) to expose read-only public interfaces** because `public private(set)` lets external code read a property while restricting writes to the owning class, replacing the common pattern of a private property with a public getter method.

7. **Understand Fibers for non-blocking I/O coordination** because Fibers provide cooperative multitasking within a single thread — they suspend and resume execution at explicit points without callback nesting. Use Fibers through established libraries (Revolt event loop, AMPHP, ReactPHP) rather than raw `Fiber::suspend()`/`Fiber::resume()` because the libraries handle scheduling, error propagation, and resource cleanup.

8. **Separate controllers, services, and repositories into distinct layers** because mixing request handling with business logic and persistence creates untestable monoliths. Controllers validate input and return responses. Services contain business rules. Repositories abstract storage. Use constructor injection for all dependencies.

9. **Use interfaces at module boundaries and concrete classes internally** because interface-based contracts enable testing with mocks, swapping implementations (e.g., switching cache backends), and enforcing the dependency inversion principle. Keep interfaces focused — one responsibility per interface.

10. **Handle errors with specific exception hierarchies and result objects** because catching `\Exception` or `\Throwable` broadly swallows unexpected failures. Define domain-specific exception classes (`OrderNotFoundException`, `InsufficientFundsException`). Use result objects or union return types for expected failure paths like validation, which are control flow rather than exceptional conditions.

11. **Write tests with PHPUnit or Pest using data providers and mocked dependencies** because parameterized tests via data providers cover edge cases without code duplication. Mock external dependencies (HTTP clients, databases) with Mockery or PHPUnit mocks. Run tests in CI with coverage reporting and target meaningful coverage of business logic paths.

12. **Run PHPStan or Psalm at level 8+ in CI and treat failures as build-breaking** because static analysis catches type errors, dead code, and impossible conditions that tests miss. Use `@phpstan-type` and `@phpstan-param` for complex generic shapes that PHP's native type system cannot yet express.

13. **Design Composer packages with PSR-4 autoloading and semantic versioning** because PSR-4 eliminates manual `require`/`include` calls and semantic versioning lets consumers pin compatible ranges safely. Commit `composer.lock` in applications (reproducible builds) but not in libraries (flexibility for consumers). Run `composer audit` in CI to catch known vulnerabilities.

14. **Harden against injection by using prepared statements and parameterized queries exclusively** because SQL injection remains the most common PHP vulnerability. Never concatenate user input into queries. Use PDO with `PDO::ATTR_EMULATE_PREPARES => false` for real server-side preparation. Validate and sanitize all input at the boundary layer.

15. **Protect sessions and authentication with secure defaults** because PHP's default session configuration is insufficient for production. Set `session.cookie_httponly`, `session.cookie_secure`, `session.cookie_samesite`, and regenerate session IDs on privilege changes. Use `password_hash()`/`password_verify()` with `PASSWORD_ARGON2ID` for credential storage.

16. **Use OPcache with preloading in production** because OPcache eliminates repeated parsing and compilation, and preloading keeps frequently used classes in shared memory across requests. Profile with Xdebug (development) or Blackfire (production profiling) before optimizing — measure, do not guess.

17. **Avoid `mixed` type, `@` error suppression, and global mutable state** because `mixed` defeats static analysis, `@` hides errors that should be handled explicitly, and global state creates hidden coupling that makes testing impossible. Use proper union types, explicit error handling, and dependency injection instead.

18. **Use `match` expressions over `switch` for value-returning conditionals** because `match` uses strict comparison (no type coercion), requires exhaustive handling, returns values directly, and does not fall through — eliminating an entire category of bugs common with `switch`.

## Output Format

Produces PHP 8.4+ code with strict types, readonly classes, enums, property hooks, and explicit interface contracts. Includes Composer configuration, PHPStan setup, and test examples where relevant.

## References

| File | Load when |
| --- | --- |
| `references/modern-php.md` | You need property hooks, asymmetric visibility, enums, match expressions, named arguments, or first-class callable syntax. |
| `references/type-system.md` | You need union/intersection types, readonly classes, DNF types, PHPStan generics, or strict typing migration guidance. |
| `references/testing.md` | You need PHPUnit/Pest setup, data providers, mocking strategies, code coverage, or CI test pipeline patterns. |
| `references/composer-packaging.md` | You need PSR-4 autoloading, semantic versioning, package publishing, dependency auditing, or lock file strategies. |
| `references/security.md` | You need injection prevention, session hardening, CSRF protection, deserialization safety, or input validation patterns. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Design a typed service with readonly value objects, enums, and property hooks for an e-commerce domain."
- "Create a Composer package with PSR-4 autoloading, PHPStan level 9, and CI-ready test configuration."

## Claude Platform Notes

- Use `$ARGUMENTS` to access user-provided arguments passed when the skill is invoked.
- Reference skill-local files with `${CLAUDE_SKILL_DIR}/references/<file>` for portable paths.
- When `context: fork` is set, the skill runs in an isolated subagent context; the `agent` field names the fork target.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available for dynamic skill discovery and loading.
- Use `allowed-tools` in frontmatter to restrict tool access for security-sensitive skills.
