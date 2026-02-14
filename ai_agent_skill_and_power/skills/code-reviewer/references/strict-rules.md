# Strict Code Review Rules

> Reference for: Code Reviewer
> Load when: Enforcing strict review standards

## Core Standard (Non‑Negotiable)

- **Correctness first**: reject changes that introduce incorrect behavior, regressions, or incomplete edge cases.
- **Readability is a feature**: if code is hard to understand, request changes.
- **Consistency over preference**: match existing style and patterns within the codebase.

## Change Size & Scope

- **Small, focused changes**: large or multi‑purpose changes must be split.
- **No scope creep**: remove unrequested features and speculative abstractions.
- **Spec first**: if requirements are ambiguous, request clarification before approval.

## Naming & File Organization

- **Intention‑revealing names**: names must convey responsibility and behavior.
- **One primary concern per file**: avoid “utility dump” files.
- **Consistent file naming**: follow repo conventions strictly (case, separators).
- **Acronyms as words**: prefer `UserId` over `UserID`, `HttpClient` over `HTTPClient`.

## Error Handling & Reliability

- **No empty catch blocks**: handle or rethrow with context.
- **Avoid catch‑all**: don’t catch overly broad exceptions unless at top‑level boundary.
- **Fail fast with clear errors**: avoid silent failures and partial updates.

## Concurrency & Race Conditions

- **Atomicity required**: read‑modify‑write must be transactional or atomic.
- **Shared state must be protected**: use locks/transactions/queues as appropriate.
- **Idempotency for retries**: requests and jobs should be safe to retry.

## Design Principles (Strict)

- **SRP**: split large classes/functions by responsibility.
- **KISS**: prefer the simplest solution that meets requirements.
- **DRY**: remove duplicated logic or clearly justify it.
- **YAGNI**: no speculative features or “just in case” hooks.
- **Composition over inheritance**: avoid deep inheritance chains.

## Testing Requirements

- **Critical paths covered**: happy path + failure path + edge cases.
- **Concurrency tests**: required when shared state or ordering is involved.
- **No flaky tests**: reject non‑deterministic tests.

## Logging & Observability

- **No sensitive data in logs**: redact secrets and PII.
- **Log sparingly**: avoid noisy logs and repeated errors.
- **Actionable logs**: include enough context to debug without leaking data.

## Security Baseline

- **Input validation** everywhere input crosses trust boundaries.
- **Least privilege** for services, DB access, and API scopes.
- **No unsafe defaults**: defaults must be secure, explicit opt‑in for risky behavior.

## References

- Google Engineering Practices – Code Review (reviewer): https://google.github.io/eng-practices/review/reviewer/
- Google Engineering Practices – CL Author Guide: https://google.github.io/eng-practices/review/developer/
- Google Style Guides (naming/style consistency): https://google.github.io/styleguide/
- AOSP Code Style (strict rules + exceptions): https://source.android.com/docs/setup/contribute/code-style
- Microsoft C# Coding Conventions (enforceable style): https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/coding-conventions
