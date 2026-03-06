<!-- cbx:managed:skill-routing start -->
## Skill Routing
Classify intent before any MCP call. Keep one primary agent and one primary skill by default.

TIER 1 — DIRECT
- If the domain and exact skill are obvious, call `skill_get "<exact-skill-id>"`.
- Examples: `openapi` -> `api-designer`; `postman collection` -> `postman`; `drizzle schema` -> `database-skills`; `create a skill` or `fix skill metadata` -> `skill-authoring`.

TIER 2 — TARGETED SEARCH
- If the domain is clear but the exact skill ID is not, run one `skill_search "<1-3 word noun query>"`.
- Then validate/load the best match with `skill_validate` -> `skill_get`.
- Cap: one `skill_search` per task. If no good match, continue without a skill.

TIER 3 — SKIP
- Do not call MCP for conversational turns, same-session follow-ups in the same domain, or work already covered by native tools and local repo context.

Workflow/agent pre-filter:
- backend/api/service/endpoint/middleware -> `@backend-specialist`
- database/schema/migration/query/index -> `@database-architect`
- auth/jwt/oauth/rbac/session/secrets -> `@security-auditor` + `@backend-specialist`
- frontend/react/component/ui/css/layout -> `@frontend-specialist`
- mobile/flutter/react-native/ios/android -> `@mobile-developer`
- plan/spec/prd/architecture -> `@planner-agent`
- review/audit/coverage -> `@code-reviewer`

Rules:
- Never pre-load agents or skills speculatively.
- Never use `skill_search` to discover workflows or custom agents.
- Never call `skill_get` for workflow IDs or agent IDs.
- Route skill package creation, metadata repair, sidecar repair, and cross-platform skill adaptation directly to `skill-authoring`.
- Load one supporting skill only when the current task explicitly crosses domains.

# Full reference: foundry-detail.md#tiered-routing
<!-- cbx:managed:skill-routing end -->
