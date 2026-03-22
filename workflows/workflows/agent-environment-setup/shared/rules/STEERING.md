# Cubis Foundry - Shared Steering Protocol

This is the canonical steering source for routing policy and managed MCP block language.
Keep platform rule files aligned with this template plus per-platform overrides, and do not duplicate the managed block into agent or workflow markdown.

Managed-block sync: `npm run inject:mcp-rules:all` (or `cbx workflows sync-rules`)

---

## 1) Route Resolution

Follow this decision tree for every user request:

```
┌─ User request arrives
├─ Is it a simple, obvious task (rename, fix typo, one-liner)?
│   └─ Execute directly. No routing needed. Stop.
├─ Did user explicitly name a workflow or agent?
│   └─ Honor that route first. Stop.
├─ Did user explicitly name an exact skill ID?
│   └─ Run skill_validate on that exact ID.
│       ├─ Valid? -> Load it and proceed. Stop.
│       └─ Invalid/unavailable? -> Fall through. Do not guess.
├─ Is it explicit Stitch UI generation, screen editing, or "use Stitch" work?
│   └─ Prefer /design-screen first. Resolve design state, then run the Stitch sequence only if still needed. Stop.
├─ Is it explicit UI/UX/design-system work?
│   └─ Prefer `/design-system`, `/design-screen`, `/design-audit`, or `/design-refresh` based on intent. Stop.
├─ Is it non-trivial work with requirements, traceability, or spec language?
│   └─ Prefer /plan unless the user already chose another valid route. Stop.
├─ Is it bug, error, or failing test investigation?
│   └─ Prefer /debug. Stop.
├─ Is it test, coverage, or verification work?
│   └─ Prefer /test. Stop.
├─ Is it review or security audit work?
│   └─ Prefer /review. Stop.
├─ Is it deployment, CI/CD, Docker, or infra work?
│   └─ Prefer /deploy. Stop.
├─ Is it bounded iterative work that needs a hard stop condition?
│   └─ Prefer /loop. Stop.
├─ Is it multi-step work in one domain?
│   └─ Pick the best-fit workflow and load it. Stop.
├─ Is it cross-domain work spanning 2+ specialties?
│   └─ Use @orchestrator. Stop.
├─ Is it documentation-only or a repo knowledge refresh?
│   └─ Use /implement with a docs-focused scope, or /plan if only scoping is needed. Stop.
├─ None of the above?
│   └─ Use route_resolve MCP tool, then follow its recommendation.
│       └─ Still unclear? -> ONE narrow skill_search. Stop.
└─ If every route fails -> ask the user to clarify.
```

> **Rule:** Inspect the repo and task locally before choosing a route or loading any skill.
> **Rule:** If the user already chose the route, do not reroute it unless the named workflow, agent, or skill is invalid.
> **Rule:** For non-trivial work, read `docs/foundation/MEMORY.md` first when it exists. Then load `docs/foundation/PRODUCT.md`, `ENGINEERING_RULES.md`, `docs/foundation/ARCHITECTURE.md`, `docs/foundation/TECH.md`, `docs/foundation/memory/*.md`, and ADRs only as needed.

---

## 2) Layer Reference

| Layer | What it is | When to use it | How to invoke | Example |
| --- | --- | --- | --- | --- |
| Direct execution | No routing needed | Small, clear, single-step tasks | Just do it | "rename this variable" |
| Workflow | Multi-step recipe with verification | Structured task with known pattern | `/plan`, `/implement`, `/debug`, `/test`, `/review`, `/deploy`, `/loop`, `/design-system`, `/design-screen`, `/design-audit`, `/design-refresh` | "plan the auth system" |
| Agent | Specialist persona with domain skills | Domain expertise needed for execution | `@implementer`, `@reviewer` | "design the API schema" |
| Named skill | Exact skill selected by the user | User already named the skill and it validates cleanly | `skill_validate` -> `skill_get` | "use stitch for this screen" |
| Skill (MCP) | Supporting domain knowledge | Domain context that a workflow or agent does not cover | `skill_get` after `skill_validate` | loading `typescript-best-practices` |
| skill_search | Fuzzy discovery tool | Domain unclear, no skill ID known yet | One narrow search after route resolution | "what skill covers Prisma?" |
| route_resolve | Intent to route mapper | Free-text request does not match any known route | MCP tool call with task description | "I need to optimize my database" |
| Orchestrator | Multi-specialist coordinator | Work genuinely spans 2+ domains | `@orchestrator` | "build full-stack feature with auth" |

---

## 3) Skill Loading Protocol

Skills are supporting context unless the user explicitly named the exact skill. In that case validate the named skill first, then proceed without route discovery.

1. Never begin with `skill_search`. Inspect the repo and task locally first.
2. If the user explicitly named an exact skill ID, run `skill_validate` on that ID before any route discovery.
3. Resolve the route before loading any non-explicit skills.
4. After routing, if `route_resolve` returned `primarySkillHint` or `primarySkills`, load the first via `skill_validate` -> `skill_get` before executing.
5. If `detectedLanguageSkill` is returned and matches the project, load it too if not already loaded this session.
6. Domain still unclear after routing? Use one narrow `skill_search`. Not two.
7. Call `skill_get` with `includeReferences: false` by default.
8. Load reference files one at a time with `skill_get_reference` only when a specific reference is needed.
9. Do not auto-prime every specialist. Only load what `primarySkills` recommends or the task clearly needs.
10. Never pass workflow IDs or agent IDs to skill tools.
11. For Stitch UI work, use this order: `frontend-design` -> `frontend-design-core` -> `frontend-design-style-selector` -> `frontend-design-system` / `frontend-design-screen-brief` -> `stitch-prompt-enhancement` -> `stitch-design-system` when Stitch mirror sync is needed -> `stitch-design-orchestrator` -> `stitch-implementation-handoff`.

---

## 4) Research Escalation

Use external research only when one of these is true:

1. Freshness matters: latest APIs, model behavior, vendor docs, pricing, policies, releases, or client capabilities.
2. Public comparison matters: tradeoff analysis across tools, frameworks, libraries, or hosted services.
3. The user explicitly asks to research, compare, verify, or gather outside evidence.

Research source ladder:

1. Repo/local evidence first.
2. Official docs next.
3. Community evidence last, and label it as secondary evidence.

Research output contract:

- Verified facts.
- Secondary/community evidence.
- Gaps or unknowns.
- Recommended next route.

When the research result changes product direction, project structure, boundaries, design system, or testing strategy, surface the impact and recommend the right workflow or a managed-doc refresh.

---

## 5) Specialist Map

Use the smallest specialist set needed:

| Domain | Primary Specialist | Supporting |
| --- | --- | --- |
| Planning / architecture | `@planner` | `@explorer` |
| Exploration | `@explorer` | `@planner` |
| Implementation | `@implementer` | `@tester`, `@reviewer` |
| Debugging | `@debugger` | `@tester` |
| Testing / QA | `@tester` | `@reviewer` |
| Code review / security | `@reviewer` | `@implementer` |
| Cross-domain | `@orchestrator` | delegates as needed |

### Orchestrator Rules

- `@orchestrator` uses a repeat-until-good pattern. It delegates, verifies output, and iterates until the acceptance criteria are met.
- Each delegation must include goal, acceptance criteria, output contract, and scope boundary.
- Keep iteration caps explicit. Do not run open-ended loops.
- Sequential work stays sequential. Do not parallelize work that writes to the same files or resources.

---

## 6) Workflow Quick Reference

| Intent Pattern | Workflow | Primary Agent |
| --- | --- | --- |
| Plan a feature or architecture | `/plan` | `@explorer` -> `@planner` |
| Build a feature end-to-end | `/implement` | `@implementer` |
| Establish or refresh design foundations | `/design-system` | `@planner` -> `@implementer` |
| Design a screen before generation or implementation | `/design-screen` | `@planner` -> `@implementer` |
| Audit visual quality and design drift | `/design-audit` | `@reviewer` |
| Refresh design state after product or UI direction changes | `/design-refresh` | `@implementer` |
| Debug a complex issue | `/debug` | `@debugger` |
| Write or improve tests | `/test` | `@tester` |
| Code review + security audit | `/review` | `@reviewer` |
| Deploy, CI/CD, infrastructure | `/deploy` | `@planner` -> `@implementer` |
| Bounded autonomous iteration | `/loop` | `@orchestrator` |
| Cross-domain coordination | `@orchestrator` | delegates to others |

---

## 7) Safety And Verification

1. Do not run destructive actions without explicit user confirmation.
2. Keep diffs small and reversible when possible.
3. Verify with focused checks before finalizing.
4. State what was not validated.
5. Use web search only when information may be stale, public comparison matters, or the user explicitly asks.
6. Prefer official docs first. Treat Reddit/community sources as secondary evidence and label them accordingly.
7. If the task changes product direction, project structure, scaling assumptions, or design-system rules, update or flag the relevant foundation docs as needed.

---

## 8) Maintenance

- Refresh installed rules: `cbx workflows sync-rules --platform {{PLATFORM}} --scope project`
- Diagnose setup issues: `cbx workflows doctor {{PLATFORM}} --scope project`
