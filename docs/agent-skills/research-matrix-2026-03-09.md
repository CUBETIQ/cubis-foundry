# Agent Skill Research Matrix

Updated: 2026-03-09

## Goal

Rebuild the non-language skill catalog after the hard reset using current official guidance plus broad public repo and community signals.

## Generated Outputs

- Live repo corpus: [public-skill-corpus.md](D:/Cubebis%20Work/cubis-foundry/docs/agent-skills/public-skill-corpus.md)
- Live gap matrix: [public-skill-gap-matrix.md](D:/Cubebis%20Work/cubis-foundry/docs/agent-skills/public-skill-gap-matrix.md)
- Live rewrite specs: [rewrite-specs.md](D:/Cubebis%20Work/cubis-foundry/docs/agent-skills/rewrite-specs.md)
- Machine-readable corpus: [public-skill-repo-corpus.json](D:/Cubebis%20Work/cubis-foundry/docs/agent-skills/generated/public-skill-repo-corpus.json)
- Machine-readable gap matrix: [public-skill-gap-matrix.json](D:/Cubebis%20Work/cubis-foundry/docs/agent-skills/generated/public-skill-gap-matrix.json)

## Canonical Constraints

- Keep one canonical source per skill under `workflows/skills/<id>/SKILL.md`.
- Keep root instructions short and procedural.
- Move depth into selective references, templates, scripts, or assets.
- Rewrite external ideas into Foundry-owned skills instead of copying third-party text.

## Official Sources

| Source | What to take |
| --- | --- |
| OpenAI Codex skills | Progressive disclosure, `SKILL.md` plus optional sidecars/scripts, repo-level steering in `AGENTS.md`. |
| Anthropic skills and Claude Code docs | Small bounded skills, strong trigger descriptions, explicit lifecycle-oriented skill creation. |
| GitHub Copilot agent skills docs | Repo-aware agent skill packaging and distributed workspace context. |
| Google Antigravity codelab | Event-driven rules, background automation patterns, and IDE-triggered workflows. |
| Agent Skills specification | Metadata-first portability and adapter-friendly packaging constraints. |

## Public Repo Signals

| Source | What to take |
| --- | --- |
| Vercel agent-skills | Narrow framework/runtime specialists and strong production guardrails. |
| Vercel skills | Cross-agent install/sync expectations and portable packaging ideas. |
| Skillport | Multi-agent catalog and install ergonomics. |
| OpenSkills | Coverage breadth and discoverable topic taxonomy. |
| skills-cli | CLI-first packaging and distribution ideas. |
| Ai-Agent-Skills | Community breadth for framework and domain skill demand. |

## Community Signals

- Reddit demand is strongest around Claude Code, Codex, Antigravity, and generic AI-agent workflow portability.
- Repeated themes: frontend stacks, backend stacks, system design, database operations, code review/security, and agent automation.
- Community signal should rank what to rebuild first, but not define schema or canonical wording.

## Rebuild Waves

1. Frontend and backend
   `react-expert`, `nextjs-developer`, `tailwind-patterns`, `frontend-design`, `design-system-builder`, `nodejs-best-practices`, `nestjs-expert`, `fastapi-expert`, `graphql-architect`, `api-designer`, `api-patterns`, `web-perf`
2. System design and databases
   `architecture-designer`, `microservices-architect`, `database-skills`, `database-design`, `database-optimizer`, `postgres`, `mysql`, `sqlite`, `mongodb`, `redis`, `supabase`, `vitess`, `neki`
3. Automation and agent tooling
   `workflow-designer`, `agent-designer`, `parallel-agents`, `sub-agents`, `repo-maintainer`, `research-scout`, `issue-triage`, `ci-failure-triage`, `release-brief`
4. Long-tail verticals
   mobile, game, SEO/GEO, observability, documentation, security/testing specialists, and remaining verticals

## Seed Catalog After Reset

- `skill-creator`
- `typescript-pro`
- `javascript-pro`
- `python-pro`
- `golang-pro`
- `java-pro`
- `csharp-pro`
- `kotlin-pro`
- `rust-pro`
- `dart-pro`
- `php-pro`
- `ruby-pro`
- `swift-pro`
- `c-pro`
- `cpp-pro`
