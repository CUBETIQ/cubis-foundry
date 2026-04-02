# Example: Migrate from GitFlow to Trunk-Based Development

## Scenario

A 12-person team running GitFlow with `develop`, `release/*`, and `hotfix/*` branches. PRs average 4 days to merge. Merge conflicts occur on 40% of PRs. The team deploys weekly but wants to move to continuous delivery.

## User Prompt

> We're drowning in merge conflicts with GitFlow. We have 12 developers, deploy weekly, and want to move to continuous delivery. How do we migrate without disrupting ongoing work?

## Expected Response

### Assessment

GitFlow's long-lived `develop` branch is the primary source of merge pain. With 12 developers and a weekly deploy cadence, the integration delay between feature completion and release creates a backlog of conflicts. Trunk-based development eliminates this by making `main` the single integration point.

### Migration Plan

**Phase 1: Preparation (Week 1)**

1. Audit all open branches — identify any that are older than 1 week and plan to merge or close them.
2. Set up feature flag infrastructure (LaunchDarkly, Unleash, or environment variables).
3. Configure branch protection on `main`:
   - Require 1 approval
   - Require CI to pass
   - Require branch to be up to date
   - Enable merge queue
4. Create a PR template with: What, Why, How to Test, Feature Flag (if applicable).

**Phase 2: Parallel Run (Weeks 2-3)**

5. New features start as short-lived branches off `main` (not `develop`).
6. Existing in-flight work on `develop` continues until merged.
7. Set a 2-day maximum branch lifetime target. PRs exceeding this get flagged.
8. Daily rebase reminders via Slack bot or CI check.

**Phase 3: Cutover (Week 4)**

9. Merge `develop` into `main` one final time.
10. Delete `develop`, `release/*`, and `hotfix/*` branches.
11. Update CI/CD to deploy from `main` on every merge.
12. Communicate the new workflow in CONTRIBUTING.md.

**Phase 4: Optimization (Ongoing)**

13. Monitor PR cycle time — target under 24 hours from open to merge.
14. Monitor merge conflict rate — target under 10% of PRs.
15. Adopt squash merge as default to keep `main` history clean.
16. Set up automated changelog generation from conventional commits.

### Branch Protection Configuration (GitHub)

```json
{
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true
  },
  "required_status_checks": {
    "strict": true,
    "contexts": ["ci/test", "ci/lint", "ci/build"]
  },
  "enforce_admins": true,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
```

### Rollback Plan

If the team experiences more problems after migration than before:

1. Re-create `develop` from `main`.
2. Route new PRs to `develop` again.
3. Investigate root cause (likely missing feature flags or insufficient CI).
4. Re-attempt migration after addressing the root cause.

## Why This Response Works

- Identifies the root cause (long-lived `develop` branch), not just the symptom (merge conflicts).
- Provides a phased migration that does not disrupt ongoing work.
- Includes measurable success criteria (PR cycle time, conflict rate).
- Addresses the feature flag prerequisite that most trunk-based migration guides skip.
- Includes a rollback plan, which builds team confidence in the change.
