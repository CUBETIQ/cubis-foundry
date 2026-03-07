# AGENTS.md - Copilot Compatibility Bridge

Primary Copilot rule file is `.github/copilot-instructions.md`.
This `AGENTS.md` exists for cross-tool compatibility and defers
to `.github/copilot-instructions.md` when both files are present.

All detailed Copilot guidance lives in `copilot-instructions.md`.
Do not duplicate it here.

## Route-First Workflow Contract

1. Resolve workflow or agent intent before loading any skill.
2. Route surface: `.github/copilot/workflows/*.md` + `.github/prompts/workflow-*.prompt.md` + `@agent-name`.
3. Before loading any skill, inspect the repo/task locally first.

## Validated Skill Flow

1. Inspect codebase locally first - do not start with `skill_search`.
2. Resolve route intent with `route_resolve` before skill loading.
3. Run one narrow `skill_search` only if the route is still unresolved.
4. Always `skill_validate` before `skill_get`.
5. Call `skill_get` with `includeReferences:false` by default.
6. Load at most one sidecar reference at a time with `skill_get_reference`.
