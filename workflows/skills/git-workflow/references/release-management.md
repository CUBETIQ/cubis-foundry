# Release Management

## Overview

Release management bridges the gap between "code is merged" and "code is in production." A good release process is automated, auditable, and recoverable. Manual release processes are the single largest source of deployment delays and human error.

## Semantic Versioning

### Format

```
MAJOR.MINOR.PATCH[-prerelease][+build]
```

- **MAJOR** — incompatible API changes (breaking changes).
- **MINOR** — new functionality, backward-compatible.
- **PATCH** — bug fixes, backward-compatible.
- **Pre-release** — `1.2.0-alpha.1`, `1.2.0-beta.3`, `1.2.0-rc.1`.
- **Build metadata** — `1.2.0+build.123` (informational, does not affect precedence).

### Version Bump Rules

| Commit Type       | Version Bump | Example              |
|-------------------|--------------|----------------------|
| `feat`            | MINOR        | 1.2.0 -> 1.3.0      |
| `fix`             | PATCH        | 1.2.0 -> 1.2.1      |
| `perf`            | PATCH        | 1.2.0 -> 1.2.1      |
| `BREAKING CHANGE` | MAJOR        | 1.2.0 -> 2.0.0      |
| Other types       | No bump      | 1.2.0 -> 1.2.0      |

### Pre-1.0.0 Semantics

Before version 1.0.0, the API is considered unstable:
- MINOR bumps may contain breaking changes.
- Use `0.x.y` during initial development.
- Graduate to `1.0.0` when the API is stable and publicly documented.

## Release Workflows

### Continuous Deployment (Recommended for SaaS)

Every merge to main is a release candidate. Deployment is automatic.

```
Developer -> PR -> Review -> Merge to main -> CI/CD -> Production
```

**Key practices**:
1. Tag releases automatically using the conventional commit history.
2. Generate changelogs on each release.
3. Use feature flags to control feature visibility independently of deployment.
4. Monitor deployments with automated rollback on error rate spikes.

### Scheduled Releases

Releases happen on a fixed cadence (weekly, biweekly, monthly).

```
Developer -> PR -> Merge to main -> ... -> Cut release branch -> QA -> Tag -> Deploy
```

**Key practices**:
1. Cut a `release/X.Y` branch from main at the scheduled time.
2. Only bug fixes go into the release branch (cherry-picked from main).
3. Never merge main into the release branch.
4. Tag the release branch when QA is complete.
5. Delete the release branch after the final patch version.

### Hotfix Workflow

Emergency fixes that cannot wait for the next scheduled release.

```
Identify bug -> Branch from release tag -> Fix -> Review -> Tag patch -> Deploy -> Cherry-pick to main
```

**Key practices**:
1. Branch from the production release tag, not from main.
2. Apply the minimal fix — do not include unrelated changes.
3. Tag a new patch version (e.g., `v1.2.1`).
4. Deploy the patch immediately.
5. Cherry-pick the fix to main so it is not lost in future releases.
6. Document the hotfix in the changelog.

## Changelog Generation

### Automated from Conventional Commits

Tools like `standard-version`, `semantic-release`, and `changesets` parse commit history to generate changelogs.

**Example output**:

```markdown
## [1.3.0] - 2025-03-15

### Features
- **auth**: add OAuth2 PKCE flow (#234)
- **api**: add pagination to /users endpoint (#228)

### Bug Fixes
- **ui**: fix modal close button not responding on mobile (#231)
- **api**: handle null user in auth middleware (#229)

### Performance
- **db**: add index on users.email for login queries (#230)
```

### Changelog Best Practices

1. **Group by type** — features, fixes, performance in separate sections.
2. **Link to PRs** — every entry should link to the PR or issue.
3. **Include breaking changes prominently** — breaking changes get their own section at the top.
4. **Exclude noise** — docs, test, ci, and chore commits do not appear in the public changelog.
5. **Keep entries user-focused** — "fix modal close button" not "fix onClick handler in Modal component."

## Tagging Strategy

### Tag format

```
v{MAJOR}.{MINOR}.{PATCH}
```

Examples: `v1.0.0`, `v1.2.3`, `v2.0.0-beta.1`.

### Tagging process

```bash
# Create an annotated tag (preferred over lightweight tags)
git tag -a v1.3.0 -m "Release v1.3.0: OAuth2 PKCE, pagination, mobile fixes"

# Push the tag
git push origin v1.3.0
```

### Tag-triggered CI/CD

Configure CI to trigger deployments on tag push:

```yaml
on:
  push:
    tags:
      - 'v*'
```

This separates the "merge to main" event (runs tests) from the "create release" event (deploys to production).

## Release Checklist

Before every release:

- [ ] All CI checks pass on the release commit
- [ ] Changelog is generated and reviewed
- [ ] Version numbers are bumped in package.json / pyproject.toml / etc.
- [ ] Breaking changes are documented in migration guides
- [ ] Database migrations are backward-compatible (for zero-downtime deploys)
- [ ] Feature flags for incomplete work are set to off
- [ ] Monitoring dashboards are open during deployment
- [ ] Rollback procedure is documented and tested

## Rollback Strategies

### Revert commit

```bash
git revert <bad-commit-sha>
git push origin main
```

Safest option. Creates a new commit that undoes the change. History is preserved.

### Redeploy previous version

```bash
git checkout v1.2.3
# Trigger deployment pipeline
```

Fastest option for emergencies. Deploy the last known good tag.

### Feature flag disable

If the problematic feature is behind a flag, disable the flag immediately. No code change or deployment needed. This is the fastest possible rollback.
