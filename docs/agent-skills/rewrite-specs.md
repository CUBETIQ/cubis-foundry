# Rewrite Specs

Generated: 2026-03-09T03:17:26.129Z

## backend-frameworks

- Priority: 1
- Rationale: Highest overlap with public coding skill ecosystems and most likely to benefit from broader benchmark tightening.

### auth-architect
- Action: `keep-and-tighten`
- Benchmarks: `vercel-labs/agent-skills`, `Jeffallan/claude-skills`, `VoltAgent/awesome-agent-skills`
- Keep: Sessions, tokens, OAuth or OIDC, passkeys, RBAC or ABAC, tenant isolation, and service-to-service auth as the core trigger surface.
- Change: Recheck public auth-heavy skill families for gaps around account recovery, webhook verification, and managed identity-provider platform tradeoffs without broadening into generic security review.
- Packaging next: Keep root plus session or token policy checklist; add templates only if auth-flow review outputs become standardized.
- Current packaging: references=yes, scripts=no, templates=no
- Public signals: Auth consistently reappears across backend and security skill libraries as a distinct decision surface rather than a footnote inside framework or security-general skills.

### fastapi-expert
- Action: `keep-and-tighten`
- Benchmarks: `vercel-labs/agent-skills`, `Jeffallan/claude-skills`, `VoltAgent/awesome-agent-skills`
- Keep: FastAPI-specific async correctness, Pydantic boundaries, dependencies, and OpenAPI hygiene as the core trigger surface.
- Change: Recheck public FastAPI libraries for missing background-job, lifespan, or auth-depth references without broadening into generic Python service guidance.
- Packaging next: Keep root plus async/Pydantic checklist; add templates only if service skeleton outputs become standard.
- Current packaging: references=yes, scripts=no, templates=no
- Public signals: FastAPI skills are most valuable when they stay clearly separate from generic Python and generic API design.

### graphql-architect
- Action: `keep-and-tighten`
- Benchmarks: `anthropics/skills`, `openai/skills`, `vercel-labs/agent-skills`, `agentskills/agentskills`, `Jeffallan/claude-skills`, `VoltAgent/awesome-agent-skills`
- Keep: Schema shape, nullability, resolver boundaries, batching, auth, and federation tradeoffs as the core trigger surface.
- Change: Recheck public graph-focused skill libraries for whether subscriptions or GraphQL security deserve deeper sidecars or adjacent candidates.
- Packaging next: Keep root plus schema/resolver checklist; no scripts yet.
- Current packaging: references=yes, scripts=no, templates=no
- Public signals: Public graph skills are strongest when they explicitly separate schema architecture from generic API design.

### nestjs-expert
- Action: `keep-and-tighten`
- Benchmarks: `vercel-labs/agent-skills`, `Jeffallan/claude-skills`, `VoltAgent/awesome-agent-skills`
- Keep: Modules, DI, DTOs, guards, interceptors, and transport-vs-domain boundaries as the core surface.
- Change: Recheck public Nest and TypeScript backend libraries for missing monorepo, messaging, or auth-depth references.
- Packaging next: Keep root plus module/DTO/guard checklist; no scripts yet.
- Current packaging: references=yes, scripts=no, templates=no
- Public signals: Nest-specific patterns are common enough in public ecosystems to justify a dedicated specialist.

### nodejs-best-practices
- Action: `keep-and-tighten`
- Benchmarks: `vercel-labs/agent-skills`, `fvadicamo/dev-agent-skills`, `VoltAgent/awesome-agent-skills`
- Keep: Runtime choice, reliability controls, event-loop safety, graceful shutdown, and operational posture.
- Change: Recheck public runtime-oriented skill libraries for missing worker, queue, or edge/serverless sidecar guidance.
- Packaging next: Keep root plus runtime/reliability checklist; scripts later only if service validation becomes standardized.
- Current packaging: references=yes, scripts=no, templates=no
- Public signals: Stronger public Node skills focus on runtime and reliability, not generic backend advice alone.



## architecture-databases

- Priority: 2
- Rationale: Current shapes are good, but public breadth can still improve engine, platform, and architecture decision boundaries.

### architecture-designer
- Action: `keep-and-tighten`
- Benchmarks: `anthropics/skills`, `openai/skills`, `vercel-labs/agent-skills`, `agentskills/agentskills`, `Jeffallan/claude-skills`, `VoltAgent/awesome-agent-skills`, `aj-geddes/claude-code-bmad-skills`
- Keep: Boundary, tradeoff, and ADR-style decision framing as the core skill boundary.
- Change: Recheck public system-design and planning libraries for gaps around rollout posture, observability-by-design, and infrastructure coupling tradeoffs.
- Packaging next: Keep root plus system tradeoff checklist; add templates only if ADR output becomes standardized.
- Current packaging: references=yes, scripts=no, templates=no
- Public signals: Public system-design skills are often too vague or too diagram-heavy; stronger examples stay decision-focused.

### database-design
- Action: `keep-and-tighten`
- Benchmarks: `anthropics/skills`, `openai/skills`, `vercel-labs/agent-skills`, `agentskills/agentskills`, `Jeffallan/claude-skills`, `Microck/ordinary-claude-skills`, `numman-ali/openskills`, `rknall/claude-skills`
- Keep: Entities, keys, indexes, pagination, backfills, and rollback as the core trigger surface.
- Change: Recheck public libraries for whether local-first, event-sourced, or document-heavy modeling patterns justify more sidecar depth.
- Packaging next: Keep root plus schema-migration checklist; add templates only if migration planning output becomes standardized.
- Current packaging: references=yes, scripts=no, templates=no
- Public signals: Public repositories that mix design and tuning guidance tend to become broad and noisy.

### database-optimizer
- Action: `keep-and-tighten`
- Benchmarks: `anthropics/skills`, `openai/skills`, `vercel-labs/agent-skills`, `agentskills/agentskills`, `Jeffallan/claude-skills`, `Microck/ordinary-claude-skills`, `numman-ali/openskills`, `rknall/claude-skills`
- Keep: Plans, waits, contention, index tradeoffs, and rollback-aware tuning as the core boundary.
- Change: Recheck public performance skill libraries for whether lock-triage, query-shape, and config-tuning references should be split further.
- Packaging next: Keep root plus query-triage checklist; no scripts until a standard measurement workflow is worth encoding.
- Current packaging: references=yes, scripts=no, templates=no
- Public signals: Public performance skills are strongest when they stay evidence-first and rollback-aware.

### database-skills
- Action: `keep-and-tighten`
- Benchmarks: `anthropics/skills`, `openai/skills`, `vercel-labs/agent-skills`, `agentskills/agentskills`, `Jeffallan/claude-skills`, `Microck/ordinary-claude-skills`, `numman-ali/openskills`, `rknall/claude-skills`, `MoizIbnYousaf/Ai-Agent-Skills`, `gotalab/skillport`, `vercel-labs/skills`, `mhattingpete/claude-skills-marketplace`
- Keep: Engine routing, schema-vs-tuning triage, and migration-risk framing at the hub level.
- Change: Recheck public database skill libraries for missing managed-database, vector, or data-access companion families before broadening the hub itself.
- Packaging next: Keep root plus routing reference; no scripts until engine discovery or validation can be standardized.
- Current packaging: references=yes, scripts=no, templates=no
- Public signals: The better public pattern is a hub plus narrow engine or concern specialists rather than one giant database manual.

### microservices-architect
- Action: `keep-and-tighten`
- Benchmarks: `Jeffallan/claude-skills`, `VoltAgent/awesome-agent-skills`, `aj-geddes/claude-code-bmad-skills`
- Keep: Service seams, sync-vs-async boundaries, reliability, and distributed tradeoffs as the core surface.
- Change: Recheck public workflow and architecture libraries for whether event-driven design or API gateway concerns justify adjacent specialists rather than broadening this skill.
- Packaging next: Keep root plus service-boundary checklist; no scripts or templates yet.
- Current packaging: references=yes, scripts=no, templates=no
- Public signals: Public microservice skills often romanticize distribution; stronger patterns stay ownership- and failure-mode-driven.

### mongodb
- Action: `keep-and-tighten`
- Benchmarks: `Jeffallan/claude-skills`, `Microck/ordinary-claude-skills`, `numman-ali/openskills`, `rknall/claude-skills`, `VoltAgent/awesome-agent-skills`, `travisvn/awesome-claude-skills`
- Keep: Document shape, aggregation, validation, indexing, and shard-key tradeoffs as the core trigger surface.
- Change: Recheck public document-db skill families for whether vector, Atlas-specific, or event-source document guidance should stay separate.
- Packaging next: Keep root plus MongoDB checklist; no scripts.
- Current packaging: references=yes, scripts=no, templates=no
- Public signals: Document-database skills justify their own surface when they stay centered on document-boundary and shard-key tradeoffs.

### mysql
- Action: `keep-and-tighten`
- Benchmarks: `Jeffallan/claude-skills`, `Microck/ordinary-claude-skills`, `numman-ali/openskills`, `rknall/claude-skills`, `VoltAgent/awesome-agent-skills`, `travisvn/awesome-claude-skills`
- Keep: InnoDB behavior, indexes, Online DDL, replication-aware rollouts, and transaction tradeoffs.
- Change: Recheck public MySQL and managed-MySQL families for gaps around hosted variants or sharded adjacencies.
- Packaging next: Keep root plus MySQL checklist; no scripts.
- Current packaging: references=yes, scripts=no, templates=no
- Public signals: Public data libraries repeatedly justify a separate MySQL specialist where operational topology changes the answer.

### neki
- Action: `experimental-keep`
- Benchmarks: `VoltAgent/awesome-agent-skills`, `Jeffallan/claude-skills`
- Keep: Sharded Postgres assumptions, routing, and uncertainty handling as the core boundary.
- Change: Refresh this skill against public material more frequently than the others and avoid broadening it without stronger evidence.
- Packaging next: Keep root plus Neki checklist only.
- Current packaging: references=yes, scripts=no, templates=no
- Public signals: Public corpus support for Neki-specific advice is still limited compared with more mature database families.

### postgres
- Action: `keep-and-tighten`
- Benchmarks: `Jeffallan/claude-skills`, `Microck/ordinary-claude-skills`, `numman-ali/openskills`, `rknall/claude-skills`, `VoltAgent/awesome-agent-skills`, `travisvn/awesome-claude-skills`
- Keep: Indexes, JSONB, extensions, locking, migration safety, and operational tradeoffs.
- Change: Recheck public Postgres-focused families for gaps around pgvector, branching, or managed-Postgres platform adjacencies.
- Packaging next: Keep root plus Postgres checklist; no scripts.
- Current packaging: references=yes, scripts=no, templates=no
- Public signals: Postgres-specific operational and feature tradeoffs change answers enough to justify a dedicated specialist.

### redis
- Action: `keep-and-tighten`
- Benchmarks: `Jeffallan/claude-skills`, `Microck/ordinary-claude-skills`, `numman-ali/openskills`, `rknall/claude-skills`, `VoltAgent/awesome-agent-skills`, `travisvn/awesome-claude-skills`
- Keep: TTL, invalidation, queues, rate limits, eviction, persistence, and hot-key risk.
- Change: Recheck public Redis families for missing stream, distributed-lock, or cache-coherence sidecars.
- Packaging next: Keep root plus Redis checklist; no scripts.
- Current packaging: references=yes, scripts=no, templates=no
- Public signals: Public libraries consistently treat Redis as a distinct concern because cache and coordination semantics differ from primary data stores.

### sqlite
- Action: `keep-and-tighten`
- Benchmarks: `Jeffallan/claude-skills`, `Microck/ordinary-claude-skills`, `numman-ali/openskills`, `rknall/claude-skills`, `VoltAgent/awesome-agent-skills`, `travisvn/awesome-claude-skills`
- Keep: WAL, concurrency, local-first deployment, embedded constraints, and migration posture.
- Change: Recheck public SQLite and Turso/libSQL-oriented families for whether sync or offline-first sidecars deserve more depth.
- Packaging next: Keep root plus SQLite checklist; no scripts.
- Current packaging: references=yes, scripts=no, templates=no
- Public signals: Local-first and embedded constraints are distinct enough that SQLite benefits from a dedicated specialist.

### supabase
- Action: `keep-and-tighten`
- Benchmarks: `vercel-labs/agent-skills`, `Jeffallan/claude-skills`, `VoltAgent/awesome-agent-skills`
- Keep: RLS, auth, storage, platform coupling, and managed rollout constraints.
- Change: Recheck public Supabase and platform-coupled skills for missing branching, realtime, or edge-function depth.
- Packaging next: Keep root plus Supabase checklist; no scripts.
- Current packaging: references=yes, scripts=no, templates=no
- Public signals: Managed-platform database skills repeatedly justify their own surface where platform policy and auth change the answer.

### vitess
- Action: `keep-and-tighten`
- Benchmarks: `Jeffallan/claude-skills`, `Microck/ordinary-claude-skills`, `numman-ali/openskills`, `rknall/claude-skills`, `MoizIbnYousaf/Ai-Agent-Skills`, `gotalab/skillport`, `vercel-labs/skills`, `mhattingpete/claude-skills-marketplace`, `VoltAgent/awesome-agent-skills`
- Keep: Shard keys, vindexes, Online DDL, resharding, and routing constraints.
- Change: Recheck public sharded-data and platform libraries for whether query-routing or resharding references need more depth.
- Packaging next: Keep root plus Vitess checklist; no scripts.
- Current packaging: references=yes, scripts=no, templates=no
- Public signals: Even though examples are rarer, the operational surface is distinct enough that Vitess should stay separate.

### Candidate additions
- `drizzle-expert` (medium): Typed TypeScript database stacks recur often enough that an ORM-specific specialist may be warranted. Benchmarks: `vercel-labs/agent-skills`, `travisvn/awesome-claude-skills`, `Microck/ordinary-claude-skills`.

## languages

- Priority: 3
- Rationale: Language packs are stable, but the public corpus can still identify which need deeper sidecars or should remain intentionally lean.

### c-pro
- Action: `keep`
- Benchmarks: `anthropics/skills`, `openai/skills`, `vercel-labs/agent-skills`, `agentskills/agentskills`, `travisvn/awesome-claude-skills`, `VoltAgent/awesome-agent-skills`, `skillmatic-ai/awesome-agent-skills`, `heilcheng/awesome-agent-skills`, `Jeffallan/claude-skills`, `Microck/ordinary-claude-skills`, `numman-ali/openskills`, `rknall/claude-skills`
- Keep: Retain the current language-first boundary and keep framework/runtime specifics outside the root language skill.
- Change: Recheck public prevalence, add or refine references only when repeated tactical depth is clearly justified, and avoid turning language skills into giant ecosystem catalogs.
- Packaging next: Keep lean for now; add references only if embedded or systems-specific tactical depth is repeatedly demanded.
- Current packaging: references=no, scripts=no, templates=no
- Public signals: Language skills remain common across public ecosystems, but the stronger public pattern is to keep them lean and let framework or domain specialists handle depth.

### cpp-pro
- Action: `keep`
- Benchmarks: `anthropics/skills`, `openai/skills`, `vercel-labs/agent-skills`, `agentskills/agentskills`, `travisvn/awesome-claude-skills`, `VoltAgent/awesome-agent-skills`, `skillmatic-ai/awesome-agent-skills`, `heilcheng/awesome-agent-skills`, `Jeffallan/claude-skills`, `Microck/ordinary-claude-skills`, `numman-ali/openskills`, `rknall/claude-skills`
- Keep: Retain the current language-first boundary and keep framework/runtime specifics outside the root language skill.
- Change: Recheck public prevalence, add or refine references only when repeated tactical depth is clearly justified, and avoid turning language skills into giant ecosystem catalogs.
- Packaging next: Keep lean for now; consider a later systems or performance checklist if the public corpus shows durable demand.
- Current packaging: references=no, scripts=no, templates=no
- Public signals: Language skills remain common across public ecosystems, but the stronger public pattern is to keep them lean and let framework or domain specialists handle depth.

### csharp-pro
- Action: `keep`
- Benchmarks: `anthropics/skills`, `openai/skills`, `vercel-labs/agent-skills`, `agentskills/agentskills`, `travisvn/awesome-claude-skills`, `VoltAgent/awesome-agent-skills`, `skillmatic-ai/awesome-agent-skills`, `heilcheng/awesome-agent-skills`, `Jeffallan/claude-skills`, `Microck/ordinary-claude-skills`, `numman-ali/openskills`, `rknall/claude-skills`
- Keep: Retain the current language-first boundary and keep framework/runtime specifics outside the root language skill.
- Change: Recheck public prevalence, add or refine references only when repeated tactical depth is clearly justified, and avoid turning language skills into giant ecosystem catalogs.
- Packaging next: Keep root plus current references. Add framework-specific depth only in separate .NET or ASP.NET companions if needed.
- Current packaging: references=yes, scripts=no, templates=no
- Public signals: Language skills remain common across public ecosystems, but the stronger public pattern is to keep them lean and let framework or domain specialists handle depth.

### dart-pro
- Action: `keep`
- Benchmarks: `anthropics/skills`, `openai/skills`, `vercel-labs/agent-skills`, `agentskills/agentskills`, `travisvn/awesome-claude-skills`, `VoltAgent/awesome-agent-skills`, `skillmatic-ai/awesome-agent-skills`, `heilcheng/awesome-agent-skills`, `Jeffallan/claude-skills`, `Microck/ordinary-claude-skills`, `numman-ali/openskills`, `rknall/claude-skills`
- Keep: Retain the current language-first boundary and keep framework/runtime specifics outside the root language skill.
- Change: Recheck public prevalence, add or refine references only when repeated tactical depth is clearly justified, and avoid turning language skills into giant ecosystem catalogs.
- Packaging next: Keep lean while mobile-specific depth stays in separate mobile or Flutter-facing families.
- Current packaging: references=no, scripts=no, templates=no
- Public signals: Language skills remain common across public ecosystems, but the stronger public pattern is to keep them lean and let framework or domain specialists handle depth.

### golang-pro
- Action: `keep`
- Benchmarks: `anthropics/skills`, `openai/skills`, `vercel-labs/agent-skills`, `agentskills/agentskills`, `travisvn/awesome-claude-skills`, `VoltAgent/awesome-agent-skills`, `skillmatic-ai/awesome-agent-skills`, `heilcheng/awesome-agent-skills`, `Jeffallan/claude-skills`, `Microck/ordinary-claude-skills`, `numman-ali/openskills`, `rknall/claude-skills`
- Keep: Retain the current language-first boundary and keep framework/runtime specifics outside the root language skill.
- Change: Recheck public prevalence, add or refine references only when repeated tactical depth is clearly justified, and avoid turning language skills into giant ecosystem catalogs.
- Packaging next: Keep root plus current references; consider later service or reliability sidecars only if the public corpus supports them.
- Current packaging: references=yes, scripts=no, templates=no
- Public signals: Language skills remain common across public ecosystems, but the stronger public pattern is to keep them lean and let framework or domain specialists handle depth.

### java-pro
- Action: `keep`
- Benchmarks: `anthropics/skills`, `openai/skills`, `vercel-labs/agent-skills`, `agentskills/agentskills`, `travisvn/awesome-claude-skills`, `VoltAgent/awesome-agent-skills`, `skillmatic-ai/awesome-agent-skills`, `heilcheng/awesome-agent-skills`, `Jeffallan/claude-skills`, `Microck/ordinary-claude-skills`, `numman-ali/openskills`, `rknall/claude-skills`
- Keep: Retain the current language-first boundary and keep framework/runtime specifics outside the root language skill.
- Change: Recheck public prevalence, add or refine references only when repeated tactical depth is clearly justified, and avoid turning language skills into giant ecosystem catalogs.
- Packaging next: Keep root plus current references; framework and platform depth should remain separate.
- Current packaging: references=yes, scripts=no, templates=no
- Public signals: Language skills remain common across public ecosystems, but the stronger public pattern is to keep them lean and let framework or domain specialists handle depth.

### javascript-pro
- Action: `keep`
- Benchmarks: `anthropics/skills`, `openai/skills`, `vercel-labs/agent-skills`, `agentskills/agentskills`, `travisvn/awesome-claude-skills`, `VoltAgent/awesome-agent-skills`, `skillmatic-ai/awesome-agent-skills`, `heilcheng/awesome-agent-skills`, `Jeffallan/claude-skills`, `Microck/ordinary-claude-skills`, `numman-ali/openskills`, `rknall/claude-skills`
- Keep: Retain the current language-first boundary and keep framework/runtime specifics outside the root language skill.
- Change: Recheck public prevalence, add or refine references only when repeated tactical depth is clearly justified, and avoid turning language skills into giant ecosystem catalogs.
- Packaging next: Keep root plus current references; continue offloading framework depth to React/Next and runtime depth to Node.
- Current packaging: references=yes, scripts=no, templates=no
- Public signals: Language skills remain common across public ecosystems, but the stronger public pattern is to keep them lean and let framework or domain specialists handle depth.

### kotlin-pro
- Action: `keep`
- Benchmarks: `anthropics/skills`, `openai/skills`, `vercel-labs/agent-skills`, `agentskills/agentskills`, `travisvn/awesome-claude-skills`, `VoltAgent/awesome-agent-skills`, `skillmatic-ai/awesome-agent-skills`, `heilcheng/awesome-agent-skills`, `Jeffallan/claude-skills`, `Microck/ordinary-claude-skills`, `numman-ali/openskills`, `rknall/claude-skills`
- Keep: Retain the current language-first boundary and keep framework/runtime specifics outside the root language skill.
- Change: Recheck public prevalence, add or refine references only when repeated tactical depth is clearly justified, and avoid turning language skills into giant ecosystem catalogs.
- Packaging next: Keep root plus current references; mobile and backend specifics should remain in separate specialists.
- Current packaging: references=yes, scripts=no, templates=no
- Public signals: Language skills remain common across public ecosystems, but the stronger public pattern is to keep them lean and let framework or domain specialists handle depth.

### php-pro
- Action: `keep`
- Benchmarks: `anthropics/skills`, `openai/skills`, `vercel-labs/agent-skills`, `agentskills/agentskills`, `travisvn/awesome-claude-skills`, `VoltAgent/awesome-agent-skills`, `skillmatic-ai/awesome-agent-skills`, `heilcheng/awesome-agent-skills`, `Jeffallan/claude-skills`, `Microck/ordinary-claude-skills`, `numman-ali/openskills`, `rknall/claude-skills`
- Keep: Retain the current language-first boundary and keep framework/runtime specifics outside the root language skill.
- Change: Recheck public prevalence, add or refine references only when repeated tactical depth is clearly justified, and avoid turning language skills into giant ecosystem catalogs.
- Packaging next: Keep lean until framework-specific or ecosystem-specific PHP demand clearly justifies more sidecars.
- Current packaging: references=no, scripts=no, templates=no
- Public signals: Language skills remain common across public ecosystems, but the stronger public pattern is to keep them lean and let framework or domain specialists handle depth.

### python-pro
- Action: `keep`
- Benchmarks: `anthropics/skills`, `openai/skills`, `vercel-labs/agent-skills`, `agentskills/agentskills`, `travisvn/awesome-claude-skills`, `VoltAgent/awesome-agent-skills`, `skillmatic-ai/awesome-agent-skills`, `heilcheng/awesome-agent-skills`, `Jeffallan/claude-skills`, `Microck/ordinary-claude-skills`, `numman-ali/openskills`, `rknall/claude-skills`
- Keep: Retain the current language-first boundary and keep framework/runtime specifics outside the root language skill.
- Change: Recheck public prevalence, add or refine references only when repeated tactical depth is clearly justified, and avoid turning language skills into giant ecosystem catalogs.
- Packaging next: Keep root plus current references; continue pushing service-framework depth into FastAPI and other future companions.
- Current packaging: references=yes, scripts=no, templates=no
- Public signals: Language skills remain common across public ecosystems, but the stronger public pattern is to keep them lean and let framework or domain specialists handle depth.

### ruby-pro
- Action: `keep`
- Benchmarks: `anthropics/skills`, `openai/skills`, `vercel-labs/agent-skills`, `agentskills/agentskills`, `travisvn/awesome-claude-skills`, `VoltAgent/awesome-agent-skills`, `skillmatic-ai/awesome-agent-skills`, `heilcheng/awesome-agent-skills`, `Jeffallan/claude-skills`, `Microck/ordinary-claude-skills`, `numman-ali/openskills`, `rknall/claude-skills`
- Keep: Retain the current language-first boundary and keep framework/runtime specifics outside the root language skill.
- Change: Recheck public prevalence, add or refine references only when repeated tactical depth is clearly justified, and avoid turning language skills into giant ecosystem catalogs.
- Packaging next: Keep lean until framework or Rails-specific demand clearly justifies a separate specialist.
- Current packaging: references=no, scripts=no, templates=no
- Public signals: Language skills remain common across public ecosystems, but the stronger public pattern is to keep them lean and let framework or domain specialists handle depth.

### rust-pro
- Action: `keep`
- Benchmarks: `anthropics/skills`, `openai/skills`, `vercel-labs/agent-skills`, `agentskills/agentskills`, `travisvn/awesome-claude-skills`, `VoltAgent/awesome-agent-skills`, `skillmatic-ai/awesome-agent-skills`, `heilcheng/awesome-agent-skills`, `Jeffallan/claude-skills`, `Microck/ordinary-claude-skills`, `numman-ali/openskills`, `rknall/claude-skills`
- Keep: Retain the current language-first boundary and keep framework/runtime specifics outside the root language skill.
- Change: Recheck public prevalence, add or refine references only when repeated tactical depth is clearly justified, and avoid turning language skills into giant ecosystem catalogs.
- Packaging next: Keep root plus current references; avoid mixing async-service and low-level systems depth unless public demand proves it worthwhile.
- Current packaging: references=yes, scripts=no, templates=no
- Public signals: Language skills remain common across public ecosystems, but the stronger public pattern is to keep them lean and let framework or domain specialists handle depth.

### swift-pro
- Action: `keep`
- Benchmarks: `anthropics/skills`, `openai/skills`, `vercel-labs/agent-skills`, `agentskills/agentskills`, `travisvn/awesome-claude-skills`, `VoltAgent/awesome-agent-skills`, `skillmatic-ai/awesome-agent-skills`, `heilcheng/awesome-agent-skills`, `Jeffallan/claude-skills`, `Microck/ordinary-claude-skills`, `numman-ali/openskills`, `rknall/claude-skills`
- Keep: Retain the current language-first boundary and keep framework/runtime specifics outside the root language skill.
- Change: Recheck public prevalence, add or refine references only when repeated tactical depth is clearly justified, and avoid turning language skills into giant ecosystem catalogs.
- Packaging next: Keep lean until Apple-platform or SwiftUI-specific depth needs its own companion specialist.
- Current packaging: references=no, scripts=no, templates=no
- Public signals: Language skills remain common across public ecosystems, but the stronger public pattern is to keep them lean and let framework or domain specialists handle depth.

### typescript-pro
- Action: `keep`
- Benchmarks: `anthropics/skills`, `openai/skills`, `vercel-labs/agent-skills`, `agentskills/agentskills`, `travisvn/awesome-claude-skills`, `VoltAgent/awesome-agent-skills`, `skillmatic-ai/awesome-agent-skills`, `heilcheng/awesome-agent-skills`, `Jeffallan/claude-skills`, `Microck/ordinary-claude-skills`, `numman-ali/openskills`, `rknall/claude-skills`
- Keep: Retain the current language-first boundary and keep framework/runtime specifics outside the root language skill.
- Change: Recheck public prevalence, add or refine references only when repeated tactical depth is clearly justified, and avoid turning language skills into giant ecosystem catalogs.
- Packaging next: Keep root plus current references; continue offloading framework and API specifics to separate skills.
- Current packaging: references=yes, scripts=no, templates=no
- Public signals: Language skills remain common across public ecosystems, but the stronger public pattern is to keep them lean and let framework or domain specialists handle depth.



## workflow-and-automation

- Priority: 4
- Rationale: Broader public workflow and installer ecosystems are likely to surface the most net-new candidate skills here.

### skill-creator
- Action: `keep-and-expand`
- Benchmarks: `anthropics/skills`, `openai/skills`, `vercel-labs/agent-skills`, `agentskills/agentskills`, `Jeffallan/claude-skills`, `fvadicamo/dev-agent-skills`, `MoizIbnYousaf/Ai-Agent-Skills`, `gotalab/skillport`, `vercel-labs/skills`, `mhattingpete/claude-skills-marketplace`
- Keep: Canonical-source-first packaging, sidecar discipline, mirror regeneration, and no third-party copying.
- Change: Add a repeatable public-research refresh workflow, corpus review guidance, and clearer rules for when a new skill warrants scripts, templates, or adjacent companion skills.
- Packaging next: Keep root plus references and scripts; consider adding a reusable research-template or scaffold template once the new corpus is stable.
- Current packaging: references=yes, scripts=yes, templates=no
- Public signals: Public ecosystems repeatedly need a skill-authoring or installer surface, but quality varies widely and reinforces the need for a stricter Foundry-owned creator skill.

### Candidate additions
- `github-workflow` (medium): GitHub automation, PR flow, branch hygiene, and CI interactions show up frequently in public dev-skill libraries. Benchmarks: `fvadicamo/dev-agent-skills`, `VoltAgent/awesome-agent-skills`, `travisvn/awesome-claude-skills`.
- `pr-creator` (medium): PR drafting and review-prep appear often enough to justify a narrow workflow skill if GitHub automation becomes first-class. Benchmarks: `fvadicamo/dev-agent-skills`, `mhattingpete/claude-skills-marketplace`, `VoltAgent/awesome-agent-skills`.
- `mcp-builder` (medium): MCP and agent-tooling construction appears repeatedly enough to justify a first-class Foundry skill family. Benchmarks: `cnemri/google-genai-skills`, `VoltAgent/awesome-agent-skills`, `Jeffallan/claude-skills`.

## support-and-noncoding

- Priority: 5
- Rationale: Everything-scope research should still surface non-coding support families even if implementation happens later.


### Candidate additions
- `docs-updater` (medium): Documentation upkeep is a recurring support family in public skill libraries and maps well to workflow-driven maintenance. Benchmarks: `Jeffallan/claude-skills`, `Microck/ordinary-claude-skills`, `travisvn/awesome-claude-skills`.
- `research-librarian` (medium): Research and evidence synthesis appear across many public skill packs and can complement coding and architecture work. Benchmarks: `Jeffallan/claude-skills`, `VoltAgent/awesome-agent-skills`, `Microck/ordinary-claude-skills`.

