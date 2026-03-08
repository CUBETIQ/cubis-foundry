# Public Repo Skill Map

Date: 2026-03-09

This map expands the benchmark beyond Anthropic and OpenAI. It records which public repositories and catalogs are useful reference points for the currently restored specialist skills.

The generated follow-on artifacts now live at:
- [public-skill-corpus.md](D:/Cubebis%20Work/cubis-foundry/docs/agent-skills/public-skill-corpus.md)
- [public-skill-gap-matrix.md](D:/Cubebis%20Work/cubis-foundry/docs/agent-skills/public-skill-gap-matrix.md)
- [rewrite-specs.md](D:/Cubebis%20Work/cubis-foundry/docs/agent-skills/rewrite-specs.md)

## Repo classes

### Official and quasi-official baselines

- `anthropics/skills`
- `openai/skills`
- `vercel-labs/agent-skills`
- `agentskills/agentskills`

### Curated discovery and community catalogs

- `travisvn/awesome-claude-skills`
- `VoltAgent/awesome-agent-skills`
- `Microck/ordinary-claude-skills`

### Distribution and portability tooling

- `MoizIbnYousaf/Ai-Agent-Skills`
- `gotalab/skillport`
- `vercel-labs/skills`

### Smaller public implementation libraries

- `cnemri/google-genai-skills`
- `fvadicamo/dev-agent-skills`

## Why these matter

- Curated lists show what kinds of skills users actually publish and reuse.
- Aggregated libraries show common topic clusters and naming collisions.
- Installer projects show which package shapes survive across many agents.
- Smaller implementation libraries show how people write practical workflow-oriented skills outside the official repos.

## Restored skill mapping

| Skill | Public repo classes checked | What mattered |
| --- | --- | --- |
| `api-designer` | official baselines, curated catalogs, aggregate libraries | Strong trigger boundaries, narrow contract-first scope, no framework bleed into the contract skill. |
| `api-patterns` | official baselines, curated catalogs, aggregate libraries | Public repos repeatedly split API-pattern choice from concrete framework implementation. |
| `react-expert` | official baselines, Vercel ecosystem, curated catalogs | Keep framework skill focused on state/rendering boundaries, not generic frontend styling. |
| `nextjs-developer` | official baselines, Vercel ecosystem, curated catalogs | Route-level rendering and cache decisions deserve their own focused sidecar. |
| `tailwind-patterns` | curated catalogs, aggregate libraries | Tailwind skills work best when token/composition guidance is separate from general frontend design. |
| `frontend-design` | anthropic examples, curated catalogs, aggregate libraries | Public design skills frequently become too aesthetic-only; keep decision logic and state design explicit. |
| `design-system-builder` | Vercel ecosystem, curated catalogs, aggregate libraries | Variant/tokens/docs should stay separated from one-off product UI advice. |
| `web-perf` | official baselines, Vercel ecosystem, curated catalogs | Strongest public pattern is measurement-first, then targeted remediation. |
| `nodejs-best-practices` | official baselines, smaller implementation libraries, aggregate libraries | Runtime shape, observability, and reliability controls should be explicit, not folded into generic backend text. |
| `nestjs-expert` | curated catalogs, aggregate libraries | Nest-specific module/DTO/guard guidance should stay separate from generic Node advice. |
| `fastapi-expert` | curated catalogs, aggregate libraries | Async correctness and Pydantic boundary design are the main reasons to keep a separate FastAPI skill. |
| `graphql-architect` | official baselines, curated catalogs, aggregate libraries | GraphQL skills are stronger when schema/resolver/nullability guidance is separated from REST contract work. |
| `architecture-designer` | official baselines, curated catalogs, aggregate libraries | System tradeoffs work better as a concise planning skill with one tactical checklist sidecar. |
| `microservices-architect` | curated catalogs, aggregate libraries | Public repos often over-romanticize microservices; keep this skill explicitly anti-premature-distribution. |
| `database-skills` | official baselines, curated catalogs, aggregate libraries, installers | Hub routing is valuable when paired with narrow engine specialists rather than one monolith. |
| `database-design` | official baselines, curated catalogs, aggregate libraries | Schema and migration planning should be independent from tuning guidance. |
| `database-optimizer` | official baselines, curated catalogs, aggregate libraries | Public performance skills are better when they are evidence-first and rollback-aware. |
| `postgres` | curated catalogs, aggregate libraries | Postgres-specific skills are worth keeping separate because JSONB, extensions, locks, and migration posture change answers materially. |
| `mysql` | curated catalogs, aggregate libraries | InnoDB, Online DDL, and replication-aware rollout justify a dedicated MySQL specialist. |
| `sqlite` | curated catalogs, aggregate libraries | Local-first, WAL, and embedded constraints justify a dedicated SQLite specialist. |
| `mongodb` | curated catalogs, aggregate libraries | Embed-vs-reference and shard-key tradeoffs repeatedly show up as their own document-database pattern. |
| `redis` | curated catalogs, aggregate libraries | Cache semantics, TTLs, and eviction are distinct enough from general data modeling to keep separate. |
| `supabase` | Vercel/community catalogs, aggregate libraries | Managed-platform coupling, RLS, and auth justify a platform-aware database specialist. |
| `vitess` | aggregate libraries, portability/install repos | Vitess examples are rarer, so the skill should stay narrow and operationally explicit. |
| `neki` | official announcement plus public ecosystem signal | Keep it explicit that this skill is newer and more assumption-sensitive than the older engines. |

## New interesting skill candidates surfaced by public repos

- `playwright-e2e`
- `frontend-code-review`
- `auth-architect`
- `docs-updater`
- `pr-creator`
- `github-workflow`
- `debugging-strategies`
- `mcp-builder`
- `webapp-testing`
- `drizzle-expert`

## Policy taken from the broader public pass

- Do not copy popular public skills directly into Foundry canonicals.
- Use curated and aggregate repos for taxonomy and demand sensing, not wording.
- Use installer/portability repos to shape packaging assumptions.
- Keep restored specialist skills small at the root and deeper in sidecars.
