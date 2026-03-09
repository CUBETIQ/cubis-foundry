export const DISCOVERY_QUERIES = [
  "site:github.com \"claude-skills\" github programming repo",
  "site:github.com \"awesome agent skills\" github",
  "site:github.com \"agent skills\" github repo react nextjs postgres",
  "site:github.com \"google genai skills\" github repo",
  "site:github.com \"claude skills marketplace\" github",
  "site:github.com \"ai agent skills\" github repo coding frameworks databases",
];

export const GITHUB_DISCOVERY_QUERIES = [
  "topic:agent-skills",
  "\"agent skills\" in:name,description,readme",
  "\"claude skills\" in:name,description,readme",
  "\"mcp\" \"skill\" in:name,description,readme",
  "\"database\" \"skill\" in:name,description,readme",
];

export const DIRECT_WEB_SOURCES = [
  {
    id: "github-topic-agent-skills",
    url: "https://github.com/topics/agent-skills",
    sourceKind: "topic-index",
    sourceGroup: "curated-discovery",
    platformTargets: ["multi-agent"],
    useFor: ["discovery", "trend-check", "top-repo-harvest"],
    taxonomySignals: ["directory", "discovery", "coding", "automation"],
    mappedOutcome: "packaging_signal_only",
    mapsToSkills: ["skill-creator", "deep-research"],
    manualNotes:
      "Dynamic topic directory for harvesting the top 100 relevant public repos. Use for breadth and trend detection, not canonical wording.",
  },
  {
    id: "agentailor-top-agent-skills-2026",
    url: "https://blog.agentailor.com/posts/top-agent-skills-for-agent-builders-2026",
    sourceKind: "blog",
    sourceGroup: "curated-discovery",
    platformTargets: ["multi-agent"],
    useFor: ["agent-builder-taxonomy", "priority-ranking"],
    taxonomySignals: ["prompting", "evaluation", "mcp", "docs", "research"],
    mappedOutcome: "strengthen_existing",
    mapsToSkills: [
      "prompt-engineer",
      "skill-creator",
      "mcp-builder",
      "agentic-eval",
      "openai-docs",
    ],
    manualNotes:
      "Strong blog-level prioritization signal for agent-builder skills. Good for ranking and naming, not for canonical wording.",
  },
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
  {
    id: "github/awesome-copilot",
    url: "https://github.com/github/awesome-copilot",
    repoClass: "awesome-list",
    sourceGroup: "curated-discovery",
    platformTargets: ["copilot"],
    useFor: ["discovery", "agent-builder-taxonomy", "copilot-packaging"],
    taxonomySignals: ["copilot", "agents", "skills", "evaluation", "automation"],
    manualNotes:
      "High-signal list for Copilot-native agents and skills, especially evaluation and repo-aware automation patterns.",
  },
  {
    id: "trailofbits/skills",
    url: "https://github.com/trailofbits/skills",
    repoClass: "public-implementation",
    sourceGroup: "community-library",
    platformTargets: ["claude", "multi-agent"],
    useFor: ["security-review", "skill-quality", "narrow-specialists"],
    taxonomySignals: ["security", "audit", "research", "workflow"],
    manualNotes:
      "Security-heavy skill pack useful for quality and bounded-specialist patterns rather than broad coding coverage.",
  },
  {
    id: "antfu/skills",
    url: "https://github.com/antfu/skills",
    repoClass: "public-implementation",
    sourceGroup: "community-library",
    platformTargets: ["claude", "multi-agent"],
    useFor: ["coding-specialists", "quality", "workflow-shape"],
    taxonomySignals: ["coding", "tooling", "automation", "frontend"],
    manualNotes:
      "Smaller curated personal library with high-quality coding and tooling specialists.",
  },
  {
    id: "refly-ai/refly",
    url: "https://github.com/refly-ai/refly",
    repoClass: "public-implementation",
    sourceGroup: "workflow-and-planning",
    platformTargets: ["multi-agent"],
    useFor: ["skill-builder-patterns", "workflow-authoring", "portability"],
    taxonomySignals: ["builder", "workflow", "skills", "multi-agent"],
    manualNotes:
      "Builder-oriented project that treats skills as workflow infrastructure, useful for authoring ergonomics and portability.",
  },
  {
    id: "agentailor/create-mcp-server",
    url: "https://github.com/agentailor/create-mcp-server",
    repoClass: "public-implementation",
    sourceGroup: "workflow-and-planning",
    platformTargets: ["multi-agent", "mcp"],
    useFor: ["mcp-builder", "scaffolding", "agent-builder-taxonomy"],
    taxonomySignals: ["mcp", "scaffold", "typescript", "python", "automation"],
    manualNotes:
      "Strong benchmark for MCP server scaffolding and practical builder workflows. Use as input to mcp-builder, not as a standalone Foundry canonical.",
  },
  {
    id: "hoodini/ai-agents-skills",
    url: "https://github.com/hoodini/ai-agents-skills",
    repoClass: "aggregate-library",
    sourceGroup: "community-library",
    platformTargets: ["multi-agent"],
    useFor: ["taxonomy", "missing-family-detection", "packaging-scan"],
    taxonomySignals: ["coding", "automation", "workflow", "skills"],
    manualNotes:
      "Community library requested explicitly by the user. Good for breadth and category detection even if individual skill quality varies.",
  },
];

export const NEW_SKILL_CANDIDATES = [
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
  {
    id: "clickhouse-analytics",
    cluster: "architecture-databases",
    priority: "medium",
    benchmarkRepoIds: [
      "Jeffallan/claude-skills",
      "VoltAgent/awesome-agent-skills",
      "skillmatic-ai/awesome-agent-skills",
    ],
    rationale:
      "Analytics and event-query workloads appear often enough to justify a separate warehouse-style specialist if the corpus keeps recurring.",
  },
  {
    id: "elasticsearch-opensearch",
    cluster: "architecture-databases",
    priority: "medium",
    benchmarkRepoIds: [
      "Jeffallan/claude-skills",
      "VoltAgent/awesome-agent-skills",
      "github/awesome-copilot",
    ],
    rationale:
      "Search-first data systems recur separately from OLTP databases and need their own indexing, relevance, and ingest boundaries.",
  },
  {
    id: "kafka-streams",
    cluster: "architecture-databases",
    priority: "medium",
    benchmarkRepoIds: [
      "Jeffallan/claude-skills",
      "VoltAgent/awesome-agent-skills",
      "github/awesome-copilot",
    ],
    rationale:
      "Event streaming and log-based data-flow skills recur separately from database design and should stay their own concern if promoted later.",
  },
  {
    id: "pgvector-rag",
    cluster: "architecture-databases",
    priority: "medium",
    benchmarkRepoIds: [
      "vercel-labs/agent-skills",
      "Jeffallan/claude-skills",
      "github/awesome-copilot",
    ],
    rationale:
      "Database-native vector retrieval and hybrid search show up often enough to justify a future specialist separate from generic Postgres or RAG guidance.",
  },
];

export const CLUSTER_REWRITE_PRIORITIES = [
  {
    cluster: "api-and-frontend",
    priority: 1,
    rationale:
      "Frontend and API design skills still have the highest overlap with public coding skill ecosystems and need clear benchmark ordering.",
  },
  {
    cluster: "backend-frameworks",
    priority: 2,
    rationale:
      "Highest overlap with public coding skill ecosystems and most likely to benefit from broader benchmark tightening.",
  },
  {
    cluster: "architecture-databases",
    priority: 3,
    rationale:
      "Current shapes are good, but public breadth can still improve engine, platform, and architecture decision boundaries.",
  },
  {
    cluster: "languages",
    priority: 4,
    rationale:
      "Language packs are stable, but the public corpus can still identify which need deeper sidecars or should remain intentionally lean.",
  },
  {
    cluster: "workflow-and-automation",
    priority: 5,
    rationale:
      "Broader public workflow and installer ecosystems are likely to surface the most net-new candidate skills here.",
  },
  {
    cluster: "agent-builder",
    priority: 6,
    rationale:
      "Direct user-requested builder skills need explicit rewrite specs and stronger public-source mapping than the generic workflow cluster currently provides.",
  },
  {
    cluster: "testing-security-review",
    priority: 7,
    rationale:
      "Testing, review, and security skills remain important, but the current user request prioritizes database and builder waves first.",
  },
  {
    cluster: "support-and-noncoding",
    priority: 8,
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

export const DIRECT_SOURCE_REPO_IDS = [
  ...PUBLIC_REPO_SEEDS.map((seed) => seed.id),
  "skillmatic-ai/awesome-agent-skills",
  "heilcheng/awesome-agent-skills",
  "agentailor/create-mcp-server",
  "hoodini/ai-agents-skills",
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
  firebase: {
    action: "add",
    cluster: "architecture-databases",
    benchmarkRepoIds: [
      "Jeffallan/claude-skills",
      "VoltAgent/awesome-agent-skills",
      "github/awesome-copilot",
    ],
    decision:
      "Add as the Firebase platform specialist and keep it separate from generic database and generic backend guidance.",
    keep:
      "Firestore or Realtime Database choice, security rules, indexes, auth, storage, functions, hosting, and emulator workflow as the core trigger surface.",
    change:
      "Keep the boundary tight around Firebase platform decisions and avoid broadening into generic GCP or generic mobile architecture.",
    packagingNext:
      "Root plus Firebase platform-routing checklist and rules/indexes reference; no scripts in the first pass.",
    publicSignals: [
      "Public agent-skill libraries repeatedly treat Firebase as a platform workflow, not just a database driver.",
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
  "drizzle-expert": {
    action: "add",
    cluster: "architecture-databases",
    benchmarkRepoIds: [
      "vercel-labs/agent-skills",
      "travisvn/awesome-claude-skills",
      "Microck/ordinary-claude-skills",
      "github/awesome-copilot",
    ],
    decision:
      "Add as the TypeScript database access-layer specialist and keep it separate from both plain engine guidance and generic TypeScript.",
    keep:
      "Schema-as-code, relations, drizzle-kit migrations, typed SQL, runtime pairing, and serverless or edge tradeoffs as the core trigger surface.",
    change:
      "Keep engine choice separate by pairing Drizzle with the narrow engine or platform skill rather than broadening this into a giant database manual.",
    packagingNext:
      "Root plus schema-layout and runtime-pairing references; no scripts in the first pass.",
    publicSignals: [
      "Typed TypeScript DB stacks recur often enough across public libraries that Drizzle merits its own narrow specialist.",
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
  "debugging-strategies": {
    action: "keep-and-tighten",
    cluster: "testing-security-review",
    benchmarkRepoIds: ["Jeffallan/claude-skills", "Microck/ordinary-claude-skills", "VoltAgent/awesome-agent-skills"],
    decision:
      "Keep as the cross-stack debugging methodology skill and preserve a strict reproduce, isolate, verify boundary separate from language and framework implementation.",
    keep:
      "Evidence-first debugging, minimal reproductions, instrumentation discipline, and regression-proof closure as the core surface.",
    change:
      "Recheck public debugging and bug-hunt libraries for missing CI-only failure, flaky test, and release-regression guidance without drifting into observability setup.",
    packagingNext:
      "Keep root plus reproduce/isolate/verify checklist; add templates only if bug-report or repro capture outputs become standardized.",
    publicSignals: [
      "Public skill ecosystems repeatedly separate debugging method from language implementation details, especially for flaky or cross-layer failures.",
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
  "frontend-code-review": {
    action: "keep-and-tighten",
    cluster: "testing-security-review",
    benchmarkRepoIds: ["vercel-labs/agent-skills", "Jeffallan/claude-skills", "VoltAgent/awesome-agent-skills"],
    decision:
      "Keep as the UI-review specialist and preserve a clear separation from implementation, generic architecture, and browser automation work.",
    keep:
      "Accessibility, interaction states, responsive regressions, render-cost review, and component API quality as the core trigger surface.",
    change:
      "Recheck public frontend review and UX audit families for whether accessibility-only or design-system-review adjacencies deserve future companion skills rather than broadening this one.",
    packagingNext:
      "Keep root plus UI regression checklist; no scripts until review outputs need a standard template.",
    publicSignals: [
      "Public repos repeatedly separate frontend review from generic code review because UI state, semantics, and accessibility failures need different checks.",
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
  "playwright-e2e": {
    action: "keep-and-tighten",
    cluster: "testing-security-review",
    benchmarkRepoIds: ["vercel-labs/agent-skills", "travisvn/awesome-claude-skills", "VoltAgent/awesome-agent-skills"],
    decision:
      "Keep as the browser-automation specialist and maintain a clear split from general web testing strategy and generic frontend review.",
    keep:
      "Locator quality, trace-driven debugging, auth setup, flaky browser triage, and CI artifact discipline as the core boundary.",
    change:
      "Recheck public browser-testing libraries for gaps around component testing, visual diffs, or setup-project patterns without broadening beyond Playwright-specific work.",
    packagingNext:
      "Keep root plus locator/trace checklist; add templates or scripts only if Foundry standardizes browser test scaffolds later.",
    publicSignals: [
      "Public coding-skill repos repeatedly justify a distinct Playwright specialist because selector choice, traces, and CI flakes change the implementation guidance.",
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
  "agentic-eval": {
    action: "add",
    cluster: "agent-builder",
    benchmarkRepoIds: ["github/awesome-copilot", "VoltAgent/awesome-agent-skills", "anthropics/skills"],
    decision:
      "Add as the evaluation-method specialist and keep it separate from debugging, testing, and generic prompt tuning.",
    keep:
      "Self-critique loops, evaluator-optimizer pipelines, rubric design, judge-model caveats, and regression evidence as the core boundary.",
    change:
      "Keep this focused on evaluation design and evidence quality rather than absorbing broad QA or benchmark infrastructure work.",
    packagingNext:
      "Root plus rubric-and-regression references; no scripts until Foundry standardizes a reusable eval scaffold.",
    publicSignals: [
      "Agent-builder ecosystems repeatedly separate evaluation design from implementation work because prototype quality and production quality diverge fast.",
    ],
  },
  "deep-research": {
    action: "add",
    cluster: "agent-builder",
    benchmarkRepoIds: ["Jeffallan/claude-skills", "VoltAgent/awesome-agent-skills", "heilcheng/awesome-agent-skills"],
    decision:
      "Add as the research-method specialist and keep it separate from domain-specific implementation or documentation writing.",
    keep:
      "Multi-round search, gap finding, corroboration, contradiction handling, and source-quality ranking as the core trigger surface.",
    change:
      "Keep it procedural and evidence-heavy rather than turning it into a generic writing or browser-usage skill.",
    packagingNext:
      "Root plus search-loop and source-ranking references; no scripts in the first pass.",
    publicSignals: [
      "Community skill packs increasingly rely on deep-research workflows as a reusable foundational capability rather than ad hoc browsing.",
    ],
  },
  "mcp-builder": {
    action: "add",
    cluster: "agent-builder",
    benchmarkRepoIds: ["anthropics/skills", "agentailor/create-mcp-server", "cnemri/google-genai-skills"],
    decision:
      "Add as the canonical MCP server builder skill and keep it focused on server design, transport, schemas, testing, and evaluation.",
    keep:
      "Tool design, resource patterns, transport choices, auth, testing, and Python-vs-TypeScript implementation tradeoffs as the core surface.",
    change:
      "Keep direct scaffolding examples and evaluation guidance in references rather than bloating the root.",
    packagingNext:
      "Root plus transport/testing references; scripts later only if Foundry standardizes MCP scaffolding.",
    publicSignals: [
      "MCP builder guidance now recurs across Anthropic, community repos, and builder tools strongly enough to justify a first-class Foundry canonical.",
    ],
  },
  "openai-docs": {
    action: "add",
    cluster: "agent-builder",
    benchmarkRepoIds: ["openai/skills", "agentailor/create-mcp-server", "github/awesome-copilot"],
    decision:
      "Add as the live-doc retrieval specialist for OpenAI platform work and keep it separate from generic API design and generic web research.",
    keep:
      "Official-doc lookup, citation discipline, stale-knowledge fallback, and version-sensitive OpenAI guidance as the core trigger surface.",
    change:
      "Keep it scoped to OpenAI documentation and live-source verification rather than broadening into a universal docs-search skill.",
    packagingNext:
      "Root plus official-source and citation reference; no scripts in the first pass.",
    publicSignals: [
      "Live docs retrieval is increasingly treated as a distinct capability because model memory alone is not enough for fast-moving platform guidance.",
    ],
  },
  "prompt-engineer": {
    action: "add",
    cluster: "agent-builder",
    benchmarkRepoIds: ["heilcheng/awesome-agent-skills", "agentailor-top-agent-skills-2026", "github/awesome-copilot"],
    decision:
      "Add as the prompt and instruction quality specialist and keep it separate from generic writing, evaluation, and skill authoring.",
    keep:
      "Ambiguity detection, missing format constraints, prompt injection review, and instruction robustness as the core trigger surface.",
    change:
      "Keep it grounded in operational prompt quality and failure prevention instead of broadening into speculative prompt theory.",
    packagingNext:
      "Root plus prompt-review checklist and injection-hygiene reference; no scripts in the first pass.",
    publicSignals: [
      "Prompt quality review keeps recurring as a foundational builder skill because weak instructions break otherwise solid agent systems.",
    ],
  },
  "skill-creator": {
    action: "keep-and-expand",
    cluster: "agent-builder",
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
  "webapp-testing": {
    action: "keep-and-tighten",
    cluster: "testing-security-review",
    benchmarkRepoIds: [...OFFICIAL_PACKAGING_REPOS, "vercel-labs/agent-skills", "VoltAgent/awesome-agent-skills", "travisvn/awesome-claude-skills"],
    decision:
      "Keep as the web verification strategy skill and preserve a clear split between test-layer selection and tool-specific browser automation.",
    keep:
      "Test-depth choice, browser-vs-integration tradeoffs, accessibility coverage, and release-confidence framing as the core surface.",
    change:
      "Recheck public web-testing libraries for whether contract-testing or visual-regression adjacencies deserve separate companions rather than broadening this skill into a giant QA catalog.",
    packagingNext:
      "Keep root plus browser/API/state checklist; no scripts until the project wants a stable Foundry-owned test scaffold.",
    publicSignals: [
      "Public repos often separate browser automation from broader web-testing strategy, which keeps both skills sharper and easier to trigger correctly.",
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
