# Pipeline Security Checklist

## Supply chain hardening

- [ ] Pin all GitHub Actions to full commit SHA, not version tags
- [ ] Audit third-party actions before adoption — read the source
- [ ] Prefer official actions (`actions/*`) and verified publishers
- [ ] Use Dependabot or Renovate to track action version updates
- [ ] Enable GitHub's dependency graph and secret scanning on the repository

## Permissions

- [ ] Set top-level `permissions: read-all` or `permissions: {}` as default
- [ ] Grant write permissions per-job, not per-workflow
- [ ] Never use `permissions: write-all`
- [ ] Scope `GITHUB_TOKEN` to minimum required permissions per job
- [ ] Use separate service accounts for production deployments

## Secrets management

- [ ] Store secrets in GitHub repository/organization secrets, not in workflow files
- [ ] Rotate secrets on a schedule (90 days recommended)
- [ ] Use environment-scoped secrets for production credentials
- [ ] Never echo, log, or expose secrets in workflow output
- [ ] Use OIDC (`id-token: write`) for cloud provider auth instead of long-lived credentials

## Branch protection

- [ ] Require status checks before merge
- [ ] Require pull request reviews (1+ approver)
- [ ] Enforce signed commits on main/release branches
- [ ] Disable force push to protected branches
- [ ] Use merge queue to serialize deployments

## Build provenance (SLSA)

- [ ] Generate SLSA provenance attestations for release artifacts
- [ ] Sign container images with cosign or Notation
- [ ] Publish SBOMs for distributed artifacts
- [ ] Use hermetic builds when possible — no network access during build step
- [ ] Tag release artifacts with the exact commit SHA

## Audit trail

- [ ] Log all deployment events with actor, timestamp, commit, and environment
- [ ] Retain workflow logs for compliance period (minimum 90 days)
- [ ] Alert on failed production deployments
- [ ] Track who approved gated deployments
- [ ] Review workflow run permissions monthly

## Self-hosted runner hardening

- [ ] Use ephemeral runners — do not reuse runner state between jobs
- [ ] Run self-hosted runners in isolated VMs or containers
- [ ] Do not run untrusted code (fork PRs) on self-hosted runners
- [ ] Keep runner software and OS packages updated
- [ ] Restrict network access from runners to required endpoints only
