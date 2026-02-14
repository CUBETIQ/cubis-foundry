---
command: "/qa"
description: "Create and execute quality strategy with automation and regression-focused coverage."
triggers: ["qa", "test", "regression", "automation", "e2e"]
---
# QA Workflow

Use this when verification quality and regression prevention are primary concerns.

## Routing
- Primary specialist: `@qa-automation-engineer`
- Test strategy support: `@test-engineer`
- Bug investigation support: `@debugger`

## Steps
1. Identify risk-heavy user journeys.
2. Define automation + manual checks where needed.
3. Execute validation and triage failures.
4. Report confidence level and remaining gaps.

## Output Contract
- Test strategy and scope
- Automation coverage updates
- Defect findings and severity
- Confidence and residual risk
