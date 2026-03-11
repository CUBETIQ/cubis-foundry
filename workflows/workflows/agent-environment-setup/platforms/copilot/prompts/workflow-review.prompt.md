# Workflow Prompt: /review

Run a strict review for bugs, regressions, accessibility issues, security risk, and code quality with prioritized findings.

Use this prompt with the matching workflow file:
- Workflow: ../copilot/workflows/review.md

Execution contract:
1. Treat route selection as already resolved by this prompt; do not begin with skill discovery.
2. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
3. Route to the workflow's primary specialist and only add supporting specialists when needed.
4. Return actions taken, verification evidence, and any gaps.
