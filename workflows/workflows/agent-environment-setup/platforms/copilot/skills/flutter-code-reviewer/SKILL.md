---
name: "flutter-code-reviewer"
description: "Perform strict, actionable code reviews for Flutter/Dart projects enforcing architecture boundaries, Riverpod patterns, testing, and performance"
---
# Flutter/Dart Code Reviewer

## Overview

This power performs comprehensive code reviews enforcing Clean Architecture boundaries, state management patterns (Riverpod/GetX/Bloc), testing requirements, and performance standards. It adapts to your project's specific tech stack and design system.

## Review Goals

- Keep the codebase **consistent** with your architecture
- Catch bugs early (loops, rebuild storms, race conditions)
- Enforce **clean boundaries** (presentation ↔ domain ↔ data)
- Ensure changes are **testable** and include the right tests
- Prevent long-term maintenance pain (naming, duplication, tight coupling)

## When to Use

- Reviewing pull requests
- Conducting code quality audits
- Checking for architectural violations
- Validating state management patterns
- Ensuring test coverage

## Review Severity Levels

- **BLOCKER**: Must fix before merge (crashes, security, data loss, infinite loops, architectural violations)
- **MAJOR**: Should fix before merge (performance issues, missing tests, incorrect patterns)
- **MINOR**: Fix soon (style, small refactors)
- **NIT**: Optional (readability, formatting)

## Review Output Format

When reviewing, output exactly:

1. **Summary** (2-5 lines)
2. **BLOCKERS** (bulleted, each with "Why" + "Fix")
3. **MAJORS**
4. **MINORS / NITS**
5. **Suggested patch** (optional: small code snippets only)
6. **Tests to add/update** (concrete list)
7. **Architecture & performance notes** (select/watch boundaries, DI, caching)

---

## Architecture Compliance (Pragmatic Clean Architecture)

### Presentation Layer
- Views contain **no business logic**, no repository calls
- Controllers (AsyncNotifier) own all state + operations for a feature
- One controller per feature — reads AND writes (no separate mutation unless 5+ write ops)
- UI uses design system components and tokens

### Data Layer
- Repository is the "conductor" — coordinates API + cache, returns domain types
- Repository handles error mapping (DioException → Failure)
- No Riverpod imports in data layer
- DI provider for repository lives inline in the repository file

### Models
- ONE Freezed class per entity (no separate entity + model)
- Add mapper only when API response shape ≠ domain shape

**BLOCKER if:**
- UI calls repository/data source directly
- Data layer imports Riverpod/Flutter
- Controller imports data-layer classes (Dio, jsonEncode/Decode)
- Duplicate entity + model classes when they're the same shape
- Pass-through use cases that just call `repository.method()`

---

## State Management Review

### Riverpod Watch/Read Discipline
- `ref.watch` only in widget build / provider build
- `ref.read` in callbacks + controller methods
- `ref.listen` for side effects (snackbar/nav/dialog)

### Loop & Rebuild Storm Red Flags

**BLOCKER:**
- Calling controller methods inside widget `build()`
- Updating providers during build in a way that affects watched dependencies
- Mutating lists/maps in-place and re-emitting same object reference

### Families / Parameters
- Params must be stable and comparable (`==`/`hashCode`) if object-based
- Avoid passing mutable lists/maps as family params

### Async State Handling
- For "load more", keep flags inside state (don't abuse AsyncLoading and lose data)
- Guard parallel calls (`isLoadingMore`)

---

## Naming & File Structure

### File Naming
- `lowercase_with_underscores.dart` for files and folders
- 1 file = 1 main public type (or a tight group)

### Type/Function Naming
- Types: UpperCamelCase
- Methods: lowerCamelCase; verb-first for commands (`refresh`, `submit`, `approve`)
- Avoid `getX()` for remote calls; use `fetchX()`

**BLOCKER if:**
- Inconsistent naming causes confusion across features
- Cross-feature imports instead of shared/core modules

---

## Clean Code Principles (Pragmatic)

Apply these *practically*:
- **SRP**: one controller per screen/aggregate; repositories only data concerns
- **DIP**: domain depends on abstractions; data provides implementations
- **KISS**: avoid over-abstraction; prefer the simplest working design
- **DRY**: avoid copy/paste, but do not create "god utils" or premature frameworks
- **YAGNI**: don't add complexity "just in case"

Use as review guidance, not dogma.

---

## Performance Checklist

**BLOCKER:**
- Expensive computation in build (parsing, sorting large lists) without memoization
- Whole-screen watching large provider states without `select`
- Rebuilding entire lists for small changes

**MAJOR:**
- Missing `const` where easy
- No stable keys on list items where state should persist

---

## Testing Requirements

Required when:
- New controller/provider logic is added
- Bug fixes for regressions
- Paging/refresh/caching logic changes
- Error mapping changes

Minimum:
- 1 unit/provider test for controller happy path
- 1 unit test for failure path
- Widget test for loading/error/data (or override repo)

See: `references/testing_expectations.md`

---

## References

Load detailed guidance only when needed.

| File | Load when |
| --- | --- |
| `references/review_checklist.md` | Starting a review and needing the full category-by-category checklist |
| `references/testing_expectations.md` | Checking whether controller, widget, or regression tests are sufficient |
| `references/common-issues.md` | Looking for recurring Flutter/Riverpod review smells and anti-patterns |
| `references/feedback-examples.md` | Writing concise, high-signal review feedback with clear fixes |
| `references/strict-rules.md` | Applying stricter merge-blocking review standards |

## Templates

- `templates/review_response.md` - Code review response template
