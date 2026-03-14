# Git Workflow Eval Assertions

## Eval 1: Branching Strategy Selection

This eval tests whether the skill can analyze team context and recommend an appropriate branching strategy with a concrete migration plan.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                          |
|---|----------|-------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| 1 | contains | `trunk-based` — Recommends trunk-based dev      | A team deploying twice weekly with merge pain needs fewer long-lived branches, not more ceremony.       |
| 2 | contains | `feature flag` — Feature flag strategy           | Trunk-based development without feature flags leads to half-built features in production.               |
| 3 | contains | `short-lived` — Short-lived branch emphasis      | The root cause of merge conflicts is branch lifetime. This must be explicitly called out.               |
| 4 | contains | `migration` — Migration plan included            | Telling a team to "use trunk-based" without a migration path is useless advice.                         |
| 5 | contains | `branch protection` — Protection rules           | Any branching strategy without branch protection is incomplete. CI gating prevents regressions.         |

### What a passing response looks like

- Identifies that GitFlow is overkill for a SaaS team deploying twice weekly.
- Recommends trunk-based development or GitHub Flow with clear rationale.
- Provides a phased migration plan: freeze GitFlow, create new branch protection, migrate one team first.
- Includes feature flag strategy for incomplete work.
- Specifies GitHub branch protection settings (required reviews, status checks, merge queue).
- Addresses the 3-5 day PR cycle with concrete suggestions (smaller PRs, review SLAs, CODEOWNERS).

---

## Eval 2: Commit Message Writing

This eval tests whether the skill produces correctly typed, well-structured conventional commit messages.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                          |
|---|----------|-------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| 1 | contains | `feat` — Correct type for new feature            | Rate limiting is new functionality. Mistyping it as `fix` or `chore` breaks automated changelogs.       |
| 2 | contains | `fix` — Correct type for bug fix                 | The null avatar crash is clearly a bug. Using `refactor` here would hide a user-facing fix.             |
| 3 | contains | `refactor` — Correct type for internal change    | The connection pool change has no user-visible effect. Using `feat` would mislead changelog readers.    |
| 4 | contains | `ci` — Correct type for CI change                | Pipeline changes are CI concerns, not build or chore. Correct typing enables filtered changelogs.       |
| 5 | contains | `imperative` — Imperative mood guidance          | Conventional commits require imperative mood. Past tense is the most common mistake.                    |

### What a passing response looks like

- Four commit messages, each with the correct conventional commit type.
- Subject lines under 72 characters in imperative mood.
- Body text explaining WHY each change was made (traffic spike, null crash, per-request pools, sequential slowness).
- Optional scope in parentheses (e.g., `feat(api):`, `fix(profile):`, `refactor(db):`, `ci(pipeline):`).
- No mixing of concerns — each commit message matches exactly one change.
