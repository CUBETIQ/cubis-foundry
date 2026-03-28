# Foundry V2 Reduction Matrix

**Date:** 2026-03-28
**Scope:** Current `foundry/modules/*` surfaces in the active worktree. This is an implementation-facing reduction map for Phase 1 Task 2.
**Source of truth:** Spec: `docs/superpowers/specs/2026-03-28-foundry-v2-realignment-spec.md`. Plan: `docs/superpowers/plans/2026-03-28-foundry-v2-realignment-plan.md`.

**Status key**
- Skills: `keep`, `merge`, `compat-alias`, `remove`
- Agents: `core`, `domain-specialist`, `alias`, `remove`
- Workflows: `stay`, `rename`, `fold`

## Priority implementation rows

- Rebuild testing around `web-testing`, `android-emulator-testing`, and `ios-simulator-testing`, then demote `qa`, `unit-testing`, `integration-testing`, and `playwright-interactive`.
- Rebuild design around `design`, `web-ui-design`, and `mobile-ui-design`, then merge the fragmented `frontend-design*` surfaces and reduce `stitch` to alias-only behavior.
- Keep concrete language and framework skills user-facing, but normalize their display names over time instead of collapsing them into umbrellas.
- Keep the 8 core agents and the current small workflow set; change routing beneath them before deleting old entrypoints.

## Rename policy

- Rename targets like `typescript`, `python`, `go`, `sveltekit`, and `expo` are user-facing names first.
- Existing module IDs stay in place during this reduction phase unless a later task explicitly performs a module-ID rename.
- Workflow names stay stable unless a workflow row is explicitly marked `rename` or `fold`.

## Target-state summary

- Primary user-facing reductions in this phase:
  - Testing: `web-testing`, `android-emulator-testing`, `ios-simulator-testing`
  - Design: `design`, `web-ui-design`, `mobile-ui-design`
  - Languages and frameworks remain concrete, user-searchable surfaces
- Retained support and infrastructure surfaces that still stay in the matrix:
  - `ci-cd-pipeline`
  - `git-workflow`
  - `kaizen-iteration`
  - `mcp-core`
  - `research-core`
  - `rules-core`
  - `spec-driven-delivery`
- Read the inventory tables as migration control, not as the final user-facing menu.

## Skills: primary user-facing

| Current surface | Status | Target destination | Rationale / next action |
| --- | --- | --- | --- |
| `qa` | `compat-alias` | `web-testing`, `android-emulator-testing`, `ios-simulator-testing`, owning language/framework skills | Legacy entrypoint only; route browser/mobile runtime testing by runtime, but route code-level unit and integration requests to the owning language or framework skill. |
| `unit-testing` | `merge` | owning language/framework skills | Fold unit-test guidance into the stack that owns it. |
| `integration-testing` | `merge` | framework/platform skills | Fold runtime, fixture, and container guidance into the owning stack. |
| `playwright-interactive` | `merge` | `web-testing` support | Keep browser automation, visual, and accessibility material as support content, not a primary skill. |
| `design` | `keep` | `design` | Canonical design surface stays user-facing. |
| `design-audit` | `merge` | `design` | Fold audit checks into `design` as an audit mode; the retained `workflows/design-audit` workflow invokes that audit mode instead of a separate skill. |
| `frontend-design` | `merge` | `design`, `web-ui-design`, `mobile-ui-design` | `design` becomes the primary owner and routing layer; browser-specific content moves to `web-ui-design`, and small-screen content moves to `mobile-ui-design`. |
| `frontend-design-core` | `merge` | `design` | Move routing and critique into the master design skill. |
| `frontend-design-implementation-handoff` | `merge` | `design` | Keep handoff guidance only as implementation support. |
| `frontend-design-mobile-patterns` | `merge` | `mobile-ui-design` | Move touch and small-screen patterns to the mobile surface. |
| `frontend-design-screen-brief` | `merge` | `web-ui-design`, `mobile-ui-design` | Route browser screen briefs to `web-ui-design` and small-screen product briefs to `mobile-ui-design`. |
| `frontend-design-style-selector` | `merge` | `design` | Style selection belongs in master design direction. |
| `frontend-design-system` | `merge` | `design`, `web-ui-design`, `mobile-ui-design` | `design` owns shared visual-system guidance; `web-ui-design` owns browser component examples; `mobile-ui-design` owns mobile component and pattern guidance. |
| `stitch` | `compat-alias` | `design`, `web-ui-design` | Alias only for legacy callers; default route goes to `design`, and browser UI generation requests route to `web-ui-design`. |
| `typescript-best-practices` | `keep` | `typescript` | Canonical language skill; absorb local testing guidance. |
| `python-best-practices` | `keep` | `python` | Canonical language skill; absorb local testing guidance. |
| `golang-best-practices` | `keep` | `go` | Canonical language skill; normalize naming to `go`. |
| `rust-best-practices` | `keep` | `rust` | Canonical language skill; absorb local testing guidance. |
| `java-best-practices` | `keep` | `java` | Canonical language skill; absorb local testing guidance. |
| `kotlin-best-practices` | `keep` | `kotlin` | Canonical language skill; absorb local testing guidance. |
| `swift-best-practices` | `keep` | `swift` | Canonical language skill; absorb local testing guidance. |
| `csharp-best-practices` | `keep` | `csharp` | Canonical language skill; absorb local testing guidance. |
| `react` | `keep` | `react` | Stable framework skill; keep user-searchable. |
| `nextjs` | `keep` | `nextjs` | Stable framework skill; keep user-searchable. |
| `fastapi` | `keep` | `fastapi` | Stable framework skill; keep user-searchable. |
| `nestjs` | `keep` | `nestjs` | Stable framework skill; keep user-searchable. |
| `django-drf` | `keep` | `django-drf` | Stable framework skill; keep user-searchable. |
| `spring-boot` | `keep` | `spring-boot` | Stable framework skill; keep user-searchable. |
| `sqlalchemy` | `keep` | `sqlalchemy` | Keep as framework/data-access skill. |
| `prisma` | `keep` | `prisma` | Keep as framework/data-access skill. |
| `svelte-sveltekit` | `keep` | `sveltekit` | Keep the surface and normalize the user-facing name. |
| `expo-app` | `keep` | `expo` | Keep the surface and normalize the user-facing name. |
| `docker-compose-dev` | `keep` | `docker-compose-dev` | Concrete dev/runtime skill stays useful. |
| `kubernetes-deploy` | `keep` | `kubernetes-deploy` | Concrete deployment skill stays useful. |
| `api-design` | `keep` | `api-design` | Canonical design skill stays canonical. |
| `architecture-doc` | `keep` | `architecture-doc` | Canonical documentation skill stays canonical. |
| `code-review` | `keep` | `code-review` | Canonical review skill stays canonical. |
| `database-design` | `keep` | `database-design` | Canonical design skill stays canonical. |
| `deep-research` | `keep` | `deep-research` | Canonical research skill stays canonical. |
| `mcp-server-builder` | `keep` | `mcp-server-builder` | Canonical MCP build skill stays canonical. |
| `observability` | `keep` | `observability` | Canonical platform skill stays canonical. |
| `owasp-security-review` | `keep` | `owasp-security-review` | Canonical security review skill stays canonical. |
| `pentest-skill` | `keep` | `pentest-skill` | Canonical security skill stays canonical. |
| `prompt-engineering` | `keep` | `prompt-engineering` | Canonical prompting skill stays canonical. |
| `secret-management` | `keep` | `secret-management` | Canonical security skill stays canonical. |
| `skill-creator` | `keep` | `skill-creator` | Canonical meta-skill stays canonical. |
| `system-design` | `keep` | `system-design` | Canonical system skill stays canonical. |
| `systematic-debugging` | `keep` | `systematic-debugging` | Canonical debugging skill stays canonical. |
| `tech-doc` | `keep` | `tech-doc` | Canonical technical writing skill stays canonical. |

## Skills: retained support and infrastructure

| Current surface | Status | Target destination | Rationale / next action |
| --- | --- | --- | --- |
| `ci-cd-pipeline` | `keep` | `ci-cd-pipeline` | Retained support surface for delivery automation; keep it available, but do not treat it as part of the reduced primary skill menu. |
| `git-workflow` | `keep` | `git-workflow` | Retained support surface for process and branch hygiene; keep it available, but do not treat it as part of the reduced primary skill menu. |
| `kaizen-iteration` | `keep` | `kaizen-iteration` | Retained support surface for iteration patterns; keep it available, but do not treat it as part of the reduced primary skill menu. |
| `mcp-core` | `keep` | `mcp-core` | Retained support surface for runtime integration and tool-boundary policy; not part of the reduced primary skill menu. |
| `research-core` | `keep` | `research-core` | Retained support surface for research/reference capture; not part of the reduced primary skill menu. |
| `rules-core` | `keep` | `rules-core` | Retained support surface for generated instruction policy; not part of the reduced primary skill menu. |
| `spec-driven-delivery` | `keep` | `spec-driven-delivery` | Retained support surface for plan/spec automation; not part of the reduced primary skill menu. |

## Agents

| Current surface | Status | Target destination | Rationale / next action |
| --- | --- | --- | --- |
| `agents-core/agents/debugger.md` | `core` | `agents-core` | Canonical core agent set. |
| `agents-core/agents/explorer.md` | `core` | `agents-core` | Canonical core agent set. |
| `agents-core/agents/implementer.md` | `core` | `agents-core` | Canonical core agent set. |
| `agents-core/agents/orchestrator.md` | `core` | `agents-core` | Canonical core agent set. |
| `agents-core/agents/planner.md` | `core` | `agents-core` | Canonical core agent set. |
| `agents-core/agents/researcher.md` | `core` | `agents-core` | Canonical core agent set. |
| `agents-core/agents/reviewer.md` | `core` | `agents-core` | Canonical core agent set. |
| `agents-core/agents/tester.md` | `core` | `agents-core` | Canonical core agent set. |
| `playwright-interactive/agents/accessibility-auditor.md` | `domain-specialist` | `web-testing` | Browser accessibility specialist stays as support content. |
| `playwright-interactive/agents/test-author.md` | `domain-specialist` | `web-testing` | Browser test specialist stays as support content. |
| `playwright-interactive/agents/visual-reviewer.md` | `domain-specialist` | `web-testing` | Browser visual specialist stays as support content. |

## Workflows

| Current surface | Status | Target destination | Rationale / next action |
| --- | --- | --- | --- |
| `workflows/debug` | `stay` | `workflows/debug` | Keep the workflow name. |
| `workflows/deploy` | `stay` | `workflows/deploy` | Keep the workflow name. |
| `workflows/design-audit` | `stay` | `workflows/design-audit` | Keep the workflow name, but retarget it to the new design stack instead of the fragmented frontend-design wrappers. |
| `workflows/design-screen` | `stay` | `workflows/design-screen` | Keep the workflow name, but route it through `design` plus `web-ui-design` or `mobile-ui-design` based on target surface. |
| `workflows/design-system` | `stay` | `workflows/design-system` | Keep the workflow name, but route it through `design` with both `web-ui-design` and `mobile-ui-design` patterns where the system spans both surfaces. |
| `workflows/implement` | `stay` | `workflows/implement` | Keep the workflow name. |
| `workflows/loop` | `stay` | `workflows/loop` | Keep the workflow name. |
| `workflows/plan` | `stay` | `workflows/plan` | Keep the workflow name. |
| `workflows/review` | `stay` | `workflows/review` | Keep the workflow name. |
| `workflows/test` | `stay` | `workflows/test` | Keep the workflow name, but route it into `web-testing`, `android-emulator-testing`, and `ios-simulator-testing`. |

## Cut Line

- Use `merge` and `fold` rows to move content into the listed canonical surfaces before deleting old entrypoints.
- Keep `compat-alias` rows as thin shims only until downstream callers move.
- Keep `core` agents and `stay` workflows canonical.
- Do not reintroduce grouped rows; keep the matrix exhaustive and itemized.
