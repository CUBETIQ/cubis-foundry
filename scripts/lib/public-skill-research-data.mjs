export const DISCOVERY_QUERIES = [
  "site:github.com \"claude-skills\" github programming repo",
  "site:github.com \"awesome agent skills\" github",
  "site:github.com \"agent skills\" github repo react nextjs postgres",
  "site:github.com \"google genai skills\" github repo",
  "site:github.com \"claude skills marketplace\" github",
  "site:github.com \"ai agent skills\" github repo coding frameworks databases",
];

export const PUBLIC_REPO_SEEDS = [
  {
    id: "anthropics/skills",
    url: "https://github.com/anthropics/skills",
    repoClass: "official",
    sourceGroup: "official-baseline",
    platformTargets: ["claude"],
    useFor: ["packaging", "trigger-quality", "skill-authoring"],
    taxonomySignals: ["coding", "automation", "research", "writing"],
    manualNotes:
      "Primary baseline for compact roots, selective sidecars, and skill-creator style lifecycle guidance.",
  },
  {
    id: "openai/skills",
    url: "https://github.com/openai/skills",
    repoClass: "official",
    sourceGroup: "official-baseline",
    platformTargets: ["codex"],
    useFor: ["catalog-discipline", "tiering", "packaging"],
    taxonomySignals: ["coding", "automation", "system", "curated"],
    manualNotes:
      "Primary baseline for system/curated/experimental catalog discipline and Codex-oriented packaging.",
  },
  {
    id: "vercel-labs/agent-skills",
    url: "https://github.com/vercel-labs/agent-skills",
    repoClass: "public-implementation",
    sourceGroup: "coding-specialists",
    platformTargets: ["multi-agent"],
    useFor: ["coding-specialists", "framework-scope", "production-guardrails"],
    taxonomySignals: ["frontend", "backend", "frameworks", "deployment"],
    manualNotes:
      "High-signal coding specialists that help keep framework/runtime skills narrow and practical.",
  },
  {
    id: "agentskills/agentskills",
    url: "https://github.com/agentskills/agentskills",
    repoClass: "open-standard",
    sourceGroup: "spec-and-portability",
    platformTargets: ["multi-agent"],
    useFor: ["portability", "metadata", "packaging"],
    taxonomySignals: ["spec", "registry", "interoperability"],
    manualNotes:
      "Useful for portable packaging assumptions and metadata shape, not for canonical wording.",
  },
  {
    id: "travisvn/awesome-claude-skills",
    url: "https://github.com/travisvn/awesome-claude-skills",
    repoClass: "awesome-list",
    sourceGroup: "curated-discovery",
    platformTargets: ["claude"],
    useFor: ["discovery", "taxonomy", "demand-signals"],
    taxonomySignals: ["coding", "design", "writing", "research", "automation"],
    manualNotes:
      "High-signal curated inventory of official and community Claude skill repos. Good for breadth and naming patterns.",
  },
  {
    id: "Jeffallan/claude-skills",
    url: "https://github.com/Jeffallan/claude-skills",
    repoClass: "aggregate-library",
    sourceGroup: "community-library",
    platformTargets: ["claude"],
    useFor: ["taxonomy", "category-breadth", "missing-family-detection"],
    taxonomySignals: ["coding", "business", "design", "research", "product", "automation"],
    manualNotes:
      "Large community library with many categories. Valuable for category breadth and spotting missing Foundry families.",
  },
  {
    id: "VoltAgent/awesome-agent-skills",
    url: "https://github.com/VoltAgent/awesome-agent-skills",
    repoClass: "awesome-list",
    sourceGroup: "curated-discovery",
    platformTargets: ["multi-agent"],
    useFor: ["discovery", "ecosystem-breadth", "cross-platform-demand"],
    taxonomySignals: ["coding", "automation", "security", "testing", "docs", "product"],
    manualNotes:
      "Very broad cross-agent view. Good for demand sensing and surfacing families outside Claude/Codex-only ecosystems.",
  },
  {
    id: "Microck/ordinary-claude-skills",
    url: "https://github.com/Microck/ordinary-claude-skills",
    repoClass: "aggregate-library",
    sourceGroup: "community-library",
    platformTargets: ["claude"],
    useFor: ["taxonomy", "breadth", "naming-collisions"],
    taxonomySignals: ["coding", "automation", "docs", "product", "analysis"],
    manualNotes:
      "Large local-first aggregate library that helps identify common skill names and overlap problems.",
  },
  {
    id: "MoizIbnYousaf/Ai-Agent-Skills",
    url: "https://github.com/MoizIbnYousaf/Ai-Agent-Skills",
    repoClass: "installer-registry",
    sourceGroup: "distribution-and-portability",
    platformTargets: ["multi-agent"],
    useFor: ["distribution", "install-flow", "taxonomy"],
    taxonomySignals: ["registry", "install", "coding", "automation"],
    manualNotes:
      "Useful for install/distribution ergonomics and category breadth. Do not treat as canonical wording source.",
  },
  {
    id: "gotalab/skillport",
    url: "https://github.com/gotalab/skillport",
    repoClass: "installer-registry",
    sourceGroup: "distribution-and-portability",
    platformTargets: ["multi-agent"],
    useFor: ["manage-once-serve-anywhere", "portability", "registry-shape"],
    taxonomySignals: ["registry", "mcp", "portability", "automation"],
    manualNotes:
      "Strong signal for multi-agent portability and central skill management patterns.",
  },
  {
    id: "cnemri/google-genai-skills",
    url: "https://github.com/cnemri/google-genai-skills",
    repoClass: "public-implementation",
    sourceGroup: "google-oriented",
    platformTargets: ["gemini", "google-genai"],
    useFor: ["google-platform-patterns", "packaging"],
    taxonomySignals: ["coding", "automation", "gemini", "google"],
    manualNotes:
      "Useful for Google/Gemini packaging and skill-family portability beyond Claude/Codex.",
  },
  {
    id: "fvadicamo/dev-agent-skills",
    url: "https://github.com/fvadicamo/dev-agent-skills",
    repoClass: "public-implementation",
    sourceGroup: "coding-specialists",
    platformTargets: ["multi-agent"],
    useFor: ["workflow-examples", "coding-specialists", "skill-authoring"],
    taxonomySignals: ["coding", "git", "github", "authoring", "automation"],
    manualNotes:
      "Smaller library with practical development-workflow skills and skill-authoring examples.",
  },
  {
    id: "vercel-labs/skills",
    url: "https://github.com/vercel-labs/skills",
    repoClass: "installer-registry",
    sourceGroup: "distribution-and-portability",
    platformTargets: ["multi-agent"],
    useFor: ["distribution", "sync", "install-ergonomics"],
    taxonomySignals: ["registry", "install", "coding", "tooling"],
    manualNotes:
      "Useful for install/sync assumptions and portable packaging expectations.",
  },
  {
    id: "skillmatic-ai/awesome-agent-skills",
    url: "https://github.com/skillmatic-ai/awesome-agent-skills",
    repoClass: "awesome-list",
    sourceGroup: "curated-discovery",
    platformTargets: ["multi-agent"],
    useFor: ["discovery", "breadth", "new-candidate-finding"],
    taxonomySignals: ["coding", "research", "design", "product", "automation"],
    manualNotes:
      "Another discovery-focused awesome list that helps validate whether candidate families recur across lists.",
  },
  {
    id: "heilcheng/awesome-agent-skills",
    url: "https://github.com/heilcheng/awesome-agent-skills",
    repoClass: "awesome-list",
    sourceGroup: "curated-discovery",
    platformTargets: ["multi-agent"],
    useFor: ["discovery", "cross-platform-breadth", "category-check"],
    taxonomySignals: ["claude", "codex", "cline", "gemini", "automation"],
    manualNotes:
      "Good cross-platform list for checking whether a skill family is ecosystem-wide rather than tool-local.",
  },
  {
    id: "mhattingpete/claude-skills-marketplace",
    url: "https://github.com/mhattingpete/claude-skills-marketplace",
    repoClass: "marketplace",
    sourceGroup: "distribution-and-portability",
    platformTargets: ["claude"],
    useFor: ["marketplace-signal", "demand", "discovery"],
    taxonomySignals: ["marketplace", "coding", "automation", "discovery"],
    manualNotes:
      "Useful for understanding what skill families are marketed and surfaced to end users.",
  },
  {
    id: "rknall/claude-skills",
    url: "https://github.com/rknall/claude-skills",
    repoClass: "public-implementation",
    sourceGroup: "community-library",
    platformTargets: ["claude"],
    useFor: ["community-patterns", "skill-structure"],
    taxonomySignals: ["coding", "automation", "authoring"],
    manualNotes:
      "Community package set that helps check how smaller authors structure reusable skills.",
  },
  {
    id: "aj-geddes/claude-code-bmad-skills",
    url: "https://github.com/aj-geddes/claude-code-bmad-skills",
    repoClass: "public-implementation",
    sourceGroup: "workflow-and-planning",
    platformTargets: ["claude"],
    useFor: ["workflow-shape", "planning-patterns", "agent-orchestration"],
    taxonomySignals: ["planning", "bmad", "workflow", "automation"],
    manualNotes:
      "Structured workflow/planning library useful for orchestration, planning, and agent workflow skill design.",
  },
  {
    id: "numman-ali/openskills",
    url: "https://github.com/numman-ali/openskills",
    repoClass: "aggregate-library",
    sourceGroup: "community-library",
    platformTargets: ["multi-agent"],
    useFor: ["breadth", "naming-patterns", "missing-family-detection"],
    taxonomySignals: ["coding", "automation", "docs", "analysis", "tooling"],
    manualNotes:
      "Broad library useful for category spread and repeated naming patterns across public skill packs.",
  },
];

export const NEW_SKILL_CANDIDATES = [
  {
    id: "playwright-e2e",
    cluster: "testing-security-review",
    priority: "high",
    benchmarkRepoIds: [
      "vercel-labs/agent-skills",
      "VoltAgent/awesome-agent-skills",
      "travisvn/awesome-claude-skills",
    ],
    rationale:
      "Repeated public demand around browser automation and validation-heavy coding work justifies a dedicated E2E skill.",
  },
  {
    id: "frontend-code-review",
    cluster: "testing-security-review",
    priority: "high",
    benchmarkRepoIds: [
      "Jeffallan/claude-skills",
      "VoltAgent/awesome-agent-skills",
      "Microck/ordinary-claude-skills",
    ],
    rationale:
      "Public skill ecosystems repeatedly separate UI and UX review from implementation and generic code review.",
  },
  {
    id: "drizzle-expert",
    cluster: "architecture-databases",
    priority: "medium",
    benchmarkRepoIds: [
      "vercel-labs/agent-skills",
      "travisvn/awesome-claude-skills",
      "Microck/ordinary-claude-skills",
    ],
    rationale:
      "Typed TypeScript database stacks recur often enough that an ORM-specific specialist may be warranted.",
  },
  {
    id: "github-workflow",
    cluster: "workflow-and-automation",
    priority: "medium",
    benchmarkRepoIds: [
      "fvadicamo/dev-agent-skills",
      "VoltAgent/awesome-agent-skills",
      "travisvn/awesome-claude-skills",
    ],
    rationale:
      "GitHub automation, PR flow, branch hygiene, and CI interactions show up frequently in public dev-skill libraries.",
  },
  {
    id: "pr-creator",
    cluster: "workflow-and-automation",
    priority: "medium",
    benchmarkRepoIds: [
      "fvadicamo/dev-agent-skills",
      "mhattingpete/claude-skills-marketplace",
      "VoltAgent/awesome-agent-skills",
    ],
    rationale:
      "PR drafting and review-prep appear often enough to justify a narrow workflow skill if GitHub automation becomes first-class.",
  },
  {
    id: "debugging-strategies",
    cluster: "testing-security-review",
    priority: "medium",
    benchmarkRepoIds: [
      "Jeffallan/claude-skills",
      "Microck/ordinary-claude-skills",
      "VoltAgent/awesome-agent-skills",
    ],
    rationale:
      "Debugging is broad enough to deserve a methodology-focused skill separate from language or framework implementation skills.",
  },
  {
    id: "webapp-testing",
    cluster: "testing-security-review",
    priority: "medium",
    benchmarkRepoIds: [
      "vercel-labs/agent-skills",
      "VoltAgent/awesome-agent-skills",
      "travisvn/awesome-claude-skills",
    ],
    rationale:
      "Public repos frequently separate browser validation from generic QA or unit-test guidance.",
  },
  {
    id: "mcp-builder",
    cluster: "workflow-and-automation",
    priority: "medium",
    benchmarkRepoIds: [
      "cnemri/google-genai-skills",
      "VoltAgent/awesome-agent-skills",
      "Jeffallan/claude-skills",
    ],
    rationale:
      "MCP and agent-tooling construction appears repeatedly enough to justify a first-class Foundry skill family.",
  },
  {
    id: "docs-updater",
    cluster: "support-and-noncoding",
    priority: "medium",
    benchmarkRepoIds: [
      "Jeffallan/claude-skills",
      "Microck/ordinary-claude-skills",
      "travisvn/awesome-claude-skills",
    ],
    rationale:
      "Documentation upkeep is a recurring support family in public skill libraries and maps well to workflow-driven maintenance.",
  },
  {
    id: "research-librarian",
    cluster: "support-and-noncoding",
    priority: "medium",
    benchmarkRepoIds: [
      "Jeffallan/claude-skills",
      "VoltAgent/awesome-agent-skills",
      "Microck/ordinary-claude-skills",
    ],
    rationale:
      "Research and evidence synthesis appear across many public skill packs and can complement coding and architecture work.",
  },
];

export const CLUSTER_REWRITE_PRIORITIES = [
  {
    cluster: "backend-frameworks",
    priority: 1,
    rationale:
      "Highest overlap with public coding skill ecosystems and most likely to benefit from broader benchmark tightening.",
  },
  {
    cluster: "architecture-databases",
    priority: 2,
    rationale:
      "Current shapes are good, but public breadth can still improve engine, platform, and architecture decision boundaries.",
  },
  {
    cluster: "languages",
    priority: 3,
    rationale:
      "Language packs are stable, but the public corpus can still identify which need deeper sidecars or should remain intentionally lean.",
  },
  {
    cluster: "workflow-and-automation",
    priority: 4,
    rationale:
      "Broader public workflow and installer ecosystems are likely to surface the most net-new candidate skills here.",
  },
  {
    cluster: "support-and-noncoding",
    priority: 5,
    rationale:
      "Everything-scope research should still surface non-coding support families even if implementation happens later.",
  },
];

export const OFFICIAL_PACKAGING_REPOS = [
  "anthropics/skills",
  "openai/skills",
  "vercel-labs/agent-skills",
  "agentskills/agentskills",
];

export const AWESOME_REPOS = [
  "travisvn/awesome-claude-skills",
  "VoltAgent/awesome-agent-skills",
  "skillmatic-ai/awesome-agent-skills",
  "heilcheng/awesome-agent-skills",
];

export const AGGREGATE_REPOS = [
  "Jeffallan/claude-skills",
  "Microck/ordinary-claude-skills",
  "numman-ali/openskills",
  "rknall/claude-skills",
];

export const DISTRIBUTION_REPOS = [
  "MoizIbnYousaf/Ai-Agent-Skills",
  "gotalab/skillport",
  "vercel-labs/skills",
  "mhattingpete/claude-skills-marketplace",
];

function languageSkillSpec(extra = {}) {
  return {
    action: "keep",
    cluster: "languages",
    benchmarkRepoIds: [
      ...OFFICIAL_PACKAGING_REPOS,
      ...AWESOME_REPOS,
      ...AGGREGATE_REPOS,
    ],
    decision:
      "Keep this as a language-level canonical and resist framework bleed. Use the broader public corpus to decide whether targeted references or adjacent companion skills are warranted.",
    keep:
      "Retain the current language-first boundary and keep framework/runtime specifics outside the root language skill.",
    change:
      "Recheck public prevalence, add or refine references only when repeated tactical depth is clearly justified, and avoid turning language skills into giant ecosystem catalogs.",
    packagingNext:
      "Root-first; add references selectively for the highest-demand language families or where the current skill is too compressed.",
    publicSignals: [
      "Language skills remain common across public ecosystems, but the stronger public pattern is to keep them lean and let framework or domain specialists handle depth.",
    ],
    ...extra,
  };
}

export { languageSkillSpec };

export const CURRENT_SKILL_REWRITE_SPECS = {
  "api-designer": {
    action: "keep-and-tighten",
    cluster: "api-and-frontend",
    benchmarkRepoIds: [...OFFICIAL_PACKAGING_REPOS, "Jeffallan/claude-skills", "VoltAgent/awesome-agent-skills"],
    decision:
      "Keep as the canonical contract-first skill and continue separating it from framework and database implementation concerns.",
    keep:
      "Resource modeling, versioning, pagination, idempotency, and error semantics as the primary trigger boundary.",
    change:
      "Recheck public API-oriented skill families for missing edge cases such as event APIs, long-running operations, and public-vs-internal contract split guidance.",
    packagingNext:
      "Keep the current root plus checklist reference; add more references only if contract examples or async API guidance become necessary.",
    publicSignals: [
      "Strong public pattern for keeping contract design separate from framework implementation.",
    ],
  },
  "api-patterns": {
    action: "keep-and-tighten",
    cluster: "api-and-frontend",
    benchmarkRepoIds: [...OFFICIAL_PACKAGING_REPOS, "travisvn/awesome-claude-skills", "VoltAgent/awesome-agent-skills"],
    decision:
      "Keep as the pattern-choice companion skill and continue separating REST-vs-GraphQL-vs-RPC tradeoffs from endpoint implementation.",
    keep:
      "Pattern selection, response vocabulary, auth shape, and versioning strategy as the core surface.",
    change:
      "Recheck public API libraries for whether webhooks, streaming, or event-driven interfaces deserve a distinct adjacent candidate skill rather than broadening this one.",
    packagingNext:
      "Keep root plus pattern checklist; no scripts or templates yet.",
    publicSignals: [
      "Public repos repeatedly split protocol or transport choice from framework-specific code.",
    ],
  },
  "architecture-designer": {
    action: "keep-and-tighten",
    cluster: "architecture-databases",
    benchmarkRepoIds: [...OFFICIAL_PACKAGING_REPOS, "Jeffallan/claude-skills", "VoltAgent/awesome-agent-skills", "aj-geddes/claude-code-bmad-skills"],
    decision:
      "Keep as the primary high-level architecture skill and preserve the product-first, anti-overengineering stance.",
    keep:
      "Boundary, tradeoff, and ADR-style decision framing as the core skill boundary.",
    change:
      "Recheck public system-design and planning libraries for gaps around rollout posture, observability-by-design, and infrastructure coupling tradeoffs.",
    packagingNext:
      "Keep root plus system tradeoff checklist; add templates only if ADR output becomes standardized.",
    publicSignals: [
      "Public system-design skills are often too vague or too diagram-heavy; stronger examples stay decision-focused.",
    ],
  },
  "auth-architect": {
    action: "keep-and-tighten",
    cluster: "backend-frameworks",
    benchmarkRepoIds: ["vercel-labs/agent-skills", "Jeffallan/claude-skills", "VoltAgent/awesome-agent-skills"],
    decision:
      "Keep as the auth and policy specialist and preserve a clear split from generic security review, generic backend implementation, and API-contract-only work.",
    keep:
      "Sessions, tokens, OAuth or OIDC, passkeys, RBAC or ABAC, tenant isolation, and service-to-service auth as the core trigger surface.",
    change:
      "Recheck public auth-heavy skill families for gaps around account recovery, webhook verification, and managed identity-provider platform tradeoffs without broadening into generic security review.",
    packagingNext:
      "Keep root plus session or token policy checklist; add templates only if auth-flow review outputs become standardized.",
    publicSignals: [
      "Auth consistently reappears across backend and security skill libraries as a distinct decision surface rather than a footnote inside framework or security-general skills.",
    ],
  },
  "database-skills": {
    action: "keep-and-tighten",
    cluster: "architecture-databases",
    benchmarkRepoIds: [...OFFICIAL_PACKAGING_REPOS, ...AGGREGATE_REPOS, ...DISTRIBUTION_REPOS],
    decision:
      "Keep as the routing hub and preserve the current hub-plus-specialist structure instead of collapsing engines or tuning back into one mega-skill.",
    keep:
      "Engine routing, schema-vs-tuning triage, and migration-risk framing at the hub level.",
    change:
      "Recheck public database skill libraries for missing managed-database, vector, or data-access companion families before broadening the hub itself.",
    packagingNext:
      "Keep root plus routing reference; no scripts until engine discovery or validation can be standardized.",
    publicSignals: [
      "The better public pattern is a hub plus narrow engine or concern specialists rather than one giant database manual.",
    ],
  },
  "database-design": {
    action: "keep-and-tighten",
    cluster: "architecture-databases",
    benchmarkRepoIds: [...OFFICIAL_PACKAGING_REPOS, ...AGGREGATE_REPOS],
    decision:
      "Keep schema and migration planning separate from performance tuning and engine selection.",
    keep:
      "Entities, keys, indexes, pagination, backfills, and rollback as the core trigger surface.",
    change:
      "Recheck public libraries for whether local-first, event-sourced, or document-heavy modeling patterns justify more sidecar depth.",
    packagingNext:
      "Keep root plus schema-migration checklist; add templates only if migration planning output becomes standardized.",
    publicSignals: [
      "Public repositories that mix design and tuning guidance tend to become broad and noisy.",
    ],
  },
  "database-optimizer": {
    action: "keep-and-tighten",
    cluster: "architecture-databases",
    benchmarkRepoIds: [...OFFICIAL_PACKAGING_REPOS, ...AGGREGATE_REPOS],
    decision:
      "Keep this as the evidence-first tuning specialist and maintain the strict before/after measurement stance.",
    keep:
      "Plans, waits, contention, index tradeoffs, and rollback-aware tuning as the core boundary.",
    change:
      "Recheck public performance skill libraries for whether lock-triage, query-shape, and config-tuning references should be split further.",
    packagingNext:
      "Keep root plus query-triage checklist; no scripts until a standard measurement workflow is worth encoding.",
    publicSignals: [
      "Public performance skills are strongest when they stay evidence-first and rollback-aware.",
    ],
  },
  "design-system-builder": {
    action: "keep-and-tighten",
    cluster: "api-and-frontend",
    benchmarkRepoIds: ["vercel-labs/agent-skills", "travisvn/awesome-claude-skills", "VoltAgent/awesome-agent-skills"],
    decision:
      "Keep as the reusable-component and token API skill; do not let it absorb one-off product UI guidance.",
    keep:
      "System-vs-product boundary, token-driven APIs, variants, theming, and docs as the core boundary.",
    change:
      "Recheck public component-system skills for missing slot/composition or accessibility contract guidance.",
    packagingNext:
      "Keep root plus component API checklist; templates may be added later if component spec outputs become standardized.",
    publicSignals: [
      "Public UI-system skills degrade when they collapse reusable-system concerns and app-specific UI decisions together.",
    ],
  },
  "fastapi-expert": {
    action: "keep-and-tighten",
    cluster: "backend-frameworks",
    benchmarkRepoIds: ["vercel-labs/agent-skills", "Jeffallan/claude-skills", "VoltAgent/awesome-agent-skills"],
    decision:
      "Keep as the async Python service specialist and preserve the Pydantic-v2 plus boundary-first framing.",
    keep:
      "FastAPI-specific async correctness, Pydantic boundaries, dependencies, and OpenAPI hygiene as the core trigger surface.",
    change:
      "Recheck public FastAPI libraries for missing background-job, lifespan, or auth-depth references without broadening into generic Python service guidance.",
    packagingNext:
      "Keep root plus async/Pydantic checklist; add templates only if service skeleton outputs become standard.",
    publicSignals: [
      "FastAPI skills are most valuable when they stay clearly separate from generic Python and generic API design.",
    ],
  },
  "frontend-design": {
    action: "keep-and-tighten",
    cluster: "api-and-frontend",
    benchmarkRepoIds: ["Jeffallan/claude-skills", "travisvn/awesome-claude-skills", "VoltAgent/awesome-agent-skills"],
    decision:
      "Keep as a UI decision-making skill, not a style bundle or aesthetic prompt pack.",
    keep:
      "Hierarchy, typography, color, motion, and interaction-state decision logic.",
    change:
      "Recheck public design skills for whether accessibility critique, state-flow review, and design review deserve adjacent specialists such as frontend-code-review.",
    packagingNext:
      "Keep root plus hierarchy/state checklist; no scripts or templates yet.",
    publicSignals: [
      "Public design skills often drift into vague aesthetic advice; the stronger pattern is decision and state clarity.",
    ],
  },
  "graphql-architect": {
    action: "keep-and-tighten",
    cluster: "backend-frameworks",
    benchmarkRepoIds: [...OFFICIAL_PACKAGING_REPOS, "Jeffallan/claude-skills", "VoltAgent/awesome-agent-skills"],
    decision:
      "Keep as the graph-specific API specialist and maintain a clear separation from REST contract and generic backend framework guidance.",
    keep:
      "Schema shape, nullability, resolver boundaries, batching, auth, and federation tradeoffs as the core trigger surface.",
    change:
      "Recheck public graph-focused skill libraries for whether subscriptions or GraphQL security deserve deeper sidecars or adjacent candidates.",
    packagingNext:
      "Keep root plus schema/resolver checklist; no scripts yet.",
    publicSignals: [
      "Public graph skills are strongest when they explicitly separate schema architecture from generic API design.",
    ],
  },
  "microservices-architect": {
    action: "keep-and-tighten",
    cluster: "architecture-databases",
    benchmarkRepoIds: ["Jeffallan/claude-skills", "VoltAgent/awesome-agent-skills", "aj-geddes/claude-code-bmad-skills"],
    decision:
      "Keep as the distributed-boundary specialist and preserve the anti-premature-microservices stance.",
    keep:
      "Service seams, sync-vs-async boundaries, reliability, and distributed tradeoffs as the core surface.",
    change:
      "Recheck public workflow and architecture libraries for whether event-driven design or API gateway concerns justify adjacent specialists rather than broadening this skill.",
    packagingNext:
      "Keep root plus service-boundary checklist; no scripts or templates yet.",
    publicSignals: [
      "Public microservice skills often romanticize distribution; stronger patterns stay ownership- and failure-mode-driven.",
    ],
  },
  mongodb: {
    action: "keep-and-tighten",
    cluster: "architecture-databases",
    benchmarkRepoIds: [...AGGREGATE_REPOS, "VoltAgent/awesome-agent-skills", "travisvn/awesome-claude-skills"],
    decision:
      "Keep as the document-database specialist and maintain a clear embed-vs-reference and aggregation-focused boundary.",
    keep:
      "Document shape, aggregation, validation, indexing, and shard-key tradeoffs as the core trigger surface.",
    change:
      "Recheck public document-db skill families for whether vector, Atlas-specific, or event-source document guidance should stay separate.",
    packagingNext:
      "Keep root plus MongoDB checklist; no scripts.",
    publicSignals: [
      "Document-database skills justify their own surface when they stay centered on document-boundary and shard-key tradeoffs.",
    ],
  },
  mysql: {
    action: "keep-and-tighten",
    cluster: "architecture-databases",
    benchmarkRepoIds: [...AGGREGATE_REPOS, "VoltAgent/awesome-agent-skills", "travisvn/awesome-claude-skills"],
    decision:
      "Keep as the MySQL specialist and preserve the InnoDB plus operational rollout boundary.",
    keep:
      "InnoDB behavior, indexes, Online DDL, replication-aware rollouts, and transaction tradeoffs.",
    change:
      "Recheck public MySQL and managed-MySQL families for gaps around hosted variants or sharded adjacencies.",
    packagingNext:
      "Keep root plus MySQL checklist; no scripts.",
    publicSignals: [
      "Public data libraries repeatedly justify a separate MySQL specialist where operational topology changes the answer.",
    ],
  },
  neki: {
    action: "experimental-keep",
    cluster: "architecture-databases",
    benchmarkRepoIds: ["VoltAgent/awesome-agent-skills", "Jeffallan/claude-skills"],
    decision:
      "Keep as experimental, narrow, and assumption-sensitive until the public corpus around Neki-like sharded Postgres patterns becomes stronger.",
    keep:
      "Sharded Postgres assumptions, routing, and uncertainty handling as the core boundary.",
    change:
      "Refresh this skill against public material more frequently than the others and avoid broadening it without stronger evidence.",
    packagingNext:
      "Keep root plus Neki checklist only.",
    publicSignals: [
      "Public corpus support for Neki-specific advice is still limited compared with more mature database families.",
    ],
  },
  "nestjs-expert": {
    action: "keep-and-tighten",
    cluster: "backend-frameworks",
    benchmarkRepoIds: ["vercel-labs/agent-skills", "Jeffallan/claude-skills", "VoltAgent/awesome-agent-skills"],
    decision:
      "Keep as the Nest-specific backend specialist and preserve a clear split from generic Node and generic API skills.",
    keep:
      "Modules, DI, DTOs, guards, interceptors, and transport-vs-domain boundaries as the core surface.",
    change:
      "Recheck public Nest and TypeScript backend libraries for missing monorepo, messaging, or auth-depth references.",
    packagingNext:
      "Keep root plus module/DTO/guard checklist; no scripts yet.",
    publicSignals: [
      "Nest-specific patterns are common enough in public ecosystems to justify a dedicated specialist.",
    ],
  },
  "nextjs-developer": {
    action: "keep-and-tighten",
    cluster: "api-and-frontend",
    benchmarkRepoIds: [...OFFICIAL_PACKAGING_REPOS, "vercel-labs/agent-skills", "travisvn/awesome-claude-skills", "VoltAgent/awesome-agent-skills"],
    decision:
      "Keep as the Next.js framework specialist and preserve route-level rendering plus cache decisions as the core boundary.",
    keep:
      "App Router, RSC, Server Actions, caching, SEO, and route-level runtime behavior.",
    change:
      "Recheck public Next-specific libraries for missing partial prerendering, streaming, or deployment-path references without absorbing general React advice.",
    packagingNext:
      "Keep root plus App Router/cache playbook; add templates only if route-spec outputs become repeatable.",
    publicSignals: [
      "Vercel and community ecosystems strongly justify a dedicated Next framework skill rather than folding Next into generic React.",
    ],
  },
  "nodejs-best-practices": {
    action: "keep-and-tighten",
    cluster: "backend-frameworks",
    benchmarkRepoIds: ["vercel-labs/agent-skills", "fvadicamo/dev-agent-skills", "VoltAgent/awesome-agent-skills"],
    decision:
      "Keep as the Node runtime specialist and preserve explicit runtime and reliability boundaries.",
    keep:
      "Runtime choice, reliability controls, event-loop safety, graceful shutdown, and operational posture.",
    change:
      "Recheck public runtime-oriented skill libraries for missing worker, queue, or edge/serverless sidecar guidance.",
    packagingNext:
      "Keep root plus runtime/reliability checklist; scripts later only if service validation becomes standardized.",
    publicSignals: [
      "Stronger public Node skills focus on runtime and reliability, not generic backend advice alone.",
    ],
  },
  postgres: {
    action: "keep-and-tighten",
    cluster: "architecture-databases",
    benchmarkRepoIds: [...AGGREGATE_REPOS, "VoltAgent/awesome-agent-skills", "travisvn/awesome-claude-skills"],
    decision:
      "Keep as the Postgres specialist and preserve the plain-relational-first posture.",
    keep:
      "Indexes, JSONB, extensions, locking, migration safety, and operational tradeoffs.",
    change:
      "Recheck public Postgres-focused families for gaps around pgvector, branching, or managed-Postgres platform adjacencies.",
    packagingNext:
      "Keep root plus Postgres checklist; no scripts.",
    publicSignals: [
      "Postgres-specific operational and feature tradeoffs change answers enough to justify a dedicated specialist.",
    ],
  },
  "react-expert": {
    action: "keep-and-tighten",
    cluster: "api-and-frontend",
    benchmarkRepoIds: [...OFFICIAL_PACKAGING_REPOS, "vercel-labs/agent-skills", "Jeffallan/claude-skills", "VoltAgent/awesome-agent-skills"],
    decision:
      "Keep as the React runtime specialist and preserve the framework-agnostic boundary.",
    keep:
      "Component boundaries, state placement, effects, rendering cost, and interaction correctness.",
    change:
      "Recheck public React families for missing compiler, form-action, or Server Component adjacency guidance without turning this into a Next skill.",
    packagingNext:
      "Keep root plus rendering/state checklist; no scripts.",
    publicSignals: [
      "Public React skills are strongest when they stay runtime-focused instead of merging design, framework, and tooling into one pack.",
    ],
  },
  redis: {
    action: "keep-and-tighten",
    cluster: "architecture-databases",
    benchmarkRepoIds: [...AGGREGATE_REPOS, "VoltAgent/awesome-agent-skills", "travisvn/awesome-claude-skills"],
    decision:
      "Keep as the cache and in-memory coordination specialist instead of folding it into general database guidance.",
    keep:
      "TTL, invalidation, queues, rate limits, eviction, persistence, and hot-key risk.",
    change:
      "Recheck public Redis families for missing stream, distributed-lock, or cache-coherence sidecars.",
    packagingNext:
      "Keep root plus Redis checklist; no scripts.",
    publicSignals: [
      "Public libraries consistently treat Redis as a distinct concern because cache and coordination semantics differ from primary data stores.",
    ],
  },
  "skill-creator": {
    action: "keep-and-expand",
    cluster: "workflow-and-automation",
    benchmarkRepoIds: [...OFFICIAL_PACKAGING_REPOS, "Jeffallan/claude-skills", "fvadicamo/dev-agent-skills", ...DISTRIBUTION_REPOS],
    decision:
      "Keep as the canonical authoring skill, but deepen its research-refresh and cross-platform packaging playbook as the broader public corpus grows.",
    keep:
      "Canonical-source-first packaging, sidecar discipline, mirror regeneration, and no third-party copying.",
    change:
      "Add a repeatable public-research refresh workflow, corpus review guidance, and clearer rules for when a new skill warrants scripts, templates, or adjacent companion skills.",
    packagingNext:
      "Keep root plus references and scripts; consider adding a reusable research-template or scaffold template once the new corpus is stable.",
    publicSignals: [
      "Public ecosystems repeatedly need a skill-authoring or installer surface, but quality varies widely and reinforces the need for a stricter Foundry-owned creator skill.",
    ],
  },
  sqlite: {
    action: "keep-and-tighten",
    cluster: "architecture-databases",
    benchmarkRepoIds: [...AGGREGATE_REPOS, "VoltAgent/awesome-agent-skills", "travisvn/awesome-claude-skills"],
    decision:
      "Keep as the local-first and embedded database specialist.",
    keep:
      "WAL, concurrency, local-first deployment, embedded constraints, and migration posture.",
    change:
      "Recheck public SQLite and Turso/libSQL-oriented families for whether sync or offline-first sidecars deserve more depth.",
    packagingNext:
      "Keep root plus SQLite checklist; no scripts.",
    publicSignals: [
      "Local-first and embedded constraints are distinct enough that SQLite benefits from a dedicated specialist.",
    ],
  },
  supabase: {
    action: "keep-and-tighten",
    cluster: "architecture-databases",
    benchmarkRepoIds: ["vercel-labs/agent-skills", "Jeffallan/claude-skills", "VoltAgent/awesome-agent-skills"],
    decision:
      "Keep as the platform-aware Postgres specialist and preserve a clear split from plain Postgres guidance.",
    keep:
      "RLS, auth, storage, platform coupling, and managed rollout constraints.",
    change:
      "Recheck public Supabase and platform-coupled skills for missing branching, realtime, or edge-function depth.",
    packagingNext:
      "Keep root plus Supabase checklist; no scripts.",
    publicSignals: [
      "Managed-platform database skills repeatedly justify their own surface where platform policy and auth change the answer.",
    ],
  },
  "tailwind-patterns": {
    action: "keep-and-tighten",
    cluster: "api-and-frontend",
    benchmarkRepoIds: ["vercel-labs/agent-skills", "Jeffallan/claude-skills", "VoltAgent/awesome-agent-skills"],
    decision:
      "Keep as the styling-system specialist and preserve a clear split from visual design and framework architecture.",
    keep:
      "Token setup, composition, container queries, and class ergonomics as the core surface.",
    change:
      "Recheck public Tailwind skill families for whether design-token sync or component-extraction references need more depth.",
    packagingNext:
      "Keep root plus token/composition checklist; no scripts.",
    publicSignals: [
      "Public CSS/Tailwind skills are most useful when they separate system hygiene from visual-direction work.",
    ],
  },
  vitess: {
    action: "keep-and-tighten",
    cluster: "architecture-databases",
    benchmarkRepoIds: [...AGGREGATE_REPOS, ...DISTRIBUTION_REPOS, "VoltAgent/awesome-agent-skills"],
    decision:
      "Keep as the sharded-MySQL specialist and preserve the explicit shard-key and routing focus.",
    keep:
      "Shard keys, vindexes, Online DDL, resharding, and routing constraints.",
    change:
      "Recheck public sharded-data and platform libraries for whether query-routing or resharding references need more depth.",
    packagingNext:
      "Keep root plus Vitess checklist; no scripts.",
    publicSignals: [
      "Even though examples are rarer, the operational surface is distinct enough that Vitess should stay separate.",
    ],
  },
  "web-perf": {
    action: "keep-and-tighten",
    cluster: "api-and-frontend",
    benchmarkRepoIds: [...OFFICIAL_PACKAGING_REPOS, "vercel-labs/agent-skills", "VoltAgent/awesome-agent-skills"],
    decision:
      "Keep as the browser-performance specialist and preserve a strict measurement-first boundary.",
    keep:
      "CWV, bundle/network/render triage, and framework-aware performance tradeoffs.",
    change:
      "Recheck public performance libraries for whether lab-vs-field, profiling, or server/bundle split references need more depth.",
    packagingNext:
      "Keep root plus CWV triage checklist; no scripts.",
    publicSignals: [
      "The strongest public pattern is still measure-first, then targeted remediation with explicit tradeoffs.",
    ],
  },
  "c-pro": languageSkillSpec({
    packagingNext:
      "Keep lean for now; add references only if embedded or systems-specific tactical depth is repeatedly demanded.",
  }),
  "cpp-pro": languageSkillSpec({
    packagingNext:
      "Keep lean for now; consider a later systems or performance checklist if the public corpus shows durable demand.",
  }),
  "csharp-pro": languageSkillSpec({
    packagingNext:
      "Keep root plus current references. Add framework-specific depth only in separate .NET or ASP.NET companions if needed.",
  }),
  "dart-pro": languageSkillSpec({
    packagingNext:
      "Keep lean while mobile-specific depth stays in separate mobile or Flutter-facing families.",
  }),
  "golang-pro": languageSkillSpec({
    packagingNext:
      "Keep root plus current references; consider later service or reliability sidecars only if the public corpus supports them.",
  }),
  "java-pro": languageSkillSpec({
    packagingNext:
      "Keep root plus current references; framework and platform depth should remain separate.",
  }),
  "javascript-pro": languageSkillSpec({
    packagingNext:
      "Keep root plus current references; continue offloading framework depth to React/Next and runtime depth to Node.",
  }),
  "kotlin-pro": languageSkillSpec({
    packagingNext:
      "Keep root plus current references; mobile and backend specifics should remain in separate specialists.",
  }),
  "php-pro": languageSkillSpec({
    packagingNext:
      "Keep lean until framework-specific or ecosystem-specific PHP demand clearly justifies more sidecars.",
  }),
  "python-pro": languageSkillSpec({
    packagingNext:
      "Keep root plus current references; continue pushing service-framework depth into FastAPI and other future companions.",
  }),
  "ruby-pro": languageSkillSpec({
    packagingNext:
      "Keep lean until framework or Rails-specific demand clearly justifies a separate specialist.",
  }),
  "rust-pro": languageSkillSpec({
    packagingNext:
      "Keep root plus current references; avoid mixing async-service and low-level systems depth unless public demand proves it worthwhile.",
  }),
  "swift-pro": languageSkillSpec({
    packagingNext:
      "Keep lean until Apple-platform or SwiftUI-specific depth needs its own companion specialist.",
  }),
  "typescript-pro": languageSkillSpec({
    packagingNext:
      "Keep root plus current references; continue offloading framework and API specifics to separate skills.",
  }),
};
