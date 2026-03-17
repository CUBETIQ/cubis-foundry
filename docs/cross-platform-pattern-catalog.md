# Cross-Platform Pattern Catalog

Generated from the canonical Foundry parity registry.

| Pattern | Category | Audited Sources | Canonical Surface |
| --- | --- | --- | --- |
| `instructions-file` | instructions | claude-audit-ref, codex-audit-ref | One primary repository instruction file is installed at the runtime's canonical path. |
| `instructions-hierarchy` | instructions | claude-audit-ref, codex-audit-ref | Foundry records load order, precedence, and monorepo behavior for each runtime. |
| `instructions-override` | instructions | codex-audit-ref, claude-audit-ref | Foundry distinguishes team-shared instructions from personal overrides. |
| `config-layering` | configuration | codex-audit-ref, claude-audit-ref | Foundry emits the user config path, project config path, and one-off override surfaces per runtime. |
| `config-profiles` | configuration | codex-audit-ref | Foundry defines review, development, unattended, and trusted presets, mapped to native profiles or degraded install-time presets. |
| `workflow-entrypoint` | workflow | claude-audit-ref, codex-audit-ref, foundry | Foundry projects workflows into native commands, prompts, or workflow skills depending on runtime. |
| `supporting-skill` | skills | claude-audit-ref, codex-audit-ref, foundry | Foundry keeps skills canonical in one source tree and projects them into runtime-specific skill surfaces. |
| `skill-discovery` | skills | claude-audit-ref, codex-audit-ref | Foundry captures skill discovery rules, precedence, and lazy/full loading behavior. |
| `skill-frontmatter` | skills | claude-audit-ref, codex-audit-ref, foundry | Foundry records the canonical frontmatter model and per-platform support level for each behavior class. |
| `skill-string-substitution` | skills | codex-audit-ref | Foundry treats string substitutions as part of the canonical skill contract and documents their runtime projection. |
| `skill-forked-execution` | skills | claude-audit-ref, codex-audit-ref | Foundry models isolated skill execution as a first-class projection, even when it degrades to agent handoff. |
| `agent-registration` | agents | claude-audit-ref, codex-audit-ref, foundry | Foundry projects specialist agents into native agent files, agent config, or generated command surfaces. |
| `specialist-agent` | agents | claude-audit-ref, codex-audit-ref, foundry | Foundry specialists remain semantically stable even when projected into different runtime surfaces. |
| `agent-preloaded-skill` | agents | claude-audit-ref, codex-audit-ref | Foundry captures preloaded-skill semantics separately from user-invocable skills. |
| `multi-agent-orchestration` | agents | claude-audit-ref, codex-audit-ref, foundry | Foundry treats multi-agent fanout as a control-plane pattern with runtime-specific execution surfaces. |
| `batch-agent-fanout` | agents | codex-audit-ref | Foundry models structured batch fanout separately from general orchestration. |
| `orchestration-chain` | workflow | claude-audit-ref, codex-audit-ref, foundry | Foundry normalizes command -> agent -> skill, skill -> skill, and orchestrator -> specialists -> validator as explicit orchestration subtypes. |
| `review-and-validation` | workflow | claude-audit-ref, codex-audit-ref, foundry | Foundry keeps validation as a first-class stage with specialist or workflow support. |
| `research-escalation` | workflow | claude-audit-ref, foundry | Foundry enforces repo-first and official-first research policy in rules, workflows, and docs. |
| `memory-loading` | memory | claude-audit-ref, codex-audit-ref, foundry | Foundry documents main memory files, specialist memory behavior, and foundation-doc loading order. |
| `project-vs-global-scope` | configuration | claude-audit-ref, codex-audit-ref, foundry | Foundry records where project and global artifacts land for every platform. |
| `hook-support` | runtime | claude-audit-ref | Foundry treats hooks as native where available and advisory rule reinforcement elsewhere. |
| `mcp-integration` | mcp | claude-audit-ref, codex-audit-ref, foundry | Foundry emits shared MCP guidance plus runtime-specific install targets. |
| `agent-scoped-mcp` | mcp | codex-audit-ref, claude-audit-ref | Foundry models scoped MCP access as a separate pattern from global MCP wiring. |
| `runtime-as-mcp-server` | mcp | codex-audit-ref | Foundry treats runtime-as-server as a first-class capability and documents gateway fallbacks elsewhere. |
| `browser-verification` | browser | claude-audit-ref, codex-audit-ref, foundry | Foundry normalizes browser verification around shared Playwright/browser MCP policy. |
| `sandbox-policy` | safety | codex-audit-ref, claude-audit-ref | Foundry defines review-safe, dev-safe, and trusted execution boundaries for each runtime. |
| `approval-policy` | safety | codex-audit-ref, claude-audit-ref | Foundry defines review, development, unattended, and trusted autonomy levels per runtime. |
| `session-resume` | session | codex-audit-ref, claude-audit-ref | Foundry models session resume separately from memory and config layering. |
| `session-fork` | session | codex-audit-ref, claude-audit-ref | Foundry models context forking as a separate workflow primitive. |
| `headless-exec` | session | codex-audit-ref, claude-audit-ref | Foundry records headless or print-mode execution support and machine-readable output support. |
| `worktree-isolation` | runtime | claude-audit-ref, codex-audit-ref | Foundry keeps worktree isolation as a first-class runtime capability. |
| `scheduled-task` | runtime | claude-audit-ref | Foundry models scheduled work as a runtime capability with degraded automation fallbacks. |
| `upstream-capability-audit` | governance | claude-audit-ref, codex-audit-ref, foundry | Foundry emits an audit artifact and generated docs that record audited references, parity impacts, and blockers. |
