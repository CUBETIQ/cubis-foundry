# Code Review Eval Assertions

## Eval 1: Review Feedback Quality

This eval tests whether the skill identifies critical security and correctness issues in code and provides structured, actionable feedback.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                          |
|---|----------|-------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| 1 | contains | `SQL injection` — Injection vulnerability        | String interpolation in SQL is the textbook injection vector. Missing this is a disqualifying review.   |
| 2 | contains | `password` — Plaintext password storage          | Storing passwords without hashing (bcrypt/argon2) violates basic security. Must be caught in review.    |
| 3 | contains | `validation` — Missing input validation          | Accepting raw user input without validation enables injection, type confusion, and data corruption.     |
| 4 | contains | `role` — Privilege escalation via mass assignment| Users should not be able to set their own role. This is a privilege escalation vector.                  |
| 5 | contains | `error` — Missing error handling                 | No try/catch means unhandled promise rejections crash the server or leak stack traces to clients.       |

### What a passing response looks like

- Identifies SQL injection as the highest-severity blocking issue.
- Recommends parameterized queries with specific code example.
- Flags plaintext password storage and recommends bcrypt or argon2.
- Points out that `role` should not come from user input (default to a safe role, require admin action to elevate).
- Notes missing input validation and recommends a validation library (zod, joi, express-validator).
- Flags missing error handling and recommends try/catch with appropriate status codes.
- Organizes feedback by severity: blocking issues first, then suggestions, then nits.

---

## Eval 2: Review Prioritization

This eval tests whether the skill can triage multiple PRs by risk and recommend appropriate review depth for each.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                          |
|---|----------|-------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| 1 | contains | `payment` — High priority for financial code     | Payment processing errors have direct financial impact. Must be reviewed thoroughly.                    |
| 2 | contains | `delete` — High risk for destructive operations  | Account deletion + auth changes create security and data loss risk. Requires deep review.              |
| 3 | contains | `README` — Low priority for documentation typo   | A typo fix requires only a quick glance. Spending review time here is waste.                           |
| 4 | contains | `lock file` — Context-aware diff assessment      | Lock file changes inflate the diff but carry low risk. The real review is the package.json change.     |
| 5 | contains | `order` — Explicit prioritization                | Must provide a concrete review order, not just describe each PR in isolation.                          |

### What a passing response looks like

- Ranks PR #203 (account deletion) and PR #201 (payment webhook) as top priorities.
- Recommends deep review for #203 (auth + destructive operation) and #201 (financial transactions).
- Recommends a focused review for #205 (verify no behavior change despite "refactor" claim).
- Recommends a light review for #204 (check package.json diff only, skip lock file).
- Recommends instant approval for #202 (README typo, no code risk).
- Provides a concrete review order: #203 -> #201 -> #205 -> #204 -> #202.
