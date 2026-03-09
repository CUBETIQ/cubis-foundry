---
command: "/review"
description: "Run a strict review for bugs, regressions, accessibility issues, and security risk with prioritized findings."
triggers: ["review", "audit", "pr", "quality", "security review"]
---
# Review Workflow

## When to use
Use this for pull request, branch, or release-candidate review when the goal is finding defects before merge.

## Routing
- Code quality and legacy risk: `@code-archaeologist`
- Frontend quality and UI regressions: `@frontend-specialist`
- Security findings: `@security-auditor`
- Test adequacy and regression proof: `@test-engineer`

## Context notes
- This workflow file, active platform rules, and selected agents or skills guide execution.
- Attach changed files, failing checks, screenshots, traces, and risk areas when context is incomplete.

## Skill Routing
- Primary skills: `typescript-pro`, `javascript-pro`, `python-pro`, `golang-pro`, `rust-pro`
- Supporting skills (optional): `frontend-code-review`, `auth-architect`, `webapp-testing`, `playwright-e2e`, `debugging-strategies`, `skill-creator`
- Start with the dominant language skill for the changed code. Add `frontend-code-review` when the review target includes UI behavior, accessibility, rendering cost, or design-system drift; `auth-architect` for identity or policy risk; `webapp-testing` or `playwright-e2e` when the missing proof is test-shape or browser-flow coverage; `debugging-strategies` when review findings already need root-cause isolation; and `skill-creator` for skill-package or mirror-output reviews.

## Workflow steps
1. Inspect changed behavior and identify the highest-risk user or system paths.
2. Find defects by severity, prioritizing correctness, security, and regression risk over style.
3. Check whether current tests actually prove the changed behavior.
4. Report actionable remediation guidance with file or area references.

## Verification
- Run focused checks for the reviewed surface when possible.
- Confirm whether findings are already covered by tests or still require new proof.
- Note what was not validated directly.

## Output Contract
```yaml
REVIEW_WORKFLOW_RESULT:
  primary_agent: code-archaeologist
  supporting_agents: [frontend-specialist?, security-auditor?, test-engineer?]
  primary_skills: [typescript-pro?, javascript-pro?, python-pro?, golang-pro?, rust-pro?]
  supporting_skills: [frontend-code-review?, auth-architect?, webapp-testing?, playwright-e2e?, debugging-strategies?, skill-creator?]
  findings:
    - severity: <critical|high|medium|low>
      summary: <string>
      affected_areas: [<path-or-area>]
      recommended_fix: <string>
  residual_risks: [<string>] | []
```
