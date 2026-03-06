---
command: "/review"
description: "Run a strict review for bugs, regressions, and security issues with prioritized findings."
triggers: ["review", "audit", "pr", "quality", "security review"]
---
# Review Workflow

# CHANGED: output contract — converted free-form bullets into structured YAML — keeps findings and remediation guidance machine-readable.
# CHANGED: skill routing — added `skill-authoring` for skill package audits, metadata review, and sidecar repair work.

## When to use
Use this for pull request or branch quality review.

## Routing
- Code quality and legacy risk: `@code-archaeologist`
- Frontend quality: `@frontend-specialist`
- Security checks: `@security-auditor`
- Test adequacy: `@test-engineer`

## Context notes
- This workflow file, active platform rules, and selected agents/skills guide execution.
- Attach logs, screenshots, failing output, and relevant paths when context is incomplete.

## Skill Routing
- Primary skills: `code-reviewer`, `security-reviewer`
- Supporting skills (optional): `skill-authoring`, `semgrep`, `static-analysis`, `variant-analysis`
- For reviews that target a skill package itself, load `skill-authoring` before general analysis extras.

## Workflow steps
1. Inspect changed behavior and risk surface.
2. Identify defects by severity.
3. Validate tests and missing coverage.
4. Produce actionable remediation guidance.

## Verification
- Run focused checks/tests for the changed scope.
- Confirm no regressions in adjacent behavior.
- Note any gaps that were not validated.

## Output Contract
```yaml
REVIEW_WORKFLOW_RESULT:
  primary_agent: code-archaeologist
  supporting_agents: [frontend-specialist?, security-auditor?, test-engineer?]
  primary_skills: [code-reviewer, security-reviewer]
  supporting_skills: [semgrep?, static-analysis?, variant-analysis?]
  findings:
    - severity: <critical|high|medium|low>
      summary: <string>
      affected_areas: [<path-or-area>]
      recommended_fix: <string>
  residual_risks: [<string>] | []
```
