---
name: laravel
description: "Use when building Laravel 11+ applications with Eloquent ORM, middleware pipelines, queue-driven jobs, event broadcasting, and API resources for JSON:API-style responses."
---
# Laravel

## Purpose

Use when building Laravel 11+ applications with Eloquent ORM, middleware pipelines, queue-driven jobs, event broadcasting, and API resources for JSON:API-style responses.

## When to Use

- Building or extending Laravel REST APIs with Eloquent-backed resources.
- Designing middleware stacks, request validation, and authorization gates.
- Implementing queue-based job processing, event/listener pipelines, or scheduled tasks.
- Reviewing Laravel code for N+1 queries, mass-assignment safety, and queue reliability.

## Instructions

1. **Confirm the Laravel and PHP baseline first** because version-specific features (e.g., Laravel 11 slim skeleton, PHP 8.2+ enums) determine which patterns are available and which are outdated.
2. **Define Eloquent models with explicit fillable/guarded arrays and relationship methods** because mass-assignment vulnerabilities and missing relationships are the most common source of data-integrity bugs.
3. **Use Eloquent API Resources and Resource Collections for all JSON responses** because leaking raw model attributes exposes internal schema details and makes versioning painful.
4. **Eager-load relationships at the query level with `with()` or `load()`** because N+1 queries silently degrade performance and are hard to catch without tooling.
5. **Place business logic in dedicated service classes, not in controllers or models** because fat controllers and fat models resist testing and create coupling between HTTP concerns and domain rules.
6. **Write Form Request classes for all validation instead of inline `$request->validate()`** because Form Requests centralize authorization checks, custom messages, and complex conditional rules in a testable unit.
7. **Compose middleware for cross-cutting concerns like rate limiting, CORS, and tenant scoping** because middleware keeps controllers focused on happy-path logic and makes policies reusable across routes.
8. **Dispatch jobs to queues for any work exceeding 200ms wall-clock time** because synchronous heavy work blocks the HTTP response cycle and degrades user-perceived latency.
9. **Implement retry, backoff, and `failed()` methods on every queued job** because transient failures in mail, payment, and third-party APIs are normal and jobs without retry logic silently drop work.
10. **Use events and listeners for side effects that should not block the primary action** because decoupling side effects (notifications, audit logs, cache invalidation) makes the primary action easier to test and reason about.
11. **Register authorization via Policies tied to models, not ad-hoc Gate closures** because Policies co-locate all authorization rules for a resource and integrate with `authorize()` and `can()` helpers automatically.
12. **Use database transactions for multi-step writes and wrap them with `DB::transaction()`** because partial writes without transactions leave data in an inconsistent state that is expensive to recover from.
13. **Write feature tests using `RefreshDatabase` and factory-seeded data** because feature tests that hit real routes with real middleware catch integration bugs that unit tests miss.
14. **Run `php artisan model:show` and `route:list` as verification checkpoints** because these commands surface missing relationships, duplicate routes, and middleware gaps before code review.
15. **Configure queue workers with Horizon or Supervisor for production reliability** because artisan queue:work without supervision silently dies on memory leaks and unhandled exceptions.
16. **Pin dependencies with `composer.lock` and run `composer audit` in CI** because unpinned dependencies introduce supply-chain risk and audit catches known CVEs before deployment.

## Output Format

Provide implementation guidance, code examples, Artisan commands, and configuration snippets as appropriate to the task. Include migration snippets when schema changes are involved.

## References

Load on demand. Do not preload all reference files.

| File | Load when |
| --- | --- |
| `references/eloquent.md` | You need Eloquent model patterns, relationships, scopes, accessors/mutators, or query optimization guidance. |
| `references/middleware-routing.md` | You need middleware composition, route grouping, rate limiting, or request lifecycle guidance. |
| `references/queues-events.md` | You need queue job design, retry/backoff strategies, event/listener wiring, or Horizon configuration. |
| `references/testing.md` | You need feature test patterns, factory design, mocking external services, or Pest/PHPUnit integration. |
| `references/security.md` | You need CSRF protection, authentication guards, authorization policies, encryption, or input sanitization. |

## Scripts

No helper scripts are required for this skill right now. Keep execution in `SKILL.md` and `references/` unless repeated automation becomes necessary.

## Examples

- "Help me build a Laravel API resource for orders with nested line items"
- "Review my Laravel queue job for retry safety and failure handling"

## Antigravity Platform Notes

- Use Agent Manager for parallel agent coordination and task delegation.
- Skill and agent files are stored under `.agent/skills/` and `.agent/agents/` respectively.
- TOML command files in `.agent/commands/` provide slash-command entry points for workflows.
- Replace direct `@agent-name` delegation with Agent Manager dispatch calls.
- Reference files are loaded relative to the skill directory under `.agent/skills/<skill-id>/`.
