const AUDIT_SOURCE_IDS = {
  claude: "claude-audit-ref",
  codex: "codex-audit-ref",
  foundry: "foundry",
};

const AUDITED_REFERENCES = [
  {
    runtime: "claude",
    audit_source_id: AUDIT_SOURCE_IDS.claude,
    audited_commit: "1ac2b97df6199f8f76b3896d28f470ea44a90c25",
    audited_at: "2026-03-17",
    audited_version_or_date: "2026-03-17",
  },
  {
    runtime: "codex",
    audit_source_id: AUDIT_SOURCE_IDS.codex,
    audited_commit: "782a03a2d4eb69d475075cbd6df6c1af4fb35e64",
    audited_at: "2026-03-17",
    audited_version_or_date: "2026-03-17",
  },
];

const ORCHESTRATION_SUBTYPES = [
  {
    id: "command-agent-skill",
    label: "command -> agent -> skill",
    source_repos: [AUDIT_SOURCE_IDS.claude, AUDIT_SOURCE_IDS.foundry],
    canonical_projection:
      "Workflow entrypoint resolves intent, hands off to a specialist agent, loads supporting skills, and validates the outcome.",
  },
  {
    id: "skill-skill",
    label: "skill -> skill",
    source_repos: [AUDIT_SOURCE_IDS.codex],
    canonical_projection:
      "Composable skill pipeline with a typed handoff contract between sequential skills.",
  },
  {
    id: "orchestrator-specialists-validator",
    label: "orchestrator -> specialists -> validator",
    source_repos: [AUDIT_SOURCE_IDS.foundry, AUDIT_SOURCE_IDS.claude, AUDIT_SOURCE_IDS.codex],
    canonical_projection:
      "Control-plane orchestration pattern where an orchestrator delegates to specialists and accepts only validated outputs.",
  },
];

function pattern(
  id,
  category,
  intent,
  sourceRepos,
  canonicalSurface,
  requiredRuntimeCapabilities,
  degradedProjectionPolicy,
  acceptanceContract,
  docsContract,
  testContract,
) {
  return {
    pattern_id: id,
    id,
    category,
    intent,
    source_repos: sourceRepos,
    canonical_surface: canonicalSurface,
    canonical_user_experience: canonicalSurface,
    required_capabilities: requiredRuntimeCapabilities,
    required_runtime_capabilities: requiredRuntimeCapabilities,
    degraded_projection_policy: degradedProjectionPolicy,
    projection_rules: degradedProjectionPolicy,
    acceptance_contract: acceptanceContract,
    docs_contract: docsContract,
    test_contract: testContract,
  };
}

const PATTERN_REGISTRY = [
  pattern(
    "instructions-file",
    "instructions",
    "Expose a root instruction file that Foundry can install and document per runtime.",
    [AUDIT_SOURCE_IDS.claude, AUDIT_SOURCE_IDS.codex],
    "One primary repository instruction file is installed at the runtime's canonical path.",
    ["instruction-file", "project-rules-surface"],
    "If the runtime has multiple rule surfaces, Foundry declares one primary instruction surface and documents additional runtime-owned companions.",
    "Each platform publishes one install target for repository-level instructions.",
    "Document file name, install path, and whether companion rule files also exist.",
    "Generated docs and install metadata must agree on the primary instruction path.",
  ),
  pattern(
    "instructions-hierarchy",
    "instructions",
    "Describe how runtime instruction files layer and override one another.",
    [AUDIT_SOURCE_IDS.claude, AUDIT_SOURCE_IDS.codex],
    "Foundry records load order, precedence, and monorepo behavior for each runtime.",
    ["hierarchical-instruction-loading"],
    "If hierarchy is not fully native, Foundry documents the degraded loading contract and keeps repo rules route-first.",
    "Each platform declares precedence and whether descendant or ancestor loading is native or degraded.",
    "Document load order, precedence, and monorepo notes.",
    "Capability data must contain a support entry for hierarchy on every platform.",
  ),
  pattern(
    "instructions-override",
    "instructions",
    "Support a personal override layer when the runtime allows it.",
    [AUDIT_SOURCE_IDS.codex, AUDIT_SOURCE_IDS.claude],
    "Foundry distinguishes team-shared instructions from personal overrides.",
    ["personal-override-surface"],
    "If no dedicated override file exists, Foundry maps the concept to local user-only settings or documents the limitation.",
    "Every platform declares either a native override surface or a degraded personal-only workaround.",
    "Document override path or degraded substitute.",
    "Validation fails if a platform omits override semantics entirely.",
  ),
  pattern(
    "config-layering",
    "configuration",
    "Model global, project, and invocation-time configuration layers.",
    [AUDIT_SOURCE_IDS.codex, AUDIT_SOURCE_IDS.claude],
    "Foundry emits the user config path, project config path, and one-off override surfaces per runtime.",
    ["global-config", "project-config", "invocation-override"],
    "If the runtime lacks a native project config, Foundry maps project policy into generated rules and install metadata.",
    "Each platform defines user/project/invocation config behavior.",
    "Document config paths, precedence, and override surfaces.",
    "Generated config matrix must list all platforms with non-empty entries.",
  ),
  pattern(
    "config-profiles",
    "configuration",
    "Represent named safety and execution presets across runtimes.",
    [AUDIT_SOURCE_IDS.codex],
    "Foundry defines review, development, unattended, and trusted presets, mapped to native profiles or degraded install-time presets.",
    ["named-profiles-or-presets"],
    "If profiles are not native, Foundry documents equivalent install-time presets and warnings.",
    "All platforms expose review, development, and unattended preset semantics.",
    "Document whether presets are native profiles or degraded mappings.",
    "Safety docs must include review/dev/unattended rows for every platform.",
  ),
  pattern(
    "workflow-entrypoint",
    "workflow",
    "Provide a user-facing entrypoint for structured workflows.",
    [AUDIT_SOURCE_IDS.claude, AUDIT_SOURCE_IDS.codex, "foundry"],
    "Foundry projects workflows into native commands, prompts, or workflow skills depending on runtime.",
    ["workflow-entry-surface"],
    "If a runtime lacks a native workflow primitive, Foundry uses the nearest supported entry surface and documents it as degraded.",
    "Each workflow has one per-platform entry surface and generated artifact.",
    "Document the entry surface by platform.",
    "Manifest and generated files must agree on each workflow artifact.",
  ),
  pattern(
    "supporting-skill",
    "skills",
    "Use reusable skills as supporting context or user-invocable workflows.",
    [AUDIT_SOURCE_IDS.claude, AUDIT_SOURCE_IDS.codex, "foundry"],
    "Foundry keeps skills canonical in one source tree and projects them into runtime-specific skill surfaces.",
    ["skill-surface"],
    "If skills are not native, Foundry projects them into routeable knowledge modules or generated workflow surfaces.",
    "Each platform declares how canonical skills are surfaced.",
    "Document native skill path or degraded equivalent.",
    "Validation fails if canonical skills are silently omitted for a platform.",
  ),
  pattern(
    "skill-discovery",
    "skills",
    "Describe how skills are discovered and when they are loaded.",
    [AUDIT_SOURCE_IDS.claude, AUDIT_SOURCE_IDS.codex],
    "Foundry captures skill discovery rules, precedence, and lazy/full loading behavior.",
    ["skill-discovery-semantics"],
    "If the runtime lacks auto-discovery, Foundry uses explicit route resolution and documents the difference.",
    "Each platform declares local/user discovery and auto-discovery semantics.",
    "Document discovery paths and precedence behavior.",
    "Parity docs must list discovery semantics for all platforms.",
  ),
  pattern(
    "skill-frontmatter",
    "skills",
    "Normalize the supported SKILL frontmatter fields across runtimes.",
    [AUDIT_SOURCE_IDS.claude, AUDIT_SOURCE_IDS.codex, "foundry"],
    "Foundry records the canonical frontmatter model and per-platform support level for each behavior class.",
    ["skill-frontmatter-support"],
    "Unsupported fields are downgraded to documentation-only behavior and surfaced as degraded.",
    "Each platform declares whether frontmatter is native, sanitized, or degraded.",
    "Document the supported field surface and sanitization behavior.",
    "Validation fails if a platform with skills lacks a frontmatter support entry.",
  ),
  pattern(
    "skill-string-substitution",
    "skills",
    "Carry argument-substitution semantics such as $ARGUMENTS or positional args.",
    [AUDIT_SOURCE_IDS.codex],
    "Foundry treats string substitutions as part of the canonical skill contract and documents their runtime projection.",
    ["skill-argument-binding"],
    "If a runtime lacks direct substitution support, Foundry maps the values into workflow prompt text or arguments.",
    "Each platform declares how skill arguments are bound.",
    "Document argument binding semantics and limits.",
    "Capability matrix must include argument binding for every platform.",
  ),
  pattern(
    "skill-forked-execution",
    "skills",
    "Allow a skill to run in isolated execution when the runtime supports it.",
    [AUDIT_SOURCE_IDS.claude, AUDIT_SOURCE_IDS.codex],
    "Foundry models isolated skill execution as a first-class projection, even when it degrades to agent handoff.",
    ["isolated-skill-execution"],
    "If the runtime lacks forked skill execution, Foundry maps it to a specialist or subagent handoff.",
    "Each platform declares native or degraded isolation for skills.",
    "Document how isolated execution is achieved per runtime.",
    "Validation fails if isolation-dependent patterns lack a declared projection.",
  ),
  pattern(
    "agent-registration",
    "agents",
    "Register specialist agents in the runtime's native format.",
    [AUDIT_SOURCE_IDS.claude, AUDIT_SOURCE_IDS.codex, "foundry"],
    "Foundry projects specialist agents into native agent files, agent config, or generated command surfaces.",
    ["agent-registration-surface"],
    "If runtime-native agents do not exist, Foundry projects specialist routes into generated commands or prompts.",
    "Every platform declares how specialists are registered.",
    "Document native agent paths or degraded specialist routes.",
    "Manifest agent entries must match generated agent artifacts.",
  ),
  pattern(
    "specialist-agent",
    "agents",
    "Provide narrow, opinionated specialist personas for domain work.",
    [AUDIT_SOURCE_IDS.claude, AUDIT_SOURCE_IDS.codex, "foundry"],
    "Foundry specialists remain semantically stable even when projected into different runtime surfaces.",
    ["specialist-persona-surface"],
    "If a runtime cannot spawn native agents, Foundry still projects specialist routes with explicit scope and verification contracts.",
    "Every platform maps each shared specialist into a native or degraded surface.",
    "Document specialist routing semantics and scope limits.",
    "Validation fails if a shared specialist has no platform projection.",
  ),
  pattern(
    "agent-preloaded-skill",
    "agents",
    "Allow agents to preload skills as background knowledge.",
    [AUDIT_SOURCE_IDS.claude, AUDIT_SOURCE_IDS.codex],
    "Foundry captures preloaded-skill semantics separately from user-invocable skills.",
    ["preloaded-skill-support"],
    "If preloading is not native, Foundry injects attached skill guidance into the generated specialist surface and marks it degraded.",
    "Each platform declares how preloaded skills are attached to agents.",
    "Document native preload wiring or degraded attached-skill section.",
    "Generated agent projections must include attached skills when declared.",
  ),
  pattern(
    "multi-agent-orchestration",
    "agents",
    "Fan out work to multiple agents or specialists in parallel.",
    [AUDIT_SOURCE_IDS.claude, AUDIT_SOURCE_IDS.codex, "foundry"],
    "Foundry treats multi-agent fanout as a control-plane pattern with runtime-specific execution surfaces.",
    ["parallel-specialist-execution"],
    "If native multi-agent support is absent, Foundry degrades to orchestrator-managed repeated delegation with explicit ownership.",
    "Each platform declares native or degraded parallel delegation support.",
    "Document concurrency, depth, and fanout notes.",
    "Capability matrix must include multi-agent orchestration for all platforms.",
  ),
  pattern(
    "batch-agent-fanout",
    "agents",
    "Run many homogeneous tasks through a worker fanout pattern.",
    [AUDIT_SOURCE_IDS.codex],
    "Foundry models structured batch fanout separately from general orchestration.",
    ["batch-worker-fanout"],
    "If batch fanout is not native, Foundry maps it to orchestrator-managed repeated delegation and marks the limits.",
    "Each platform declares native or degraded batch fanout semantics.",
    "Document batch size, timeout, and collection constraints.",
    "Validation fails if a platform omits batch fanout semantics entirely.",
  ),
  pattern(
    "orchestration-chain",
    "workflow",
    "Capture the major composition styles used across upstream repos and Foundry.",
    [AUDIT_SOURCE_IDS.claude, AUDIT_SOURCE_IDS.codex, "foundry"],
    "Foundry normalizes command -> agent -> skill, skill -> skill, and orchestrator -> specialists -> validator as explicit orchestration subtypes.",
    ["orchestration-subtype-support"],
    "If a runtime cannot express a subtype natively, Foundry routes it through the nearest control-plane equivalent.",
    "Every platform declares support for each canonical orchestration subtype.",
    "Document subtype support and runtime projection rules.",
    "Orchestration docs must include all three subtypes.",
  ),
  pattern(
    "review-and-validation",
    "workflow",
    "Separate implementation from validation and review.",
    [AUDIT_SOURCE_IDS.claude, AUDIT_SOURCE_IDS.codex, "foundry"],
    "Foundry keeps validation as a first-class stage with specialist or workflow support.",
    ["validation-gate"],
    "If a runtime lacks a dedicated validator surface, Foundry uses a degraded review workflow contract.",
    "Every platform defines a review/validation projection.",
    "Document review and validation entry surfaces.",
    "Validation data must include a review/validation support entry for each platform.",
  ),
  pattern(
    "research-escalation",
    "workflow",
    "Escalate from repo evidence to official docs and then community evidence only when needed.",
    [AUDIT_SOURCE_IDS.claude, "foundry"],
    "Foundry enforces repo-first and official-first research policy in rules, workflows, and docs.",
    ["research-policy-surface"],
    "When the runtime lacks tool-level enforcement, Foundry degrades to generated steering and workflow contract language.",
    "All platforms declare research policy enforcement behavior.",
    "Document repo-first and official-first escalation behavior.",
    "Rules and docs must align on research policy wording.",
  ),
  pattern(
    "memory-loading",
    "memory",
    "Model project memory and specialist memory loading behavior.",
    [AUDIT_SOURCE_IDS.claude, AUDIT_SOURCE_IDS.codex, "foundry"],
    "Foundry documents main memory files, specialist memory behavior, and foundation-doc loading order.",
    ["memory-surface"],
    "If runtime-native memory is weak or absent, Foundry degrades to project foundation docs and route contracts.",
    "Each platform declares native and degraded memory behavior.",
    "Document root memory files, specialist memory, and load order.",
    "Memory docs must cover all platforms.",
  ),
  pattern(
    "project-vs-global-scope",
    "configuration",
    "Capture project-scoped versus global-scoped installation behavior.",
    [AUDIT_SOURCE_IDS.claude, AUDIT_SOURCE_IDS.codex, "foundry"],
    "Foundry records where project and global artifacts land for every platform.",
    ["scope-model"],
    "If runtime scope is not fully symmetric, Foundry documents the normalized install behavior.",
    "All platforms publish project/global scope paths.",
    "Document scope paths and precedence.",
    "Scope matrix must include all supported platforms.",
  ),
  pattern(
    "hook-support",
    "runtime",
    "Model runtime hook support and degraded rule-based equivalents.",
    [AUDIT_SOURCE_IDS.claude],
    "Foundry treats hooks as native where available and advisory rule reinforcement elsewhere.",
    ["hook-surface"],
    "If runtime hooks are not native, Foundry projects the pattern into generated steering, prompt guards, or install guidance.",
    "Each platform declares native or degraded hook support.",
    "Document event support and degraded alternatives.",
    "Validation fails if hook support is omitted from a platform contract.",
  ),
  pattern(
    "mcp-integration",
    "mcp",
    "Connect external MCP servers through runtime-specific configuration.",
    [AUDIT_SOURCE_IDS.claude, AUDIT_SOURCE_IDS.codex, "foundry"],
    "Foundry emits shared MCP guidance plus runtime-specific install targets.",
    ["mcp-client-surface"],
    "If direct MCP support is limited, Foundry routes through its gateway and documents the degraded behavior.",
    "Every platform defines an MCP client surface.",
    "Document config location, scope, and security guidance.",
    "MCP matrix must include all platforms.",
  ),
  pattern(
    "agent-scoped-mcp",
    "mcp",
    "Limit MCP access to the agents or workflows that need it.",
    [AUDIT_SOURCE_IDS.codex, AUDIT_SOURCE_IDS.claude],
    "Foundry models scoped MCP access as a separate pattern from global MCP wiring.",
    ["scoped-mcp-surface"],
    "If per-agent scoping is not native, Foundry documents the nearest workflow or install-time narrowing pattern.",
    "Each platform declares agent- or route-scoped MCP support.",
    "Document native scoped MCP behavior or degraded equivalent.",
    "Capability matrix must include scoped MCP support for every platform.",
  ),
  pattern(
    "runtime-as-mcp-server",
    "mcp",
    "Expose the runtime itself as an MCP server when supported.",
    [AUDIT_SOURCE_IDS.codex],
    "Foundry treats runtime-as-server as a first-class capability and documents gateway fallbacks elsewhere.",
    ["runtime-as-mcp-server"],
    "If a runtime cannot act as an MCP server, Foundry documents the gateway or external server substitute.",
    "Each platform declares native or degraded runtime-as-server behavior.",
    "Document whether the runtime can expose an MCP server surface directly.",
    "Validation fails if a platform omits runtime-as-server semantics entirely.",
  ),
  pattern(
    "browser-verification",
    "browser",
    "Use a shared browser capability for live verification when configured and allowed.",
    [AUDIT_SOURCE_IDS.claude, AUDIT_SOURCE_IDS.codex, "foundry"],
    "Foundry normalizes browser verification around shared Playwright/browser MCP policy.",
    ["browser-tooling-surface"],
    "If browser tooling is unavailable, Foundry documents the constraint and keeps the policy explicit.",
    "Every platform declares browser verification support.",
    "Document browser/MCP safety rules and available surfaces.",
    "Browser matrix must cover all platforms.",
  ),
  pattern(
    "sandbox-policy",
    "safety",
    "Map runtime sandbox or containment modes into a shared safety model.",
    [AUDIT_SOURCE_IDS.codex, AUDIT_SOURCE_IDS.claude],
    "Foundry defines review-safe, dev-safe, and trusted execution boundaries for each runtime.",
    ["sandbox-or-containment-surface"],
    "If sandboxing is not native, Foundry degrades to rule guidance and environment constraints.",
    "Each platform defines review/dev/trusted containment behavior.",
    "Document sandbox modes and practical defaults.",
    "Safety matrix must include sandbox behavior for every platform.",
  ),
  pattern(
    "approval-policy",
    "safety",
    "Map runtime approval or permission modes into shared autonomy presets.",
    [AUDIT_SOURCE_IDS.codex, AUDIT_SOURCE_IDS.claude],
    "Foundry defines review, development, unattended, and trusted autonomy levels per runtime.",
    ["approval-or-permission-surface"],
    "If approval modes are not native, Foundry degrades to documented operator policy and install-time guidance.",
    "Each platform declares review/dev/unattended approval behavior.",
    "Document approval modes and dangerous combinations.",
    "Safety docs must cover approval behavior on every platform.",
  ),
  pattern(
    "session-resume",
    "session",
    "Resume a previous task context when the runtime supports session persistence.",
    [AUDIT_SOURCE_IDS.codex, AUDIT_SOURCE_IDS.claude],
    "Foundry models session resume separately from memory and config layering.",
    ["session-resume-surface"],
    "If session resume is not native, Foundry degrades to fresh-session handoff artifacts and explicit stateless continuation.",
    "Each platform declares native or degraded resume behavior.",
    "Document session resume semantics and limitations.",
    "Session matrix must include resume support for every platform.",
  ),
  pattern(
    "session-fork",
    "session",
    "Fork an existing task context to explore alternatives without mutating the original.",
    [AUDIT_SOURCE_IDS.codex, AUDIT_SOURCE_IDS.claude],
    "Foundry models context forking as a separate workflow primitive.",
    ["session-fork-surface"],
    "If session forking is not native, Foundry degrades to explicit handoff packs or fresh-session replay.",
    "Each platform declares native or degraded fork behavior.",
    "Document forking semantics and caveats.",
    "Session docs must cover fork behavior for every platform.",
  ),
  pattern(
    "headless-exec",
    "session",
    "Run non-interactive execution in CI or scripts when the runtime supports it.",
    [AUDIT_SOURCE_IDS.codex, AUDIT_SOURCE_IDS.claude],
    "Foundry records headless or print-mode execution support and machine-readable output support.",
    ["headless-surface", "machine-readable-output"],
    "If headless execution is not native, Foundry degrades to stateless invocation guidance and marks machine-readable output limits.",
    "Each platform declares native or degraded headless support.",
    "Document headless invocation and structured output support.",
    "Session/headless matrix must include all platforms.",
  ),
  pattern(
    "worktree-isolation",
    "runtime",
    "Allow isolated worktree execution when the runtime supports it.",
    [AUDIT_SOURCE_IDS.claude, AUDIT_SOURCE_IDS.codex],
    "Foundry keeps worktree isolation as a first-class runtime capability.",
    ["worktree-or-isolated-checkout"],
    "If worktree support is not native, Foundry degrades to documented external git-worktree workflows.",
    "Each platform declares native or degraded worktree behavior.",
    "Document whether worktree isolation is runtime-native or external.",
    "Capability matrix must include worktree behavior for every platform.",
  ),
  pattern(
    "scheduled-task",
    "runtime",
    "Support recurring or scheduled workflows when available.",
    [AUDIT_SOURCE_IDS.claude],
    "Foundry models scheduled work as a runtime capability with degraded automation fallbacks.",
    ["scheduled-task-surface"],
    "If scheduling is not native, Foundry degrades to explicit external automation or inbox-driven recurrence.",
    "Each platform declares native or degraded scheduling behavior.",
    "Document native scheduling or degraded automation guidance.",
    "Validation fails if scheduling semantics are omitted from a platform contract.",
  ),
  pattern(
    "upstream-capability-audit",
    "governance",
    "Track upstream runtime capability drift against audited reference repos.",
    [AUDIT_SOURCE_IDS.claude, AUDIT_SOURCE_IDS.codex, "foundry"],
    "Foundry emits an audit artifact and generated docs that record audited references, parity impacts, and blockers.",
    ["audit-artifact"],
    "If runtime metadata is partial, Foundry still records the audit entry and any projection gaps.",
    "The bundle ships audited reference inputs and a generated audit report.",
    "Document audited refs, parity impacts, and current blockers.",
    "Validation fails if the audit artifact or audited refs are missing.",
  ),
];

const PLATFORM_SPECS = {
  codex: {
    label: "Codex",
    runtime_family: "codex-cli",
    instruction_capabilities: {
      root_instruction_file: "AGENTS.md",
      project_instruction_path: "<workspace>/AGENTS.md",
      global_instruction_path: "~/.codex/AGENTS.md",
      hierarchical_loading: "native ancestor-loading",
      personal_override: "AGENTS.override.md",
      size_guidance: "Keep project instructions concise; byte-based cap applies.",
    },
    config_capabilities: {
      user_config_path: "~/.codex/config.toml",
      project_config_path: "<workspace>/.codex/config.toml",
      override_surfaces: ["CLI flags", "-c key=value"],
      profiles: "native",
    },
    agent_capabilities: {
      native_agent_surface: ".codex/agents/*.toml",
      skill_surface: ".agents/skills/<id>/SKILL.md",
      workflow_entry_surface: "generated workflow skills",
      multi_agent: "native",
      batch_fanout: "native or tool-assisted",
    },
    skill_capabilities: {
      discovery: "project -> user -> built-in",
      preloaded_skills: "native",
      frontmatter: "native",
      argument_binding: "native",
      isolated_skill_execution: "native via forked execution or subagent projection",
    },
    session_capabilities: {
      resume: "native",
      fork: "native",
      headless_exec: "native",
      machine_readable_output: "native",
      worktree_isolation: "native or external git worktree",
    },
    mcp_capabilities: {
      client_surface: "[mcp_servers.*] in .codex/config.toml",
      scoped_mcp: "native agent-scoped MCP",
      runtime_as_server: "native via codex mcp-server",
      browser_verification: "native when browser MCP is configured",
    },
    safety_capabilities: {
      review_mode: "read-only + untrusted",
      development_mode: "workspace-write + on-request",
      unattended_mode: "read-only + never",
      trusted_mode: "workspace-write or danger-full-access + never",
      warnings: [
        "Do not pair danger-full-access with never outside a real containment boundary.",
      ],
    },
    native_patterns: new Set([
      "instructions-file",
      "instructions-hierarchy",
      "instructions-override",
      "config-layering",
      "config-profiles",
      "workflow-entrypoint",
      "supporting-skill",
      "skill-discovery",
      "skill-frontmatter",
      "skill-string-substitution",
      "skill-forked-execution",
      "agent-registration",
      "specialist-agent",
      "agent-preloaded-skill",
      "multi-agent-orchestration",
      "batch-agent-fanout",
      "orchestration-chain",
      "review-and-validation",
      "research-escalation",
      "memory-loading",
      "project-vs-global-scope",
      "mcp-integration",
      "agent-scoped-mcp",
      "runtime-as-mcp-server",
      "browser-verification",
      "sandbox-policy",
      "approval-policy",
      "session-resume",
      "session-fork",
      "headless-exec",
      "worktree-isolation",
      "upstream-capability-audit",
    ]),
    pattern_overrides: {
      "hook-support": {
        support_level: "degraded",
        behavior_notes:
          "Codex parity uses generated steering and skill/routing contracts instead of a first-class hook system.",
      },
      "scheduled-task": {
        support_level: "degraded",
        behavior_notes:
          "Recurring work is projected into external automation or future Foundry automation, not native in-session scheduling.",
      },
    },
  },
  claude: {
    label: "Claude Code",
    runtime_family: "claude-code",
    instruction_capabilities: {
      root_instruction_file: "CLAUDE.md",
      project_instruction_path: "<workspace>/CLAUDE.md",
      global_instruction_path: "~/.claude/CLAUDE.md",
      hierarchical_loading: "native ancestor-loading with lazy descendant loading",
      personal_override: ".claude/settings.local.json and user/global rules",
      size_guidance: "Keep CLAUDE.md concise; split domain specifics into rules and skills.",
    },
    config_capabilities: {
      user_config_path: "~/.claude/settings.json",
      project_config_path: "<workspace>/.claude/settings.json",
      override_surfaces: ["CLI flags", ".claude/settings.local.json"],
      profiles: "degraded via settings presets and runtime modes",
    },
    agent_capabilities: {
      native_agent_surface: ".claude/agents/*.md",
      skill_surface: ".claude/skills/<id>/SKILL.md",
      workflow_entry_surface: "workflow skills and native commands",
      multi_agent: "native or experimental",
      batch_fanout: "degraded via orchestrator-managed fanout",
    },
    skill_capabilities: {
      discovery: "project -> user -> plugin",
      preloaded_skills: "native",
      frontmatter: "native",
      argument_binding: "degraded across commands and skills",
      isolated_skill_execution: "native via context fork",
    },
    session_capabilities: {
      resume: "native",
      fork: "native or session-branch equivalent",
      headless_exec: "native via print/headless surfaces",
      machine_readable_output: "degraded",
      worktree_isolation: "native or runtime-supported",
    },
    mcp_capabilities: {
      client_surface: ".mcp.json and Claude settings",
      scoped_mcp: "native agent-scoped MCP",
      runtime_as_server: "degraded via Foundry gateway or external MCP server",
      browser_verification: "native when browser MCP is configured",
    },
    safety_capabilities: {
      review_mode: "plan mode or restrictive permissions",
      development_mode: "accept-edits style settings and project hooks",
      unattended_mode: "degraded; depends on runtime mode and environment",
      trusted_mode: "bypass-style modes only in contained environments",
      warnings: [
        "Treat bypass or dangerous permissions as trusted-mode only.",
      ],
    },
    native_patterns: new Set([
      "instructions-file",
      "instructions-hierarchy",
      "config-layering",
      "workflow-entrypoint",
      "supporting-skill",
      "skill-discovery",
      "skill-frontmatter",
      "skill-forked-execution",
      "agent-registration",
      "specialist-agent",
      "agent-preloaded-skill",
      "multi-agent-orchestration",
      "orchestration-chain",
      "review-and-validation",
      "research-escalation",
      "memory-loading",
      "project-vs-global-scope",
      "hook-support",
      "mcp-integration",
      "agent-scoped-mcp",
      "browser-verification",
      "sandbox-policy",
      "approval-policy",
      "session-resume",
      "session-fork",
      "headless-exec",
      "worktree-isolation",
      "scheduled-task",
      "upstream-capability-audit",
    ]),
    pattern_overrides: {
      "instructions-override": {
        support_level: "degraded",
        behavior_notes:
          "Personal overrides are projected through local settings and user-scoped rules rather than a dedicated override file.",
      },
      "config-profiles": {
        support_level: "degraded",
        behavior_notes:
          "Named profiles are projected into documented safety presets instead of a native profile table.",
      },
      "skill-string-substitution": {
        support_level: "degraded",
        behavior_notes:
          "Argument binding is available but not modeled as a Codex-style substitution contract everywhere.",
      },
      "batch-agent-fanout": {
        support_level: "degraded",
        behavior_notes:
          "Batch fanout is handled through orchestrator-managed delegation rather than a native CSV batch primitive.",
      },
      "runtime-as-mcp-server": {
        support_level: "degraded",
        behavior_notes:
          "Claude parity uses Foundry or external servers for MCP serving; the runtime is primarily an MCP client.",
      },
    },
  },
  copilot: {
    label: "GitHub Copilot",
    runtime_family: "copilot-chat",
    instruction_capabilities: {
      root_instruction_file: "AGENTS.md + .github/copilot-instructions.md",
      project_instruction_path:
        "<workspace>/AGENTS.md and <workspace>/.github/copilot-instructions.md",
      global_instruction_path: "~/.copilot/copilot-instructions.md",
      hierarchical_loading: "degraded through generated rule surfaces",
      personal_override: "global user instruction file",
      size_guidance: "Keep generated prompts concise; Copilot consumes both AGENTS.md and Copilot instructions.",
    },
    config_capabilities: {
      user_config_path: "~/.copilot/mcp-config.json",
      project_config_path: "<workspace>/.vscode/mcp.json",
      override_surfaces: ["VS Code settings", "runtime UI controls"],
      profiles: "degraded via Foundry presets",
    },
    agent_capabilities: {
      native_agent_surface: ".github/agents/*.md",
      skill_surface: ".github/skills/<id>/SKILL.md",
      workflow_entry_surface: ".github/prompts/*.prompt.md",
      multi_agent: "degraded",
      batch_fanout: "degraded",
    },
    skill_capabilities: {
      discovery: "degraded",
      preloaded_skills: "degraded",
      frontmatter: "sanitized/degraded",
      argument_binding: "degraded",
      isolated_skill_execution: "degraded",
    },
    session_capabilities: {
      resume: "degraded",
      fork: "degraded",
      headless_exec: "degraded",
      machine_readable_output: "degraded",
      worktree_isolation: "external",
    },
    mcp_capabilities: {
      client_surface: ".vscode/mcp.json or user mcp-config.json",
      scoped_mcp: "degraded",
      runtime_as_server: "degraded via Foundry gateway",
      browser_verification: "native when Playwright/browser MCP is configured",
    },
    safety_capabilities: {
      review_mode: "degraded preset guidance",
      development_mode: "degraded preset guidance",
      unattended_mode: "degraded or external automation",
      trusted_mode: "degraded and environment-dependent",
      warnings: [
        "Copilot parity relies on generated prompts and environment policy more than native approval controls.",
      ],
    },
    native_patterns: new Set([
      "instructions-file",
      "workflow-entrypoint",
      "supporting-skill",
      "agent-registration",
      "specialist-agent",
      "project-vs-global-scope",
      "mcp-integration",
      "browser-verification",
      "upstream-capability-audit",
    ]),
  },
  gemini: {
    label: "Gemini CLI",
    runtime_family: "gemini-cli",
    instruction_capabilities: {
      root_instruction_file: ".gemini/GEMINI.md",
      project_instruction_path: "<workspace>/.gemini/GEMINI.md",
      global_instruction_path: "~/.gemini/GEMINI.md",
      hierarchical_loading: "degraded through generated command/rule surfaces",
      personal_override: "global or local runtime settings",
      size_guidance: "Keep generated commands and Gemini rules concise.",
    },
    config_capabilities: {
      user_config_path: "~/.gemini/settings.json",
      project_config_path: "<workspace>/.gemini/settings.json",
      override_surfaces: ["runtime settings", "Foundry install flags"],
      profiles: "degraded via Foundry presets",
    },
    agent_capabilities: {
      native_agent_surface: "degraded via generated command routes",
      skill_surface: "degraded via shared skill installs",
      workflow_entry_surface: ".gemini/commands/*.toml",
      multi_agent: "degraded",
      batch_fanout: "degraded",
    },
    skill_capabilities: {
      discovery: "degraded",
      preloaded_skills: "degraded",
      frontmatter: "degraded",
      argument_binding: "degraded",
      isolated_skill_execution: "degraded",
    },
    session_capabilities: {
      resume: "degraded",
      fork: "degraded",
      headless_exec: "degraded",
      machine_readable_output: "degraded",
      worktree_isolation: "external",
    },
    mcp_capabilities: {
      client_surface: ".gemini/settings.json mcpServers",
      scoped_mcp: "degraded",
      runtime_as_server: "degraded via Foundry gateway",
      browser_verification: "native when MCP/browser tooling is configured",
    },
    safety_capabilities: {
      review_mode: "degraded preset guidance",
      development_mode: "degraded preset guidance",
      unattended_mode: "degraded or external automation",
      trusted_mode: "degraded and environment-dependent",
      warnings: [
        "Gemini parity uses generated commands and Foundry policy to emulate profile-like safety defaults.",
      ],
    },
    native_patterns: new Set([
      "instructions-file",
      "workflow-entrypoint",
      "orchestration-chain",
      "review-and-validation",
      "research-escalation",
      "project-vs-global-scope",
      "mcp-integration",
      "browser-verification",
      "upstream-capability-audit",
    ]),
  },
  antigravity: {
    label: "Antigravity",
    runtime_family: "antigravity-gemini",
    instruction_capabilities: {
      root_instruction_file: ".agents/rules/GEMINI.md",
      project_instruction_path: "<workspace>/.agents/rules/GEMINI.md",
      global_instruction_path: "~/.gemini/GEMINI.md",
      hierarchical_loading: "degraded through generated rule/command surfaces",
      personal_override: "global runtime rules and local install choices",
      size_guidance: "Keep generated commands and rules concise.",
    },
    config_capabilities: {
      user_config_path: "~/.gemini/settings.json",
      project_config_path: "<workspace>/.gemini/settings.json",
      override_surfaces: ["runtime settings", "Foundry install flags"],
      profiles: "degraded via Foundry presets",
    },
    agent_capabilities: {
      native_agent_surface: "degraded via generated specialist commands",
      skill_surface: ".agents/skills/<id>/SKILL.md",
      workflow_entry_surface: ".gemini/commands/*.toml",
      multi_agent: "degraded",
      batch_fanout: "degraded",
    },
    skill_capabilities: {
      discovery: "native for shared skill installs",
      preloaded_skills: "degraded",
      frontmatter: "degraded",
      argument_binding: "degraded",
      isolated_skill_execution: "degraded",
    },
    session_capabilities: {
      resume: "degraded",
      fork: "degraded",
      headless_exec: "degraded",
      machine_readable_output: "degraded",
      worktree_isolation: "external",
    },
    mcp_capabilities: {
      client_surface: "Foundry gateway + runtime MCP settings",
      scoped_mcp: "degraded",
      runtime_as_server: "degraded via Foundry gateway",
      browser_verification: "native when Playwright/browser MCP is configured",
    },
    safety_capabilities: {
      review_mode: "degraded preset guidance",
      development_mode: "degraded preset guidance",
      unattended_mode: "degraded or external automation",
      trusted_mode: "degraded and environment-dependent",
      warnings: [
        "Antigravity parity depends on generated command routes more than native profile or agent controls.",
      ],
    },
    native_patterns: new Set([
      "instructions-file",
      "workflow-entrypoint",
      "supporting-skill",
      "skill-discovery",
      "orchestration-chain",
      "review-and-validation",
      "research-escalation",
      "project-vs-global-scope",
      "mcp-integration",
      "browser-verification",
      "upstream-capability-audit",
    ]),
  },
};

const SURFACE_BY_CATEGORY = {
  instructions: "instruction surface",
  configuration: "config surface",
  workflow: "workflow surface",
  skills: "skill surface",
  agents: "agent surface",
  memory: "memory surface",
  runtime: "runtime surface",
  mcp: "MCP surface",
  browser: "browser surface",
  safety: "safety surface",
  session: "session surface",
  governance: "governance surface",
};

function titleCase(value) {
  return String(value || "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function defaultProjectionSurface(platform, category) {
  switch (category) {
    case "instructions":
      return platform.instruction_capabilities.root_instruction_file;
    case "configuration":
      return platform.config_capabilities.project_config_path;
    case "workflow":
      return platform.agent_capabilities.workflow_entry_surface;
    case "skills":
      return platform.agent_capabilities.skill_surface;
    case "agents":
      return platform.agent_capabilities.native_agent_surface;
    case "memory":
      return platform.instruction_capabilities.root_instruction_file;
    case "runtime":
      return platform.agent_capabilities.workflow_entry_surface;
    case "mcp":
      return platform.mcp_capabilities.client_surface;
    case "browser":
      return platform.mcp_capabilities.browser_verification;
    case "safety":
      return platform.safety_capabilities.development_mode;
    case "session":
      return platform.session_capabilities.resume;
    case "governance":
      return "Generated audit artifacts and CI validation";
    default:
      return SURFACE_BY_CATEGORY[category] || "runtime surface";
  }
}

function defaultBehaviorNote(platformId, platform, pattern, supportLevel) {
  if (supportLevel === "native") {
    return `${platform.label} has native ${pattern.id} support via ${defaultProjectionSurface(platform, pattern.category)}.`;
  }
  return `${platform.label} projects ${pattern.id} in degraded form via ${defaultProjectionSurface(platform, pattern.category)} and explicit Foundry control-plane guidance.`;
}

function defaultHardLimits(pattern, supportLevel) {
  if (supportLevel === "native") {
    return [`Native runtime limits still apply for ${pattern.id}.`];
  }
  return [
    `Degraded projection for ${pattern.id} is semantic, not exact UI parity.`,
    "Operator-visible docs must be treated as part of the contract.",
  ];
}

function defaultVerificationSteps(pattern, supportLevel) {
  const prefix = supportLevel === "native" ? "Verify native" : "Verify degraded";
  return [
    `${prefix} ${pattern.id} projection is present in the generated manifest.`,
    `${prefix} docs for ${pattern.id} are emitted and linked from the parity set.`,
    `Ensure install metadata does not silently omit ${pattern.id}.`,
  ];
}

function buildPatternSupport(platformId, platform, pattern) {
  const override = platform.pattern_overrides?.[pattern.id] || null;
  const supportLevel = override?.support_level
    || (platform.native_patterns.has(pattern.id) ? "native" : "degraded");
  const projectionSurface =
    override?.projection_surface || defaultProjectionSurface(platform, pattern.category);
  const behaviorNotes =
    override?.behavior_notes
    || defaultBehaviorNote(platformId, platform, pattern, supportLevel);
  const hardLimits = override?.hard_limits || defaultHardLimits(pattern, supportLevel);
  const verificationSteps =
    override?.verification_steps || defaultVerificationSteps(pattern, supportLevel);

  return {
    pattern_id: pattern.id,
    support_level: supportLevel,
    projection_surface: projectionSurface,
    behavior_notes: behaviorNotes,
    hard_limits: hardLimits,
    installable: supportLevel !== "blocked",
    verification_steps: verificationSteps,
  };
}

export function buildPlatformCapabilityContracts() {
  const contracts = {};
  for (const [platformId, platform] of Object.entries(PLATFORM_SPECS)) {
    contracts[platformId] = {
      platform_id: platformId,
      runtime_family: platform.runtime_family,
      instruction_capabilities: platform.instruction_capabilities,
      config_capabilities: platform.config_capabilities,
      agent_capabilities: platform.agent_capabilities,
      skill_capabilities: platform.skill_capabilities,
      session_capabilities: platform.session_capabilities,
      mcp_capabilities: platform.mcp_capabilities,
      safety_capabilities: platform.safety_capabilities,
      pattern_support: PATTERN_REGISTRY.map((pattern) =>
        buildPatternSupport(platformId, platform, pattern),
      ),
    };
  }
  return contracts;
}

export function buildUpstreamCapabilityAudit() {
  return {
    $schema: "cubis-foundry-upstream-capability-audit-v1",
    generatedAt: new Date(0).toISOString(),
    audits: AUDITED_REFERENCES.map((reference) => ({
      runtime: reference.runtime,
      audit_source_id: reference.audit_source_id,
      audited_commit: reference.audited_commit,
      audited_version_or_date: reference.audited_version_or_date,
      audited_at: reference.audited_at,
      diff_summary:
        "Reference repo audited and mapped into the canonical parity registry and platform contracts.",
      parity_impacts: [
        "Maintains the runtime-specific feature vocabulary used by the parity registry.",
        "Provides source evidence for native vs degraded support decisions.",
      ],
      required_manifest_changes: [
        "Keep pattern registry, capability contracts, and generated docs in sync with the audited reference.",
      ],
      blocking_items: [],
    })),
  };
}

function markdownTable(headers, rows) {
  const headerRow = `| ${headers.join(" | ")} |`;
  const dividerRow = `| ${headers.map(() => "---").join(" | ")} |`;
  const bodyRows = rows.map((row) => `| ${row.join(" | ")} |`);
  return [headerRow, dividerRow, ...bodyRows].join("\n");
}

function renderPatternCatalog() {
  const rows = PATTERN_REGISTRY.map((pattern) => [
    `\`${pattern.id}\``,
    pattern.category,
    pattern.source_repos.join(", "),
    pattern.canonical_surface,
  ]);
  return [
    "# Cross-Platform Pattern Catalog",
    "",
    "Generated from the canonical Foundry parity registry.",
    "",
    markdownTable(
      ["Pattern", "Category", "Audited Sources", "Canonical Surface"],
      rows,
    ),
    "",
  ].join("\n");
}

function renderPlatformParityMatrix(contracts) {
  const headers = [
    "Pattern",
    ...Object.keys(contracts).map((platformId) => titleCase(platformId)),
  ];
  const rows = PATTERN_REGISTRY.map((pattern) => [
    `\`${pattern.id}\``,
    ...Object.keys(contracts).map((platformId) =>
      contracts[platformId].pattern_support.find(
        (item) => item.pattern_id === pattern.id,
      )?.support_level || "missing",
    ),
  ]);
  return [
    "# Platform Parity Matrix",
    "",
    "Every pattern must be present for every supported platform. `degraded` is allowed; silent omission is not.",
    "",
    markdownTable(headers, rows),
    "",
  ].join("\n");
}

function renderDegradedProjectionMatrixTable(contracts) {
  const rows = [];
  for (const [platformId, contract] of Object.entries(contracts)) {
    for (const support of contract.pattern_support.filter(
      (item) => item.support_level === "degraded",
    )) {
      rows.push([
        titleCase(platformId),
        `\`${support.pattern_id}\``,
        support.projection_surface,
        support.behavior_notes,
      ]);
    }
  }
  return rows.length === 0
    ? "No degraded projections."
    : markdownTable(["Platform", "Pattern", "Projection Surface", "Behavior Notes"], rows);
}

function renderSafetyMatrixTable(contracts) {
  const rows = Object.entries(contracts).map(([platformId, contract]) => [
    titleCase(platformId),
    contract.safety_capabilities.review_mode,
    contract.safety_capabilities.development_mode,
    contract.safety_capabilities.unattended_mode,
    contract.safety_capabilities.trusted_mode,
    contract.safety_capabilities.warnings.join(" "),
  ]);
  return markdownTable(
    ["Platform", "Review", "Development", "Unattended", "Trusted", "Warnings"],
    rows,
  );
}

function renderInstructionConfigProfileMatrixTable(contracts) {
  const rows = Object.entries(contracts).map(([platformId, contract]) => [
    titleCase(platformId),
    contract.instruction_capabilities.root_instruction_file,
    contract.instruction_capabilities.hierarchical_loading,
    contract.instruction_capabilities.personal_override,
    contract.config_capabilities.user_config_path,
    contract.config_capabilities.project_config_path,
    contract.config_capabilities.profiles,
    contract.config_capabilities.override_surfaces.join(", "),
  ]);
  return markdownTable(
    [
      "Platform",
      "Root Instruction",
      "Hierarchy",
      "Personal Override",
      "User Config",
      "Project Config",
      "Profiles",
      "Invocation Overrides",
    ],
    rows,
  );
}

function renderSessionHeadlessMatrixTable(contracts) {
  const rows = Object.entries(contracts).map(([platformId, contract]) => [
    titleCase(platformId),
    contract.session_capabilities.resume,
    contract.session_capabilities.fork,
    contract.session_capabilities.headless_exec,
    contract.session_capabilities.machine_readable_output,
    contract.session_capabilities.worktree_isolation,
  ]);
  return markdownTable(
    [
      "Platform",
      "Resume",
      "Fork",
      "Headless",
      "Machine-Readable Output",
      "Worktree Isolation",
    ],
    rows,
  );
}

function renderOrchestrationMatrixTable(contracts) {
  const rows = [];
  for (const subtype of ORCHESTRATION_SUBTYPES) {
    const basePatternId = "orchestration-chain";
    rows.push([
      `\`${subtype.label}\``,
      ...Object.keys(contracts).map((platformId) => {
        const support = contracts[platformId].pattern_support.find(
          (item) => item.pattern_id === basePatternId,
        );
        return support?.support_level || "missing";
      }),
      subtype.canonical_projection,
    ]);
  }
  return markdownTable(
    [
      "Subtype",
      ...Object.keys(contracts).map((platformId) => titleCase(platformId)),
      "Canonical Projection",
    ],
    rows,
  );
}

function renderMcpBrowserMatrixTable(contracts) {
  const rows = Object.entries(contracts).map(([platformId, contract]) => [
    titleCase(platformId),
    contract.mcp_capabilities.client_surface,
    contract.mcp_capabilities.scoped_mcp,
    contract.mcp_capabilities.runtime_as_server,
    contract.mcp_capabilities.browser_verification,
  ]);
  return markdownTable(
    [
      "Platform",
      "MCP Client Surface",
      "Scoped MCP",
      "Runtime as MCP Server",
      "Browser Verification",
    ],
    rows,
  );
}

function renderBlockedPatternReportTable(contracts) {
  const blocked = [];
  for (const [platformId, contract] of Object.entries(contracts)) {
    for (const support of contract.pattern_support.filter(
      (item) => item.support_level === "blocked",
    )) {
      blocked.push([titleCase(platformId), `\`${support.pattern_id}\``, support.behavior_notes]);
    }
  }
  return blocked.length === 0
    ? "No blocked patterns. Every audited pattern is mapped as `native` or `degraded` for every supported platform."
    : markdownTable(["Platform", "Pattern", "Reason"], blocked);
}

function renderPlatformSupportSummary(contracts) {
  const rows = Object.entries(contracts).map(([platformId, contract]) => {
    const nativeCount = contract.pattern_support.filter(
      (item) => item.support_level === "native",
    ).length;
    const degradedCount = contract.pattern_support.filter(
      (item) => item.support_level === "degraded",
    ).length;
    const blockedCount = contract.pattern_support.filter(
      (item) => item.support_level === "blocked",
    ).length;
    return [
      titleCase(platformId),
      contract.runtime_family,
      String(nativeCount),
      String(degradedCount),
      String(blockedCount),
      contract.agent_capabilities.workflow_entry_surface,
    ];
  });
  return [
    "# Platform Support Matrix",
    "",
    "> Generated from the canonical Foundry parity registry and capability contracts.",
    "",
    markdownTable(
      [
        "Platform",
        "Runtime Family",
        "Native Patterns",
        "Degraded Patterns",
        "Blocked Patterns",
        "Primary Workflow Surface",
      ],
      rows,
    ),
    "",
  ].join("\n");
}

function renderPlatformCapabilityDetails(contracts) {
  return [
    "# Platform Capability Details",
    "",
    "This document consolidates the detailed parity views. Full machine-readable detail lives in the generated parity JSON files.",
    "",
    "## Pattern Support Matrix",
    "",
    "Every pattern must be present for every supported platform. `degraded` is allowed; silent omission is not.",
    "",
    markdownTable(
      [
        "Pattern",
        ...Object.keys(contracts).map((platformId) => titleCase(platformId)),
      ],
      PATTERN_REGISTRY.map((pattern) => [
        `\`${pattern.id}\``,
        ...Object.keys(contracts).map((platformId) =>
          contracts[platformId].pattern_support.find(
            (item) => item.pattern_id === pattern.id,
          )?.support_level || "missing",
        ),
      ]),
    ),
    "",
    "## Degraded Projections",
    "",
    "These entries are intentionally projected through Foundry's control plane rather than exact runtime-native UX.",
    "",
    renderDegradedProjectionMatrixTable(contracts),
    "",
    "## Safety Modes",
    "",
    renderSafetyMatrixTable(contracts),
    "",
    "## Instruction, Config, and Profiles",
    "",
    renderInstructionConfigProfileMatrixTable(contracts),
    "",
    "## Session and Execution",
    "",
    renderSessionHeadlessMatrixTable(contracts),
    "",
    "## Orchestration Subtypes",
    "",
    renderOrchestrationMatrixTable(contracts),
    "",
    "## MCP and Browser",
    "",
    renderMcpBrowserMatrixTable(contracts),
    "",
    "## Blocked Patterns",
    "",
    renderBlockedPatternReportTable(contracts),
    "",
  ].join("\n");
}

export function buildParityDocs(contracts) {
  return new Map([
    ["platform-support-matrix.md", renderPlatformSupportSummary(contracts)],
    ["cross-platform-pattern-catalog.md", renderPatternCatalog()],
    ["platform-capability-details.md", renderPlatformCapabilityDetails(contracts)],
  ]);
}

export {
  AUDITED_REFERENCES,
  ORCHESTRATION_SUBTYPES,
  PATTERN_REGISTRY,
};
