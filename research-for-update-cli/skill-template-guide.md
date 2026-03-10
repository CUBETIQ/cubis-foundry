I did the deep search, and the cleanest way to think about this is:

- **Codex**: supports **Skills** and also the lighter-weight **AGENTS.md** style for repo guidance. OpenAI says Skills are supported in Codex and follow the open Agent Skills standard. ([OpenAI Help Center][1])
- **Claude Code**: its first-party docs center on **CLAUDE.md** for persistent project instructions and **subagents** for specialized agent behavior; Anthropic’s official `anthropics/skills` repo shows the open **SKILL.md** skill format for Claude as well. ([Claude API Docs][2])
- **GitHub Copilot**: supports both **Agent Skills** (`SKILL.md`) and repo instruction files like `.github/copilot-instructions.md`, `.github/instructions/*.instructions.md`, `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md`. ([GitHub Docs][3])
- **Google Antigravity**: in the official Google material I found, customization is documented primarily as **Rules** and **Workflows**, stored in `GEMINI.md` and `.agents/workflows`. The Google blog also positions Antigravity as an agent-first platform with artifacts and cross-platform availability. ([Google Codelabs][4])

So below I’m giving you **all the practical template samples** you can copy.

## 1) Universal portable Agent Skill template

This is the best cross-platform starting point when you want one reusable skill shape that maps well to Codex and Copilot, and also aligns with Anthropic’s official skill examples. OpenAI says its skills follow the open Agent Skills standard, GitHub says Agent Skills are an open standard, and Anthropic’s official repo uses the same `SKILL.md` pattern. ([OpenAI Help Center][1])

```md
your-skill/
├── SKILL.md
├── scripts/
│ └── run.sh
├── references/
│ └── checklist.md
└── assets/
└── example-output.txt
```

```md
---
name: api-bug-triage
description: investigate failing api endpoints, reproduce issues, collect logs, suggest fixes, and verify the repair. use when asked to debug backend failures, flaky endpoints, or recurring api regressions.
license: mit
---

# API Bug Triage

Use this skill when the task is to diagnose, reproduce, or fix backend/API failures.

## Goals

- Reproduce the bug before changing code.
- Minimize blast radius.
- Prefer the smallest fix that resolves the root cause.
- Leave clear evidence: logs, test output, and changed files.

## Workflow

1. Identify the failing endpoint and expected behavior.
2. Find the relevant code path, tests, and runtime config.
3. Reproduce the failure locally or with the provided script.
4. Inspect logs, stack traces, and recent related changes.
5. Propose the most likely root cause.
6. Implement the smallest safe fix.
7. Add or update tests.
8. Re-run validation and summarize results.

## Validation

- Run the existing backend test suite for the touched area.
- Add a regression test when possible.
- Do not claim success unless the failure is reproduced or strongly validated another way.

## Resources

- See `references/checklist.md` for debugging checklist.
- Use `scripts/run.sh` for the standard local validation flow.

## Output format

Return:

- probable root cause
- files changed
- tests run
- remaining risks
```

## 2) Universal `AGENTS.md` template

This is the best lightweight repo-level template when you want broad compatibility. OpenAI’s `agents.md` repo describes `AGENTS.md` as “a simple, open format for guiding coding agents,” and gives a minimal example with dev environment tips, testing instructions, and PR instructions. GitHub Copilot also explicitly supports `AGENTS.md`. ([GitHub][5])

```md
# AGENTS.md

## Project overview

- This repository is a TypeScript monorepo for internal web services.
- Main apps live in `apps/`.
- Shared packages live in `packages/`.

## Dev environment tips

- Install dependencies with `pnpm install`.
- Use `pnpm turbo run dev --filter <project>` for local development.
- Prefer `rg` over `grep` for code search.

## Code rules

- TypeScript strict mode only.
- Do not use `any` unless explicitly justified in a code comment.
- Prefer small pure functions over large class methods.
- Keep API validation at the boundary layer.

## Testing instructions

- Run targeted tests first: `pnpm test --filter <project>`.
- Run lint before finalizing: `pnpm lint --filter <project>`.
- Add or update tests for behavior changes.

## Safety

- Do not modify database schema without approval.
- Do not rotate secrets or edit deployment credentials.
- Do not delete files unless the task explicitly requires it.

## PR instructions

- Summarize root cause, fix, and validation.
- Include any follow-up work if the fix is partial.
```

## 3) Codex template samples

### A. Codex portable Skill

OpenAI says Skills are supported in Codex and the Codex app can create, manage, and share them. ([OpenAI Help Center][1])

Recommended location if you want a portable local convention:

```text
.codex/skills/api-bug-triage/SKILL.md
```

Use the **Universal portable Agent Skill template** above.

### B. Codex repo guidance with `AGENTS.md`

OpenAI’s Codex launch materials explicitly say Codex can be guided by `AGENTS.md` files placed in the repo. ([OpenAI][6])

```md
# AGENTS.md

## Role

You are a senior full-stack engineer working in this repository.

## What matters here

- Reliability over cleverness.
- Keep diffs small.
- Preserve existing public API behavior unless the prompt asks for a breaking change.

## Commands

- Install: `pnpm install`
- Dev: `pnpm dev`
- Test: `pnpm test`
- Lint: `pnpm lint`

## When changing backend code

- Validate request and response shapes.
- Add a regression test for bug fixes.
- Avoid hidden side effects.

## When changing frontend code

- Keep accessibility intact.
- Preserve keyboard navigation.
- Prefer existing design system components.

## Done definition

- Code compiles
- Tests pass for changed scope
- Brief summary of risk is included
```

## 4) Claude Code template samples

### A. `CLAUDE.md` project memory template

Anthropic’s docs say `CLAUDE.md` files are the main way to give Claude persistent project instructions, and they can live at `./CLAUDE.md` or `./.claude/CLAUDE.md`. ([Claude API Docs][2])

```md
# CLAUDE.md

## Project context

This is a Python FastAPI service with PostgreSQL and Redis.

## Architecture

- API routes: `app/api/`
- Services: `app/services/`
- Models: `app/models/`
- Tests: `tests/`

## Standards

- Follow existing FastAPI dependency injection patterns.
- Use pydantic models for request and response validation.
- Keep business logic out of route handlers.

## Commands

- Install: `uv sync`
- Run app: `uv run uvicorn app.main:app --reload`
- Tests: `uv run pytest`
- Lint: `uv run ruff check .`

## Constraints

- Do not change DB migrations without explicit approval.
- Do not introduce new dependencies unless necessary.
- Add or update tests for all behavior changes.

## Review checklist

- Did we reproduce the bug?
- Did we add a regression test?
- Did we avoid broad refactors?
```

### B. Claude Code custom subagent template

Anthropic’s docs say subagents are specialized assistants with their own context window, custom system prompt, and optional tool restrictions. ([Claude API Docs][7])

```md
---
name: code-reviewer
description: review recent code changes for correctness, readability, edge cases, and missing tests. use when asked to review a diff, audit a fix, or inspect implementation quality.
tools: Read,Grep,Glob,Bash
model: sonnet
---

You are a focused code review subagent.

Responsibilities:

- Review changed files only unless wider context is required.
- Look for correctness issues first, then maintainability, then style.
- Flag missing tests for changed behavior.
- Prefer concrete findings over vague suggestions.

Output format:

- critical issues
- likely bugs
- test gaps
- optional improvements
```

### C. Claude Skill template

Anthropic’s official `anthropics/skills` repo describes skills as folders with instructions, scripts, and resources, each with a `SKILL.md` file and YAML frontmatter. ([GitHub][8])

Use the same `SKILL.md` template from section 1, with this Claude-style layout:

```text
.claude/skills/api-bug-triage/
  SKILL.md
  scripts/run.sh
  references/checklist.md
```

## 5) GitHub Copilot template samples

### A. Copilot Agent Skill

GitHub’s docs say agent skills are folders of instructions, scripts, and resources; for project skills use `.github/skills` or `.claude/skills`, and for personal skills use `~/.copilot/skills` or `~/.claude/skills`. `SKILL.md` must have YAML frontmatter with `name` and `description`, and optionally `license`. ([GitHub Docs][9])

```text
.github/skills/github-actions-failure-debugging/
  SKILL.md
```

```md
---
name: github-actions-failure-debugging
description: guide for debugging failing github actions workflows. use this when asked to debug failing github actions workflows.
license: mit
---

To debug failing GitHub Actions workflows:

1. Inspect recent workflow runs and identify the failed jobs.
2. Summarize the failure before making changes.
3. Reproduce locally if practical.
4. Apply the smallest safe fix.
5. Re-run relevant tests and checks.
6. Summarize root cause, fix, and validation.
```

### B. Copilot repo-wide custom instructions

GitHub documents `.github/copilot-instructions.md` as the repository-wide instructions file. ([GitHub Docs][10])

```md
# .github/copilot-instructions.md

- Prefer minimal diffs.
- Follow existing project structure and naming.
- Use existing utility functions before adding new helpers.
- Add tests for behavior changes.
- Do not modify CI, infra, or secrets unless explicitly requested.
```

### C. Copilot path-specific instructions

GitHub documents `.github/instructions/NAME.instructions.md` with `applyTo` frontmatter for path-specific rules. ([GitHub Docs][10])

```md
---
applyTo: "src/api/**/*.ts"
---

# API instructions

- Validate all input with zod.
- Return typed error responses.
- Keep route handlers thin.
- Put business logic in service modules.
```

### D. Copilot agent instruction file

GitHub also supports `AGENTS.md`, and alternatively a single root `CLAUDE.md` or `GEMINI.md`. ([GitHub Docs][10])

```md
# AGENTS.md

## Priority rules

- Use existing npm scripts only.
- Never bypass tests to make CI pass.
- Preserve public API contracts.
- Ask for approval before touching schema or infra files.

## Validation

- `npm test`
- `npm run lint`
- `npm run typecheck`
```

## 6) Google Antigravity template samples

This is the one place where the official docs I found are **not framed around `SKILL.md` first**. Google’s first-party codelab documents **Rules** and **Workflows** instead:

- global rule: `~/.gemini/GEMINI.md`
- global workflow: `~/.gemini/antigravity/global_workflows/<YOUR_WORKFLOW_NAME>.md`
- workspace rules: `your-workspace/.agents/rules/`
- workspace workflows: `your-workspace/.agents/workflows/` ([Google Codelabs][4])

### A. Antigravity global rule template (`GEMINI.md`)

```md
# GEMINI.md

## Project context

This repository is a Next.js application with a Python API backend.

## Rules

- Keep frontend and backend concerns separated.
- Follow existing linting and formatting rules.
- Prefer incremental edits to large rewrites.
- Add comments only when they explain non-obvious logic.

## Safety

- Never modify secrets, deployment config, or schema migrations without approval.
- Do not delete files unless the task explicitly calls for it.

## Validation

- Run the relevant tests for changed files.
- Summarize what was verified.
```

### B. Antigravity workspace rule template

```md
# .agents/rules/code-style-guide.md

- Use strict typing whenever available.
- Keep functions short and single-purpose.
- Preserve existing naming conventions.
- Prefer readable code over clever abstractions.
```

### C. Antigravity workflow template

Google’s codelab says workflows are “saved prompts that you can trigger on demand with `/`.” ([Google Codelabs][4])

```md
# .agents/workflows/generate-unit-tests.md

- Generate unit tests for each changed file and each changed public method.
- Name tests consistently with the source file.
- Cover happy path, edge cases, and one failure case.
- Do not rewrite production code unless needed to make the code testable.
- Return a summary of created and updated tests.
```

### D. Antigravity “skill-like” portable template

Because Antigravity is part of the broader agent ecosystem, a portable `SKILL.md` may still be useful in mixed-tool setups. But based on the official Google sources I found, I would treat this as **open-standard/community-compatible**, not the primary first-party documented customization surface. The first-party docs I found emphasize rules, workflows, artifacts, and agent orchestration. ([Google Developers Blog][11])

```md
---
name: ui-walkthrough-review
description: review ui changes by checking screenshots, walkthrough artifacts, and browser recordings. use when validating frontend changes or asking for visual verification.
---

# UI Walkthrough Review

1. Inspect screenshots and walkthrough artifacts.
2. Compare changed UI against the requested outcome.
3. Identify regressions in layout, accessibility, or interaction.
4. Suggest precise fixes.
5. Summarize approval status and remaining issues.
```

## 7) Best mapping by platform

Use this cheat sheet:

- **Codex**
  - best for reusable task modules: `SKILL.md`
  - best for repo-level behavior: `AGENTS.md` ([OpenAI Help Center][1])

- **Claude Code**
  - best for persistent project behavior: `CLAUDE.md`
  - best for specialized agent personas: subagents
  - best for reusable task packs: `SKILL.md` skills ([Claude API Docs][2])

- **GitHub Copilot**
  - best for task modules: `.github/skills/<name>/SKILL.md`
  - best for repo defaults: `.github/copilot-instructions.md`
  - best for path-specific behavior: `.github/instructions/*.instructions.md`
  - can also use `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` ([GitHub Docs][3])

- **Google Antigravity**
  - best official customization surface I found: `GEMINI.md`, `.agents/rules/`, `.agents/workflows/`
  - workflows behave like saved prompts you trigger with `/` ([Google Codelabs][4])

## 8) My practical recommendation

If you want one format that travels best across tools, start with:

1. **`AGENTS.md`** for repo-wide defaults
2. **`SKILL.md`** folders for reusable specialized workflows
3. Add **tool-native overlays** only where needed:
   - `CLAUDE.md` for Claude Code
   - `.github/copilot-instructions.md` and `.github/instructions/*` for Copilot
   - `GEMINI.md` plus `.agents/workflows/` for Antigravity ([GitHub][5])

If you want, I can turn this into a **ready-to-copy starter pack** with actual folders and files for all 4 platforms in one repo layout.

[1]: https://help.openai.com/en/articles/20001066-skills-in-chatgpt "Skills in ChatGPT | OpenAI Help Center"
[2]: https://docs.anthropic.com/en/docs/claude-code/memory "How Claude remembers your project - Claude Code Docs"
[3]: https://docs.github.com/en/enterprise-cloud%40latest/copilot/how-tos/use-copilot-agents/coding-agent/create-skills "Creating agent skills for GitHub Copilot - GitHub Enterprise Cloud Docs"
[4]: https://codelabs.developers.google.com/getting-started-google-antigravity "Getting Started with Google Antigravity  |  Google Codelabs"
[5]: https://github.com/openai/agents.md "GitHub - agentsmd/agents.md: AGENTS.md — a simple, open format for guiding coding agents · GitHub"
[6]: https://openai.com/index/introducing-codex/?utm_source=chatgpt.com "Introducing Codex | OpenAI"
[7]: https://docs.anthropic.com/en/docs/claude-code/sub-agents "Create custom subagents - Claude Code Docs"
[8]: https://github.com/anthropics/skills?utm_source=chatgpt.com "GitHub - anthropics/skills: Public repository for Agent Skills"
[9]: https://docs.github.com/en/copilot/concepts/agents/about-agent-skills "About agent skills - GitHub Docs"
[10]: https://docs.github.com/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot "Adding repository custom instructions for GitHub Copilot - GitHub Docs"
[11]: https://developers.googleblog.com/en/build-with-google-antigravity-our-new-agentic-development-platform/ "
            
            Build with Google Antigravity, our new agentic development platform
            
            
            - Google Developers Blog
            
        "
