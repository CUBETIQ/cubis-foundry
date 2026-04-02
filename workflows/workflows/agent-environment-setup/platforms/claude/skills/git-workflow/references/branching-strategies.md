# Branching Strategies

## Overview

The branching strategy defines how code flows from a developer's machine to production. The right choice depends on team size, deployment frequency, and release constraints. There is no universally best strategy — only the best fit for a given context.

## Decision Matrix

| Factor                      | Trunk-Based              | GitHub Flow              | GitFlow                  | Release Branches         |
|-----------------------------|--------------------------|--------------------------|--------------------------|--------------------------|
| Team size                   | Any                      | 2-20                     | 10+                      | Any                      |
| Deploy frequency            | Multiple times/day       | Daily to weekly          | Scheduled releases       | Scheduled releases       |
| Environments                | 1 (production)           | 1-2                      | 3+ (dev, staging, prod)  | 2+ (staging, prod)       |
| Requires feature flags      | Yes                      | Sometimes                | No                       | No                       |
| Merge conflict frequency    | Low                      | Low-Medium               | High                     | Medium                   |
| Ceremony level              | Minimal                  | Low                      | High                     | Medium                   |
| Best for                    | SaaS, startups, CI/CD    | Small-medium teams       | Enterprise, regulated    | Libraries, mobile apps   |

## Trunk-Based Development

### How it works

All developers integrate to `main` at least once per day. Feature branches, if used, live for hours to 1-2 days maximum. Incomplete features are hidden behind feature flags.

### Key practices

1. **Commit to main frequently** — at least daily, ideally multiple times per day.
2. **Use feature flags** — wrap incomplete features so they can be merged without being visible.
3. **Keep branches under 24 hours** — if a branch lives longer, break the work into smaller pieces.
4. **Run CI on every commit** — fast feedback prevents broken main.
5. **Deploy from main** — every commit to main is a release candidate.

### When to use

- Teams practicing continuous deployment.
- Products with a single production environment.
- Teams with strong CI/CD pipelines (tests run in under 10 minutes).
- Organizations that prioritize delivery speed over release ceremony.

### When to avoid

- Teams without automated testing (broken main has no safety net).
- Products requiring long-running QA cycles before release.
- Regulated environments where each release needs formal approval.

## GitHub Flow

### How it works

`main` is always deployable. Developers create feature branches from `main`, open a pull request, get review, and merge back. Deployment happens from `main` after merge.

### Key practices

1. **Branch from main** — every feature branch starts from the latest main.
2. **Open PR early** — draft PRs enable early feedback before the work is complete.
3. **Review and merge** — one approval minimum, CI must pass.
4. **Deploy after merge** — automated deployment triggered by merge to main.
5. **Delete branches after merge** — keep the branch list clean.

### When to use

- Small to medium teams (2-20 developers).
- SaaS products with a single production environment.
- Teams that want simplicity without the overhead of GitFlow.

### When to avoid

- Teams that need to maintain multiple release versions simultaneously.
- Products with complex staging environments.

## GitFlow

### How it works

Two long-lived branches: `main` (production) and `develop` (integration). Feature branches merge into `develop`. Release branches are cut from `develop` for stabilization. Hotfix branches are cut from `main` for emergency fixes.

### Key practices

1. **Feature branches from develop** — all new work starts from `develop`.
2. **Release branches for stabilization** — cut `release/X.Y` from `develop` when ready.
3. **Hotfix branches from main** — emergency fixes go directly to `main` and are back-merged.
4. **Merge ceremonies** — release branches merge into both `main` and `develop`.

### When to use

- Large teams with scheduled release cycles.
- Products that maintain multiple versions in production.
- Regulated environments requiring formal release processes.

### When to avoid

- Teams deploying more than once a week (too much ceremony).
- Small teams (under 5 developers) where the overhead is not justified.
- Teams experiencing frequent merge conflicts (GitFlow amplifies them).

## Release Branches

### How it works

Development happens on `main` (or `develop`). When a release is imminent, a `release/X.Y` branch is cut. Only bug fixes go into the release branch. After release, the branch is tagged and deleted (or maintained for patch releases).

### Key practices

1. **Cut from main** — release branches are snapshots of main at a point in time.
2. **Cherry-pick fixes** — never merge main into a release branch. Cherry-pick specific fixes.
3. **Tag releases** — every release gets a semantic version tag.
4. **Delete after final patch** — do not accumulate stale release branches.

### When to use

- Libraries and packages that publish versioned releases.
- Mobile apps with app store review cycles.
- Products that must support multiple versions simultaneously.

### When to avoid

- SaaS products with a single production environment (overkill).
- Teams that deploy continuously (release branches add unnecessary delay).

## Anti-Patterns

### Long-lived feature branches

Branches that live for weeks accumulate merge debt. The longer a branch lives, the harder it is to merge. Break work into smaller increments.

### Merging main into feature branches

This creates noisy merge commits in the feature branch history. Rebase the feature branch onto main instead.

### Multiple integration branches

Having `develop`, `staging`, `qa`, and `main` as separate long-lived branches creates a merge cascade. Each branch diverges from the others, and fixes must be cherry-picked across all of them.

### Branch-per-environment

Mapping branches to environments (dev branch deploys to dev, staging branch deploys to staging) creates permanent divergence. Use a single branch with environment-specific configuration instead.
