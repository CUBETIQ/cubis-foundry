# Cubis Foundry — Shared Steering Protocol

This is the canonical steering source for routing policy and managed MCP block language.
Keep platform rule files aligned with this template plus per-platform overrides, and do not duplicate the managed block into agent or workflow markdown.

Managed-block sync: `npm run inject:mcp-rules:all` (or `cbx workflows sync-rules`)

---

## 1) Route Resolution

Follow this decision tree for EVERY user request:

```
┌─ User request arrives
├─ Is it a simple, obvious task (rename, fix typo, one-liner)?
│   └─ Execute directly. No routing needed. Stop.
├─ Did user explicitly name a workflow or agent?
│   └─ Honor that route first. Stop.
├─ Did user explicitly name an exact skill ID?
│   └─ Run skill_validate on that exact ID.
│       ├─ Valid? → Load it and proceed. Stop.
│       └─ Invalid/unavailable? → Fall through. Do not guess.
├─ Is it non-trivial work with requirements, traceability, or spec language?
│   └─ Prefer /spec unless the user already chose another valid route. Stop.
├─ Is it architecture, design-system, ADR, or structure-governance work?
│   └─ Prefer /architecture unless the user already chose another valid route. Stop.
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
> **Rule:** If the user already chose the route, do not re-route it unless the named workflow, agent, or skill is invalid.
> **Rule:** For non-trivial work, read `PRODUCT.md`, `ENGINEERING_RULES.md`, `ARCHITECTURE.md`, and `TECH.md` in that order when they exist before planning or implementing.

---

## 2) Layer Reference

| Layer                | What it is                            | When to use it                                        | How to invoke                              | Example                                     |
| -------------------- | ------------------------------------- | ----------------------------------------------------- | ------------------------------------------ | ------------------------------------------- |
| **Direct execution** | No routing needed                     | Small, clear, single-step tasks                       | Just do it                                 | "rename this variable"                      |
| **Workflow**         | Multi-step recipe with verification   | Structured task with known pattern                    | `/plan`, `/create`, `/debug`, `/test`      | "plan the auth system"                      |
| **Agent**            | Specialist persona with domain skills | Domain expertise needed for execution                 | `@backend-specialist`, `@security-auditor` | "design the API schema"                     |
| **Named skill**      | Exact skill selected by the user      | User already named the skill and it validates cleanly | `skill_validate` → `skill_get`             | "use stitch for this screen"                |
| **Skill (MCP)**      | Supporting domain knowledge           | Domain context that a workflow or agent doesn't cover | `skill_get` after `skill_validate`         | loading `typescript-pro` for TS conventions |
| **skill_search**     | Fuzzy discovery tool                  | Domain unclear, no skill ID known yet                 | One narrow search AFTER route_resolve      | "what skill covers Prisma?"                 |
| **route_resolve**    | Intent → route mapper                 | Free-text request doesn't match any known route       | MCP tool call with task description        | "I need to optimize my database"            |
| **Orchestrator**     | Multi-specialist coordinator          | Work genuinely spans 2+ domains                       | `/orchestrate` or `@orchestrator`          | "build full-stack feature with auth"        |
| **Spec workflow**    | Git-tracked spec pack                 | Non-trivial work needs durable scope, acceptance, and traceability | `/spec`                           | "turn this feature into an implementation spec" |
| **Architecture workflow** | Architecture and design-system memory | Need to refresh structure, flows, ADRs, or design-system rules | `/architecture`                 | "update the clean architecture contract" |

---

## 3) Skill Loading Protocol

Skills are **supporting context** unless the user explicitly named the exact skill. In that case validate the named skill first, then proceed without route discovery.

1. **Never begin with `skill_search`.** Inspect the repo/task locally first.
2. If the user explicitly named an exact skill ID, run `skill_validate` on that ID before any `route_resolve` call.
3. Resolve the route (workflow, agent, or direct execution) before loading any non-explicit skills.
4. **After routing: if `route_resolve` returned `primarySkillHint` or `primarySkills`, load the first via `skill_validate` → `skill_get` before executing. Not optional for non-trivial tasks.**
5. If `detectedLanguageSkill` is returned and matches the project, load it too (if not already loaded this session).
6. Domain still unclear after routing? → ONE narrow `skill_search`. Not two.
7. Call `skill_get` with `includeReferences: false` by default.
8. Load reference files one at a time with `skill_get_reference` — only when a specific reference is needed.
9. Do not auto-prime every specialist. Only load what `primarySkills` recommends or the task clearly needs.
10. Never pass workflow IDs or agent IDs to skill tools.
11. For `/architecture` and strict subprocess architecture generation, treat the skill bundle as already resolved. Attach the named skills directly instead of discovering them lazily.

---

## 4A) Research Escalation

Use external research only when one of these is true:

1. Freshness matters: latest APIs, model behavior, vendor docs, pricing, policies, releases, or client capabilities.
2. Public comparison matters: tradeoff analysis across tools, frameworks, libraries, or hosted services.
3. The user explicitly asks to research, compare, verify, or gather outside evidence.

Research source ladder:

1. **Repo/local evidence first** — inspect code, config, docs, tests, and installed artifacts before going outside the workspace.
2. **Official docs next** — vendor docs, upstream repos, standards, or maintainer documentation are primary evidence.
3. **Community evidence last** — Reddit, blog posts, issue threads, and forum posts are allowed only as labeled secondary evidence.

Research output contract:

- **Verified facts** — claims backed by primary sources or local repo evidence.
- **Secondary/community evidence** — useful but lower-trust signals, clearly labeled.
- **Gaps / unknowns** — what could not be verified.
- **Recommended next route** — workflow, agent, or skill to use after research.

When the research result shows a change to product direction, project structure, boundaries, design system, or testing strategy, surface `doc_impact` and recommend `/architecture` or a managed-doc refresh before or after implementation.

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
- Max 3 re-delegation iterations per specialist per milestone. If limit hit, surface to user.

### Subagent Delegation

- Delegate to subagents only when work genuinely requires domain specialization or parallel execution.
- Each delegation must include: **goal**, **acceptance criteria**, **output contract**, **scope boundary**.
- Use background/parallel agents only for independent workstreams with no shared mutable state.
- Sequential work stays sequential — do not parallelize work that writes to the same files or resources.
- Set iteration limits (`maxTurns`) to prevent runaway loops.

### Handoff Patterns

- Agents may suggest the next logical agent via handoff chains (e.g., `@debugger` → `@test-engineer`).
- Handoffs are suggestions, not mandates — the user decides when to follow them.
- Every handoff preserves the output contract: `milestones`, `gate_status`, `next_handoff`.

---

## 5) Memory & Cross-Session Learning

- Key agents (orchestrator, debugger, test-engineer, researcher, project-planner, code-archaeologist) support project memory.
- Project memory persists debugging patterns, architecture decisions, test strategies, and codebase insights across sessions.
- Skills loaded into agent context accumulate domain knowledge — do not reload what is already in context.

---

## 6) Long-Running and Handoff Work

1. Use `/implement-track` for milestone-based work, resumable execution, or progress checkpoints.
2. Use `/orchestrate` when multiple specialties need explicit ownership or handoff.
3. Keep workflow output contracts intact when handing work between specialists — especially `milestones`, `gate_status`, and `next_handoff`.

---

## 7) Workflow Quick Reference

| Intent Pattern                          | Workflow           | Primary Agent          |
| --------------------------------------- | ------------------ | ---------------------- |
| Build a spec pack with traceability     | `/spec`            | `@project-planner`     |
| Plan a feature, design, or architecture | `/plan`            | `@project-planner`     |
| Refresh architecture or design-system docs | `/architecture` | `@project-planner`     |
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

## 8) Safety and Verification

1. Do not run destructive actions without explicit user confirmation.
2. Keep diffs small and reversible when possible.
3. Verify with focused checks before finalizing.
4. State what was NOT validated.
5. Use web search only when information may be stale, public comparison matters, or the user explicitly asks.
6. Prefer official docs first. Treat Reddit/community sources as secondary evidence and label them that way.
7. If the task changes product direction, project structure, scaling assumptions, or design-system rules, update or flag `PRODUCT.md`, `ARCHITECTURE.md`, `ENGINEERING_RULES.md`, `TECH.md`, and `ROADMAP.md` as needed.

---

## 9) Maintenance

- Refresh installed rules: `cbx workflows sync-rules --platform {{PLATFORM}} --scope project`
- Diagnose setup issues: `cbx workflows doctor {{PLATFORM}} --scope project`
