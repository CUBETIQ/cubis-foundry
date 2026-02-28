# MCP + Skill System Cleanup and Modernization Plan (Codex First)

## Summary
Refactor the repository so MCP assets are separated from workflow assets, reduce startup/context bloat by switching installs to curated profiles by default, fix duplicate-skill cleanup bugs, and modernize language skills with current ecosystem baselines.  
This plan is implementation-ready and includes migration, compatibility, and validation.

## Audit Findings (Current State)
1. Default install currently pulls **all indexed skills** (122) from [`bin/cubis.js`](/Users/phumrin/Documents/Cubis%20Foundry/bin/cubis.js), not only manifest-selected skills.
2. Repo has high duplication footprint:
- `workflows/skills`: 857 files / ~5.2 MB
- `workflows/powers`: 769 files / ~4.47 MB
- `platforms/{copilot,cursor,windsurf}/skills`: each 585 files / ~3.6 MB
3. Installed global Codex skills currently show context-bloat patterns:
- `~/.agents/skills`: 161 top-level dirs, 189 `SKILL.md` files
- 10 duplicated skill names (notably `postman/*` variants + `react-best-practices` duplicate naming)
4. Duplicate cleanup bug exists in [`bin/cubis.js`](/Users/phumrin/Documents/Cubis%20Foundry/bin/cubis.js): `findNestedSkillDirs` ignores direct child nested skills due `depth >= 1` condition.
5. `skills_index.json` has a duplicate logical name (`react-best-practices`) due mismatch in [`workflows/skills/nextjs-react-expert/SKILL.md`](/Users/phumrin/Documents/Cubis%20Foundry/workflows/skills/nextjs-react-expert/SKILL.md).
6. Rules templates are strict in a way that can inflate routine context usage (`must load skill before ANY task`) in:
- [`platforms/codex/rules/AGENTS.md`](/Users/phumrin/Documents/Cubis%20Foundry/workflows/workflows/agent-environment-setup/platforms/codex/rules/AGENTS.md)
- [`platforms/antigravity/rules/GEMINI.md`](/Users/phumrin/Documents/Cubis%20Foundry/workflows/workflows/agent-environment-setup/platforms/antigravity/rules/GEMINI.md)
- [`platforms/copilot/rules/AGENTS.md`](/Users/phumrin/Documents/Cubis%20Foundry/workflows/workflows/agent-environment-setup/platforms/copilot/rules/AGENTS.md)

## Public CLI/API/Behavior Changes
1. Add install profile flags to `cbx workflows install`:
- `--skill-profile <core|web-backend|full>` (default: `core`)
- `--include-mcp` (adds MCP catalog skills)
- `--all-skills` (alias for `--skill-profile full`)
2. Add maintenance command:
- `cbx workflows prune-skills --platform <...> --scope <...> --skill-profile <...> [--include-mcp] [--dry-run]`
3. Keep backward compatibility:
- Existing `--postman` behavior remains for MCP runtime/config setup.
- Existing skill IDs remain valid via soft-deprecation wrappers/aliases.

## Target Structure
1. Introduce top-level MCP area:
- `mcp/skills/<skill-id>/...`
- `mcp/powers/<skill-id>/...`
- `mcp/catalogs/default.json`
- `mcp/README.md`
2. Keep non-MCP skills under:
- `workflows/skills/...`
- `workflows/powers/...`
3. Update package publishing:
- Add `mcp` to `package.json` `files` list.
4. Keep old paths as compatibility aliases for 1-2 releases, then remove.

## Implementation Workstreams

### 1) Installer and Catalog Refactor
1. Update skill source resolution in [`bin/cubis.js`](/Users/phumrin/Documents/Cubis%20Foundry/bin/cubis.js) to support multiple catalogs/roots (`workflows/skills` + `mcp/skills`).
2. Change default install selection logic:
- `core` profile from catalog file
- `web-backend` profile extends `core`
- `full` preserves current all-indexed behavior
3. Make `manifest.skills` authoritative fallback only when profile catalog absent.
4. Add catalog files and wiring:
- `workflows/skills/catalogs/core.json`
- `workflows/skills/catalogs/web-backend.json`
- `mcp/catalogs/default.json`

### 2) Duplicate and Context-Bloat Fixes
1. Fix nested duplicate detection bug in [`bin/cubis.js`](/Users/phumrin/Documents/Cubis%20Foundry/bin/cubis.js):
- treat direct child skill folders as nested duplicates
- stop recursion once nested skill boundary found
2. Add prune flow to remove:
- nested duplicates (`postman/*` duplicated skill dirs)
- obsolete alias dirs (when explicitly requested)
3. Regenerate `skills_index.json` from canonical skill roots with:
- unique `name`
- short descriptions
- deterministic ordering
4. Add script `scripts/generate-skills-index.mjs` and enforce in CI/tests.

### 3) MCP Separation
1. Move MCP-related skills from `workflows/skills` to `mcp/skills`:
- `postman`, `atlassian-mcp`, `github-automation`, `sentry-automation`, `datadog-automation`, `mcp-builder`, `mcp-developer`, `building-mcp-server-on-cloudflare`
2. Move corresponding powers to `mcp/powers`.
3. Update `workflows/scripts/generate-powers.mjs` to process both skill roots.
4. Preserve compatibility wrappers in old locations with deprecation metadata and replacement pointers.

### 4) Rules and Agent Policy Optimization
1. Update rule templates to reduce forced skill-loading overhead:
- simple Q&A path: no skill load
- implementation/debug path: max 1 primary + 1 supporting skill
- orchestration path: only when cross-domain
2. Keep decision transparency requirement, but make it concise.
3. Update large custom agent files (Codex platform) by extracting verbose playbooks into referenced skill docs and trimming frontmatter `skills` lists.
4. Remove default MCP skill dependency from generic agents unless task explicitly needs MCP.

### 5) TECH.md and Engineering Rule Enhancements
1. Extend TECH generation (`cbx rules tech-md`) to include:
- `Recommended Skills` section (from detected stack)
- `MCP Footprint` section (if MCP configs detected)
- `Context Budget Notes` (suggested profile: core/web-backend/full)
2. Add optional compact mode:
- `cbx rules tech-md --compact`
3. Keep existing compatibility output fields so current tests remain stable.

### 6) Language Skill Modernization (Web + Backend Priority)
1. Update existing skills:
- `typescript-pro`: baseline to TS 5.9-era guidance, modern config and inference patterns
- `golang-pro`: baseline to Go 1.25-era guidance, modern generics/concurrency/testing patterns
- `python-pro`: baseline to modern Python 3.13/3.14-era guidance
- `rust-pro`: baseline to current stable Rust practices
- `javascript-pro`, `nodejs-best-practices`, `nextjs-developer`, `react-expert`, `react-best-practices`: align with current web-backend patterns
2. Add new language skills for initial expansion:
- `java-pro`
- `csharp-pro`
- `kotlin-pro`
3. Soft-deprecate redundancies with aliases:
- fix duplicate naming conflict around `nextjs-react-expert` vs `react-best-practices`
- mark deprecated wrappers with explicit replacement fields

## Skills to Update / Enhance / Remove Redundancy

### Update Now
- `typescript-pro`, `golang-pro`, `python-pro`, `rust-pro`, `javascript-pro`, `nodejs-best-practices`, `nextjs-developer`, `react-expert`, `react-best-practices`, `nextjs-react-expert`

### Enhance
- `mcp-builder`, `mcp-developer`, `postman` (trim size, modern MCP transport/auth guidance)
- rule templates (`AGENTS.md`, `GEMINI.md`, Copilot instructions)
- `TECH.md` generation logic

### Remove/Deprecate Redundancy
- nested `postman/*` duplicated skills
- duplicate skill name collision (`react-best-practices`)
- stale backup artifacts (`run_subagent.py.bak`) from shipped skill assets
- optional cleanup of `.DS_Store` noise in skill trees

## Test Cases and Validation
1. Installer profile behavior:
- `core` installs only core catalog skills
- `web-backend` installs core + web/backend additions
- `full` reproduces current all-skill install
2. MCP include behavior:
- `--include-mcp` adds MCP catalog skills from `mcp/skills`
3. Duplicate cleanup:
- direct-child nested duplicate skills are detected and removed
- prune command reports deterministic before/after counts
4. Index integrity:
- no duplicate `name` in generated `skills_index.json`
- all index paths resolve to existing skill files
5. Rule/template behavior:
- managed workflow block still syncs correctly
- updated skill-selection policy present across codex/antigravity/copilot templates
6. Tech scanner:
- existing tests pass
- new sections (`Recommended Skills`, `MCP Footprint`) validated with fixtures
7. Backward compatibility:
- old CLI options still function
- deprecated skill aliases resolve to replacement guidance

## Rollout and Migration
1. Release N:
- ship new profiles, MCP folder, prune command, compatibility wrappers
- default install changes to `core`
2. Release N+1:
- warn on deprecated aliases and old paths
3. Release N+2:
- remove deprecated path aliases if adoption complete

## Assumptions and Defaults
1. Default install mode is `core` (chosen).
2. MCP relocation scope is `assets + catalogs` (chosen).
3. Redundancy handling uses soft deprecation (chosen).
4. Initial language expansion focus is `web + backend` (chosen).
5. Existing users keep working without immediate breakage; cleanup is opt-in via prune command plus safe nested-duplicate auto-fix.

## External References Used
- Reddit scaling pattern and context strategy discussion: [r/opencodeCLI post](https://www.reddit.com/r/opencodeCLI/comments/1rfwlzk/i_have_2004_ai_skills_installed_heres_how_i/)
- OpenCode skill behavior (`available_skills` and on-demand loading): [OpenCode Skills](https://opencode.ai/docs/skills/)
- Context management guidance (`/compact`, disable auto model invocation): [Claude Code Context Management](https://docs.anthropic.com/en/docs/claude-code/common-workflows)
- Cloudflare code mode + MCP direction: [Cloudflare Code mode announcement](https://blog.cloudflare.com/code-mode-mcp/)
- Cloudflare MCP server docs: [Cloudflare MCP docs](https://developers.cloudflare.com/agents/model-context-protocol/)
- MCP ecosystem reference: [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)
- TypeScript current release line: [TypeScript 5.9 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-5-9/)
- Go release history (1.25.3 current stable in history): [Go Release History](https://go.dev/doc/devel/release#go1.25.3)
- Python current release line: [Python 3.14 release notes](https://www.python.org/downloads/release/python-3140/)
- Rust current release line: [Rust language homepage](https://www.rust-lang.org/)
