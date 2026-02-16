---
command: "/test"
description: "Design and execute verification strategy aligned to risk and acceptance criteria."
triggers: ["test", "verify", "coverage", "qa", "regression"]
---
# Test Workflow

Use this to drive confidence before merge or release.

## Steps
1. Map change surface to risk areas.
2. Choose unit/integration/e2e depth per risk.
3. Run fast checks first, then broad suite.
4. Report failures with root-cause direction.

## Output Contract
- Coverage map (what was tested)
- Test results summary
- Remaining risk and gaps
- Merge/release recommendation
