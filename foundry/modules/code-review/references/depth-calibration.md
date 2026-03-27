# Review Depth Calibration

## Overview

Not every PR deserves the same level of scrutiny. Over-reviewing low-risk changes wastes time. Under-reviewing high-risk changes misses critical bugs. Calibrating review depth ensures effort goes where it has the highest impact.

## Risk Classification

### Risk Factors

| Factor                | Low Risk            | Medium Risk           | High Risk                    |
|-----------------------|---------------------|-----------------------|------------------------------|
| Area of code          | Tests, docs, config | UI, business logic    | Auth, payments, data layer   |
| Change type           | Rename, formatting  | New feature, refactor | Security fix, migration      |
| Blast radius          | Single component    | Single service        | Multiple services, all users |
| Reversibility         | Easy rollback       | Moderate rollback     | Hard/impossible rollback     |
| Author experience     | Senior, domain expert| Mid-level            | Junior, new to codebase      |
| Test coverage         | Well tested         | Partial coverage      | No tests, untestable code    |

### Risk Score

Assign a risk score by counting high-risk factors:

- **0-1 high-risk factors**: Low risk — quick review.
- **2-3 high-risk factors**: Medium risk — standard review.
- **4+ high-risk factors**: High risk — deep review.

## Review Depth Levels

### Quick Review (5-10 minutes)

**Apply to**: Config changes, documentation, dependency bumps (patch), test additions, formatting.

**What to check**:
- Does the change match the description?
- Does CI pass?
- Any obviously wrong values (typos in config, wrong dependency version)?

**What to skip**:
- Line-by-line code review.
- Architecture assessment.
- Deep testing verification.

### Standard Review (15-30 minutes)

**Apply to**: New features in well-understood areas, UI changes, refactoring.

**What to check**:
- Correctness of the happy path.
- Obvious edge cases (null, empty, boundary).
- Consistency with existing patterns.
- Test presence for new behavior.
- Basic security checks (input validation, auth).

**What to skip**:
- Exhaustive edge case analysis.
- Performance profiling.
- Line-by-line security audit.

### Deep Review (30-60 minutes)

**Apply to**: Auth changes, payment processing, data migrations, API contract changes, security fixes.

**What to check**:
- Every line of the diff.
- All edge cases from the review checklist.
- Full security analysis (injection, auth bypass, data exposure).
- Performance implications (query plans, memory usage).
- Rollback strategy.
- Test coverage for every identified risk.

**What to skip**:
- Nothing. Deep review is exhaustive by design.

### Pair Review (60+ minutes)

**Apply to**: Complex architectural changes, critical infrastructure, first-time contributors to sensitive areas.

**How it works**:
1. Schedule a synchronous review session (video call or in person).
2. Author walks through the changes, explaining design decisions.
3. Reviewer asks questions in real-time.
4. Both parties agree on follow-up items.

**When to use**:
- Changes too complex to review asynchronously.
- Disagreements that have stalled in PR comments.
- Knowledge transfer opportunities (reviewer learns a new area).

## Calibration by Change Type

### Database Migrations

**Risk**: High — migrations are hard to reverse and affect all environments.

**Focus on**:
- Backward compatibility (can the old code run with the new schema?).
- Data preservation (does the migration lose or corrupt data?).
- Performance (will the migration lock tables? How long will it run?).
- Rollback migration (does a down migration exist and does it work?).

### API Contract Changes

**Risk**: High — breaking changes affect all consumers.

**Focus on**:
- Is the change backward-compatible?
- Are deprecated fields marked with a sunset timeline?
- Is the API documentation updated?
- Are existing consumers notified?

### Authentication and Authorization

**Risk**: Critical — bugs here affect every user.

**Focus on**:
- Every auth check: is it present, correct, and tested?
- Session handling: creation, validation, expiry, revocation.
- Token security: generation strength, storage, transmission.
- Privilege escalation: can a user access resources they should not?

### Frontend Changes

**Risk**: Low to Medium — usually reversible, limited blast radius.

**Focus on**:
- Accessibility (screen reader, keyboard navigation, contrast).
- Responsive behavior (mobile, tablet, desktop).
- Performance (bundle size, rendering, network requests).
- User-facing text (spelling, tone, i18n readiness).

### Test Changes

**Risk**: Low — tests do not affect production, but bad tests create false confidence.

**Focus on**:
- Are assertions meaningful (not just "no error")?
- Are tests deterministic (no time-dependent or order-dependent)?
- Do tests cover the stated behavior, not implementation details?
- Are mocks realistic (not masking real integration issues)?

## Time Management

### Review SLA

| Priority    | First Response | Complete Review |
|-------------|----------------|-----------------|
| Critical    | 1 hour         | 4 hours         |
| High        | 4 hours        | 8 hours         |
| Medium      | 8 hours        | 24 hours        |
| Low         | 24 hours       | 48 hours        |

### When You Cannot Review in Time

1. Comment on the PR: "I've seen this but cannot review until [time]. If that blocks you, please reassign."
2. Suggest an alternative reviewer who has context.
3. Never silently ignore a review request.

### Batch Review Strategy

When multiple PRs are queued:
1. Sort by risk (highest first).
2. Review the two highest-risk PRs deeply.
3. Do quick reviews for low-risk PRs.
4. Delegate medium-risk PRs to other reviewers if available.
5. Block off focused review time — context-switching between reviews and development degrades both.
