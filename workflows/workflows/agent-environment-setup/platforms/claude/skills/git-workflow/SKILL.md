---
name: git-workflow
description: "Use when defining git branching, commit conventions, merge or rebase policy, release flow, or monorepo collaboration patterns."
allowed-tools: Read Grep Glob Bash Edit Write
user-invocable: true
argument-hint: "Git branching strategy, workflow, or commit concern"
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

## Claude Platform Notes

- Use `$ARGUMENTS` to access user-provided arguments passed when the skill is invoked.
- Reference skill-local files with `${CLAUDE_SKILL_DIR}/references/<file>` for portable paths.
- When `context: fork` is set, the skill runs in an isolated subagent context; the `agent` field names the fork target.
- Custom subagents live under `../../agents/` relative to the mirrored skill directory and support YAML frontmatter: `name`, `description`, `tools`, `model`, `maxTurns`, `memory`, `handoffs`.
- Use `model` field in agent frontmatter to select model per subagent (e.g., `model: opus` for complex analysis).
- Set `maxTurns` to prevent runaway iterations (default: 25, orchestrator: 30).
- Current project-memory agents are `orchestrator` and `planner`; use them for durable project context.
- Hook templates in `.claude/hooks/` provide lifecycle event integration at `UserPromptSubmit` and other events.
- Path-scoped rules live under `../../rules/` with `paths:` frontmatter for targeted guidance.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available for dynamic skill discovery and loading.
- Use `allowed-tools` in frontmatter to restrict tool access for security-sensitive skills.
- Workflow skills can be compiled to `.claude/skills/<workflow-id>/SKILL.md` as `generatedSkills`.
