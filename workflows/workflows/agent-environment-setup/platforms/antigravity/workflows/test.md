---
command: "/test"
description: "Design and run relevant test strategy for current changes."
triggers: ["test", "coverage", "verify", "qa", "regression"]
---
# Test Workflow

Use this workflow for verification and safety checks.

## Steps
1. Choose unit/integration/e2e coverage needed.
2. Run focused tests first, then broader checks.
3. Report failures with root-cause direction.
4. Confirm pass/fail against acceptance criteria.
