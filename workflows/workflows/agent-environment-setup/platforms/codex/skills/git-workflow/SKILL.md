---
name: git-workflow
description: "Use when defining git branching, commit conventions, merge or rebase policy, release flow, or monorepo collaboration patterns."
---
# Git Workflow

## Purpose

Guide teams toward efficient, low-friction git workflows that keep history clean, reduce merge pain, and support continuous delivery. This skill synthesizes branching strategies, commit conventions, merge policies, code review flow, and release management into a cohesive practice.

## When to Use

- Setting up a new repository's branching and merge strategy
- Choosing between trunk-based development, GitHub Flow, or GitFlow
- Writing or reviewing commit messages for conventional commits compliance
- Deciding between rebase, squash-merge, or merge commits
- Designing a code review flow (reviewer assignment, approval gates, SLAs)
- Planning release management, tagging, and changelog generation
- Configuring monorepo tooling (Turborepo, Nx, Lerna) and change detection
- Establishing branch protection rules and CI gating
- Migrating from one branching model to another
- Troubleshooting merge conflicts, diverged histories, or stale branches

## Instructions

1. **Identify team context** — ask about team size, deployment cadence, and current pain points, because the right branching strategy depends on how the team ships, not on theory alone.
2. **Select a branching model** — recommend trunk-based development for teams deploying multiple times per day, GitHub Flow for teams with single-environment SaaS, and release branches only when regulatory or multi-version support demands it, because mismatched models create unnecessary ceremony.
3. **Enforce short-lived branches** — set a target of 1-2 days maximum branch lifetime, because branches that live longer than 3 days have exponentially higher merge conflict rates and integration risk.
4. **Adopt conventional commits** — use the `type(scope): description` format with types `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, because structured commits enable automated changelog generation and semantic versioning.
5. **Write commit messages that explain WHY** — keep the subject under 72 characters in imperative mood, put the rationale in the body, and limit each commit to one logical change, because the diff already shows what changed.
6. **Choose merge strategy by context** — default to squash merge for feature PRs to keep main clean, use merge commits when preserving individual commit authorship matters, and use rebase merge only for small, clean branches, because inconsistent merge strategies make history unreadable.
7. **Prefer rebase over merge for branch updates** — rebase feature branches onto main instead of merging main into feature branches, because merge commits from upstream pollute the feature branch history and obscure the actual changes.
8. **Set up branch protection rules** — require at least one PR review, require CI status checks to pass, require branches to be up to date before merge, disable force push to main, and enable merge queues for high-traffic repos, because unprotected branches are the single largest source of production incidents from bad merges.
9. **Design code review flow** — assign reviewers by domain ownership (CODEOWNERS), set a 4-hour review SLA during business hours, and keep PRs under 400 lines of meaningful change, because large PRs get rubber-stamped and slow PRs kill velocity.
10. **Manage releases with tags and automation** — tag releases from main using semantic versioning, generate changelogs from conventional commits, and use release branches only for hotfixes to previous versions, because manual release processes are error-prone and slow.
11. **Configure monorepo change detection** — use path-based triggers (Turborepo, Nx affected) to run only relevant CI jobs, scope conventional commit scopes to package names, and use workspace-aware versioning, because full-repo CI runs on every commit make monorepos unworkable at scale.
12. **Handle merge conflicts systematically** — pull and rebase frequently (at least daily), resolve conflicts in the feature branch (never in main), and use `git rerere` to remember conflict resolutions, because ad-hoc conflict resolution leads to lost changes and subtle bugs.
13. **Clean up stale branches** — delete branches after merge, run a weekly sweep for branches older than 30 days, and archive long-running branches that cannot be merged yet, because stale branches confuse the team and clutter tooling.
14. **Document the workflow** — maintain a CONTRIBUTING.md with branching model, commit conventions, PR template, and merge policy, because undocumented workflows lead to inconsistency as the team grows.
15. **Audit and iterate** — review merge frequency, PR cycle time, and conflict rate monthly, because workflow problems compound silently until they become team-wide bottlenecks.

## Output Format

When advising on git workflows, provide:

1. **Recommended strategy** — the branching model with rationale tied to the team's context
2. **Configuration** — specific GitHub/GitLab settings, branch protection rules, and CI triggers
3. **Commit and PR templates** — ready-to-use templates matching the chosen conventions
4. **Migration plan** — if changing from an existing workflow, step-by-step migration with rollback points
5. **Checklist** — a verification checklist the team can use during the transition

## References

| File | Purpose |
|------|---------|
| `references/branching-strategies.md` | Detailed comparison of trunk-based, GitHub Flow, GitFlow, and release branch models with decision criteria |
| `references/commit-conventions.md` | Conventional Commits specification, semantic versioning integration, and commit message templates |
| `references/rebase-merge.md` | When to rebase vs merge vs squash, interactive rebase workflows, and conflict resolution strategies |
| `references/release-management.md` | Release tagging, changelog generation, hotfix workflows, and semantic versioning automation |
| `references/monorepo.md` | Monorepo branching, path-based CI, workspace versioning, and change detection tooling |

## Codex Platform Notes

- Codex supports native subagents via `.codex/agents/*.toml` files with `name`, `description`, and `developer_instructions`.
- Each subagent TOML can specify `model` and `model_reasoning_effort` to optimize cost per task difficulty:
  - Light tasks (exploration, docs): `model = "gpt-5.3-codex-spark"`, `model_reasoning_effort = "medium"`
  - Heavy tasks (security audit, orchestration): `model = "gpt-5.4"`, `model_reasoning_effort = "high"`
  - Standard tasks (implementation): inherit parent model (omit `model` field).
- Built-in agents: `default`, `worker`, `explorer`. Custom agents extend these via TOML definitions.
- Codex operates under network restrictions — skills should not assume outbound HTTP access.
- Use `$ARGUMENTS` to access user-provided arguments when the skill is invoked.
- All skill guidance executes within the sandbox; file I/O is confined to the workspace.
- Skills are installed at `.agents/skills/<skill-id>/SKILL.md`. Workflow skills can also be compiled to `.agents/skills/<workflow-id>/SKILL.md` as `generatedSkills`.
- Codex supports three autonomy levels: `suggest`, `auto-edit`, `full-auto`.
- MCP skill tools are available when the Cubis Foundry MCP server is connected.
