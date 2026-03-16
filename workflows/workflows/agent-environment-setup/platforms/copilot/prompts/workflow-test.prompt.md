# Workflow Prompt: /test

Design and execute verification strategy aligned to user risk, release confidence, and regression evidence.

Use this prompt with the matching workflow file:
- Workflow: ../copilot/workflows/test.md

Execution contract:
1. Treat route selection as already resolved by this prompt; do not begin with skill discovery.
2. Apply workflow sections in order: When to use, Workflow steps, Context notes, Verification.
3. Route to the workflow's primary specialist and only add supporting specialists when needed.
4. If freshness or public comparison matters, run `deep-research` before implementation and use official docs as primary evidence.
5. Return actions taken, verification evidence, and any gaps.
