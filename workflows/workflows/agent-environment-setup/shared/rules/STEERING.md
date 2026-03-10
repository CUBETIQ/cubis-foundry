# Cubis Foundry — Shared Steering Protocol

This is the canonical steering template. Platform-specific rules files are generated from this template
plus per-platform overrides. Edit only here — never edit platform rules files directly.

Generation: `npm run generate:platform-assets` (or `cbx workflows sync-rules`)

---

## 1) Route Resolution

Follow this decision tree for EVERY user request:

```
┌─ User request arrives
├─ Is it a simple, obvious task (rename, fix typo, one-liner)?
│   └─ Execute directly. No routing needed. Stop.
├─ Did user explicitly name a workflow or agent?
│   └─ Honor that route first. Stop.
├─ Is it multi-step work in ONE domain?
│   └─ Pick the best-fit workflow. Load it. Stop.
├─ Is it cross-domain work spanning 2+ specialties?
│   └─ Use /orchestrate or @orchestrator. Stop.
├─ None of the above?
│   └─ Use route_resolve MCP tool → follow its recommendation.
│       └─ Still unclear? → ONE narrow skill_search. Stop.
└─ If every route fails → ask the user to clarify.
```

> **Rule:** Inspect the repo and task locally BEFORE choosing a route or loading any skill.

---

## 2) Layer Reference

| Layer                | What it is                            | When to use it                                        | How to invoke                              | Example                                     |
| -------------------- | ------------------------------------- | ----------------------------------------------------- | ------------------------------------------ | ------------------------------------------- |
| **Direct execution** | No routing needed                     | Small, clear, single-step tasks                       | Just do it                                 | "rename this variable"                      |
| **Workflow**         | Multi-step recipe with verification   | Structured task with known pattern                    | `/plan`, `/create`, `/debug`, `/test`      | "plan the auth system"                      |
| **Agent**            | Specialist persona with domain skills | Domain expertise needed for execution                 | `@backend-specialist`, `@security-auditor` | "design the API schema"                     |
| **Skill (MCP)**      | Supporting domain knowledge           | Domain context that a workflow or agent doesn't cover | `skill_get` after `skill_validate`         | loading `typescript-pro` for TS conventions |
| **skill_search**     | Fuzzy discovery tool                  | Domain unclear, no skill ID known yet                 | One narrow search AFTER route_resolve      | "what skill covers Prisma?"                 |
| **route_resolve**    | Intent → route mapper                 | Free-text request doesn't match any known route       | MCP tool call with task description        | "I need to optimize my database"            |
| **Orchestrator**     | Multi-specialist coordinator          | Work genuinely spans 2+ domains                       | `/orchestrate` or `@orchestrator`          | "build full-stack feature with auth"        |

---

## 3) Skill Loading Protocol

Skills are **supporting context**, not the route layer. Always route first, then load skills if needed.

1. **Never begin with `skill_search`.** Inspect the repo/task locally first.
2. Resolve the route (workflow, agent, or direct execution) before considering skills.
3. If the exact skill ID is known → run `skill_validate` → then `skill_get`.
4. If the domain is still unclear AFTER route resolution → use ONE narrow `skill_search`.
5. Call `skill_get` with `includeReferences: false` by default.
6. Load reference files one at a time with `skill_get_reference` — only when a specific reference is needed.
7. Do not auto-prime every specialist with a skill. Load only what the task clearly needs.
8. Never pass workflow IDs or agent IDs to skill tools.

---

## 4) Specialists

Use the best specialist first:

| Domain                  | Primary Specialist                           | Supporting               |
| ----------------------- | -------------------------------------------- | ------------------------ |
| Backend / API / Data    | `@backend-specialist`, `@database-architect` | `@security-auditor`      |
| Frontend / UI           | `@frontend-specialist`                       | `@performance-optimizer` |
| Mobile                  | `@mobile-developer`                          | `@frontend-specialist`   |
| Security                | `@security-auditor`, `@penetration-tester`   | `@backend-specialist`    |
| DevOps / Release        | `@devops-engineer`                           | `@sre-engineer`          |
| Testing / QA            | `@test-engineer`, `@qa-automation-engineer`  | `@debugger`              |
| Debugging / Performance | `@debugger`, `@performance-optimizer`        | `@test-engineer`         |
| Research / Exploration  | `@researcher`                                | any specialist           |
| Validation / Quality    | `@validator`                                 | any specialist           |
| Cross-domain            | `@orchestrator`                              | delegates to others      |
| Documentation           | `@documentation-writer`                      | domain specialist        |
| SEO                     | `@seo-specialist`                            | `@frontend-specialist`   |
| Game Development        | `@game-developer`                            | varies by engine         |

### Orchestrator Rules

- `@orchestrator` uses the **RUG (Repeat-Until-Good)** pattern: it NEVER implements directly — only delegates to specialists with acceptance criteria and validates output independently.
- After each specialist delivers, route through `@validator` for independent quality gate before accepting.
- If validation fails, re-delegate with specific feedback (max 3 iterations).

---

## 5) Long-Running and Handoff Work

1. Use `/implement-track` for milestone-based work, resumable execution, or progress checkpoints.
2. Use `/orchestrate` when multiple specialties need explicit ownership or handoff.
3. Keep workflow output contracts intact when handing work between specialists — especially `milestones`, `gate_status`, and `next_handoff`.

---

## 6) Workflow Quick Reference

| Intent Pattern                          | Workflow           | Primary Agent          |
| --------------------------------------- | ------------------ | ---------------------- |
| Plan a feature, design, or architecture | `/plan`            | `@project-planner`     |
| Implement a feature with quality gates  | `/create`          | varies by domain       |
| Debug a complex issue                   | `/debug`           | `@debugger`            |
| Write or verify tests                   | `/test`            | `@test-engineer`       |
| Review code for bugs, security, quality | `/review`          | `@validator`           |
| Refactor without changing behavior      | `/refactor`        | domain specialist      |
| Deploy, CI/CD, infrastructure           | `/devops`          | `@devops-engineer`     |
| Database schema, queries, migrations    | `/database`        | `@database-architect`  |
| Backend API, services, auth             | `/backend`         | `@backend-specialist`  |
| Mobile features                         | `/mobile`          | `@mobile-developer`    |
| Security audit or hardening             | `/security`        | `@security-auditor`    |
| Multi-milestone tracked work            | `/implement-track` | `@orchestrator`        |
| Cross-domain coordination               | `/orchestrate`     | `@orchestrator`        |
| Release preparation                     | `/release`         | `@devops-engineer`     |
| Accessibility audit                     | `/accessibility`   | `@frontend-specialist` |
| Framework migration                     | `/migrate`         | domain specialist      |
| Codebase onboarding                     | `/onboard`         | `@researcher`          |
| Vercel deployment                       | `/vercel`          | `@vercel-expert`       |

---

## 7) Safety and Verification

1. Do not run destructive actions without explicit user confirmation.
2. Keep diffs small and reversible when possible.
3. Verify with focused checks before finalizing.
4. State what was NOT validated.
5. Use web search only when information may be stale or the user explicitly asks.

---

## 8) Maintenance

- Refresh installed rules: `cbx workflows sync-rules --platform {{PLATFORM}} --scope project`
- Diagnose setup issues: `cbx workflows doctor {{PLATFORM}} --scope project`
