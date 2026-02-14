---
command: "/orchestrate"
description: "Coordinate multiple specialists to solve cross-cutting tasks with explicit ownership and handoff."
triggers: ["orchestrate", "coordinate", "multi-area", "cross-team", "handoff"]
---
# Orchestrate Workflow

Use this when a task spans backend, frontend, data, testing, and release concerns.

## Routing
- Primary coordinator: `@orchestrator`
- Architecture decisions: `@backend-specialist`
- Data model/query risk: `@database-architect`
- UX/client behavior: `@frontend-specialist`
- Security review: `@security-auditor`
- Verification strategy: `@test-engineer`
- Rollout plan: `@devops-engineer`

## Protocol
1. Break the request into workstreams with owners.
2. Request one primary specialist output per workstream.
3. Merge outputs into a single implementation plan.
4. Resolve conflicts before implementation.
5. End with a release-risk summary.

## Output Contract
- Scope and assumptions
- Workstreams with owner + deliverable
- Consolidated execution order
- Test and rollout gates
- Open risks and mitigations
