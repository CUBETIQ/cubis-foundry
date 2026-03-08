# Wave 1-2 Skill Benchmarks

Date: 2026-03-09

This note records the external benchmark sources used to tighten the restored frontend, backend, architecture, and database skills after the hard reset.

## Official patterns used

- Anthropic Claude Code skills docs
  - Compact `SKILL.md` roots
  - Optional sidecars and scripts
  - Progressive disclosure instead of giant always-loaded manuals
- OpenAI Codex skills docs
  - `SKILL.md` plus optional resources/scripts
  - Keep persistent repo norms in `AGENTS.md`
  - Curated skill discipline instead of uncontrolled breadth
- GitHub Copilot Agent Skills docs
  - Skills are instruction collections with optional supporting files
  - Repo-local packaging and activation quality matter

## Public repo patterns used

- `anthropics/skills`
  - Strong trigger boundaries and small roots
- `openai/skills`
  - Catalog discipline and tiering signal
- `vercel-labs/agent-skills`
  - Narrow, practical coding specialists
- `travisvn/awesome-claude-skills`
  - High-signal curated inventory of official and community skill packages
- `VoltAgent/awesome-agent-skills`
  - Cross-agent ecosystem view with very broad community coverage
- `MoizIbnYousaf/Ai-Agent-Skills`
  - Open-standard installer/distribution signal and category breadth
- `gotalab/skillport`
  - Manage-once, serve-anywhere install and MCP portability signal
- `Microck/ordinary-claude-skills`
  - Large local-first aggregated library showing breadth, categories, and discoverability issues
- `cnemri/google-genai-skills`
  - Gemini and Google-oriented public skill packaging signal
- `fvadicamo/dev-agent-skills`
  - Lightweight development-workflow and skill-authoring plugin examples
- `vercel-labs/skills`
  - Distribution and install ergonomics signal
- `agentskills/agentskills`
  - Open specification and packaging discipline

## Version-sensitive baselines verified

- React 19.2 on official React docs
- Next.js 16 on official Next.js docs
- Current Node LTS lines on nodejs.org
- FastAPI documentation centered on modern Pydantic v2 patterns
- PlanetScale Neki announcement dated March 3, 2026

## Community and ecosystem signal reviewed

- Claude Code community discussions around skill packaging and reuse
- Google Antigravity community posts around local skill placement and discovery
- Public GitHub skill repos with coding-oriented specialists

## Expanded public-source takeaways

- The public ecosystem is much broader than the official repos alone.
- Curated lists are useful for discovering categories and emerging skill names.
- Large aggregate repos are useful for coverage and taxonomy benchmarking, but not as direct quality models.
- Installer and registry projects are useful for portability and packaging assumptions, not for canonical wording.
- The highest-quality content pattern is still: small root instructions, selective sidecars, optional scripts, clear activation boundary.

## Per-skill mapping

See [public-repo-skill-map-2026-03-09.md](D:/Cubebis%20Work/cubis-foundry/docs/agent-skills/public-repo-skill-map-2026-03-09.md) for the broader repo-to-skill mapping used in the second benchmark pass.

## Interesting future skill candidates

- `playwright-e2e`
  - recurring pattern in public coding-skill repos and useful for validation-heavy workflows
- `frontend-code-review`
  - strong fit for UI critique, accessibility, and PR review work
- `auth-architect`
  - common gap across backend and security routes
- `drizzle-expert`
  - useful if the repo keeps leaning into typed TS database stacks
- `docs-updater`
  - useful for keeping README, ADR, and change notes in sync with code changes
- `pr-creator`
  - useful if the team wants stronger GitHub/Copilot/Gemini-style PR automation surfaces

## Local policy taken from this benchmark

- Keep roots compact and procedural.
- Add `references/` only when the skill needs deeper tactical guidance.
- Do not mirror third-party text directly into the canonical source.
- Prefer one canonical skill with generated platform mirrors over hand-maintained variants.
