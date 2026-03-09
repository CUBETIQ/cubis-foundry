# Database Wave Benchmarks

Generated: 2026-03-09T03:59:28.443Z

## Current Canonicals

### architecture-designer
- Benchmarks: `anthropics/skills`, `openai/skills`, `vercel-labs/agent-skills`, `agentskills/agentskills`, `Jeffallan/claude-skills`, `VoltAgent/awesome-agent-skills`, `aj-geddes/claude-code-bmad-skills`
- Decision: Keep as the primary high-level architecture skill and preserve the product-first, anti-overengineering stance.
- Packaging next: Keep root plus system tradeoff checklist; add templates only if ADR output becomes standardized.

### database-design
- Benchmarks: `anthropics/skills`, `openai/skills`, `vercel-labs/agent-skills`, `agentskills/agentskills`, `Jeffallan/claude-skills`, `Microck/ordinary-claude-skills`, `numman-ali/openskills`, `rknall/claude-skills`
- Decision: Keep schema and migration planning separate from performance tuning and engine selection.
- Packaging next: Keep root plus schema-migration checklist; add templates only if migration planning output becomes standardized.

### database-optimizer
- Benchmarks: `anthropics/skills`, `openai/skills`, `vercel-labs/agent-skills`, `agentskills/agentskills`, `Jeffallan/claude-skills`, `Microck/ordinary-claude-skills`, `numman-ali/openskills`, `rknall/claude-skills`
- Decision: Keep this as the evidence-first tuning specialist and maintain the strict before/after measurement stance.
- Packaging next: Keep root plus query-triage checklist; no scripts until a standard measurement workflow is worth encoding.

### database-skills
- Benchmarks: `anthropics/skills`, `openai/skills`, `vercel-labs/agent-skills`, `agentskills/agentskills`, `Jeffallan/claude-skills`, `Microck/ordinary-claude-skills`, `numman-ali/openskills`, `rknall/claude-skills`, `MoizIbnYousaf/Ai-Agent-Skills`, `gotalab/skillport`, `vercel-labs/skills`, `mhattingpete/claude-skills-marketplace`
- Decision: Keep as the routing hub and preserve the current hub-plus-specialist structure instead of collapsing engines or tuning back into one mega-skill.
- Packaging next: Keep root plus routing reference; no scripts until engine discovery or validation can be standardized.

### microservices-architect
- Benchmarks: `Jeffallan/claude-skills`, `VoltAgent/awesome-agent-skills`, `aj-geddes/claude-code-bmad-skills`
- Decision: Keep as the distributed-boundary specialist and preserve the anti-premature-microservices stance.
- Packaging next: Keep root plus service-boundary checklist; no scripts or templates yet.

### mongodb
- Benchmarks: `Jeffallan/claude-skills`, `Microck/ordinary-claude-skills`, `numman-ali/openskills`, `rknall/claude-skills`, `VoltAgent/awesome-agent-skills`, `travisvn/awesome-claude-skills`
- Decision: Keep as the document-database specialist and maintain a clear embed-vs-reference and aggregation-focused boundary.
- Packaging next: Keep root plus MongoDB checklist; no scripts.

### mysql
- Benchmarks: `Jeffallan/claude-skills`, `Microck/ordinary-claude-skills`, `numman-ali/openskills`, `rknall/claude-skills`, `VoltAgent/awesome-agent-skills`, `travisvn/awesome-claude-skills`
- Decision: Keep as the MySQL specialist and preserve the InnoDB plus operational rollout boundary.
- Packaging next: Keep root plus MySQL checklist; no scripts.

### neki
- Benchmarks: `VoltAgent/awesome-agent-skills`, `Jeffallan/claude-skills`
- Decision: Keep as experimental, narrow, and assumption-sensitive until the public corpus around Neki-like sharded Postgres patterns becomes stronger.
- Packaging next: Keep root plus Neki checklist only.

### postgres
- Benchmarks: `Jeffallan/claude-skills`, `Microck/ordinary-claude-skills`, `numman-ali/openskills`, `rknall/claude-skills`, `VoltAgent/awesome-agent-skills`, `travisvn/awesome-claude-skills`
- Decision: Keep as the Postgres specialist and preserve the plain-relational-first posture.
- Packaging next: Keep root plus Postgres checklist; no scripts.

### redis
- Benchmarks: `Jeffallan/claude-skills`, `Microck/ordinary-claude-skills`, `numman-ali/openskills`, `rknall/claude-skills`, `VoltAgent/awesome-agent-skills`, `travisvn/awesome-claude-skills`
- Decision: Keep as the cache and in-memory coordination specialist instead of folding it into general database guidance.
- Packaging next: Keep root plus Redis checklist; no scripts.

### sqlite
- Benchmarks: `Jeffallan/claude-skills`, `Microck/ordinary-claude-skills`, `numman-ali/openskills`, `rknall/claude-skills`, `VoltAgent/awesome-agent-skills`, `travisvn/awesome-claude-skills`
- Decision: Keep as the local-first and embedded database specialist.
- Packaging next: Keep root plus SQLite checklist; no scripts.

### supabase
- Benchmarks: `vercel-labs/agent-skills`, `Jeffallan/claude-skills`, `VoltAgent/awesome-agent-skills`
- Decision: Keep as the platform-aware Postgres specialist and preserve a clear split from plain Postgres guidance.
- Packaging next: Keep root plus Supabase checklist; no scripts.

### vitess
- Benchmarks: `Jeffallan/claude-skills`, `Microck/ordinary-claude-skills`, `numman-ali/openskills`, `rknall/claude-skills`, `MoizIbnYousaf/Ai-Agent-Skills`, `gotalab/skillport`, `vercel-labs/skills`, `mhattingpete/claude-skills-marketplace`, `VoltAgent/awesome-agent-skills`
- Decision: Keep as the sharded-MySQL specialist and preserve the explicit shard-key and routing focus.
- Packaging next: Keep root plus Vitess checklist; no scripts.


## Candidate Follow-ons

- `clickhouse-analytics`: Analytics and event-query workloads appear often enough to justify a separate warehouse-style specialist if the corpus keeps recurring. Benchmarks: `Jeffallan/claude-skills`, `VoltAgent/awesome-agent-skills`, `skillmatic-ai/awesome-agent-skills`.
- `elasticsearch-opensearch`: Search-first data systems recur separately from OLTP databases and need their own indexing, relevance, and ingest boundaries. Benchmarks: `Jeffallan/claude-skills`, `VoltAgent/awesome-agent-skills`, `github/awesome-copilot`.
- `kafka-streams`: Event streaming and log-based data-flow skills recur separately from database design and should stay their own concern if promoted later. Benchmarks: `Jeffallan/claude-skills`, `VoltAgent/awesome-agent-skills`, `github/awesome-copilot`.
- `pgvector-rag`: Database-native vector retrieval and hybrid search show up often enough to justify a future specialist separate from generic Postgres or RAG guidance. Benchmarks: `vercel-labs/agent-skills`, `Jeffallan/claude-skills`, `github/awesome-copilot`.
