# Pipeline Security Reference

## Threat Model

CI/CD pipelines are high-value targets because they have write access to production infrastructure, access to deployment secrets, and run arbitrary code from pull requests.

### Attack Vectors

| Vector | Risk | Mitigation |
|--------|------|------------|
| Compromised dependency | Malicious code in `npm install` | Lockfile pinning, dependency review |
| Action tag hijacking | Attacker overwrites a mutable tag | Pin actions to SHA digests |
| PR from fork | Untrusted code accesses secrets | `pull_request_target` restrictions |
| Secret exfiltration | Logs or outputs expose secrets | Minimal secret scope, audit logs |
| Supply chain injection | MITM during package download | Checksums, SRI, registry mirrors |

## Secret Management

### GitHub Actions Secrets

```yaml
# Environment-scoped secrets (recommended for deployment)
jobs:
  deploy:
    environment: production
    steps:
      - run: deploy --token ${{ secrets.DEPLOY_TOKEN }}
        # DEPLOY_TOKEN is only available in the 'production' environment

# Repository-scoped secrets (for CI steps)
      - run: npm test
        env:
          API_KEY: ${{ secrets.TEST_API_KEY }}
```

### Secret Hygiene Rules

| Rule | Implementation |
|------|---------------|
| Never echo secrets | `echo "::add-mask::$SECRET"` for dynamic values |
| Rotate regularly | Automate rotation via API; 90-day max lifetime |
| Scope narrowly | Use environment secrets, not org-level |
| Audit access | Review secret access logs monthly |
| Detect leaks | Enable GitHub secret scanning and push protection |

### OIDC Federation (Recommended for Cloud)

Replace static credentials with short-lived tokens via OpenID Connect.

```yaml
permissions:
  id-token: write
  contents: read

steps:
  - uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::123456789:role/github-ci
      aws-region: us-east-1
      # No static AWS_ACCESS_KEY_ID needed
```

**Supported providers:** AWS, GCP, Azure, Vault, all support GitHub Actions OIDC.

## Action Version Pinning

### Why Pin to SHA

```yaml
# UNSAFE: Tag can be overwritten by attacker
- uses: actions/checkout@v4

# SAFE: SHA is immutable
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1
```

### Automated Pinning with Dependabot

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
    commit-message:
      prefix: "ci"
```

### Pinning Verification

Use `step-security/harden-runner` to detect unexpected network calls from actions:

```yaml
steps:
  - uses: step-security/harden-runner@v2
    with:
      egress-policy: audit    # 'block' in strict mode
  - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11
```

## Dependency Security Scanning

### GitHub Dependency Review

```yaml
- uses: actions/dependency-review-action@v4
  with:
    fail-on-severity: high
    deny-licenses: GPL-3.0, AGPL-3.0
```

### Container Image Scanning

```yaml
- uses: aquasecurity/trivy-action@master
  with:
    image-ref: myapp:${{ github.sha }}
    format: sarif
    output: trivy-results.sarif
    severity: CRITICAL,HIGH

- uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: trivy-results.sarif
```

### SAST (Static Application Security Testing)

```yaml
- uses: github/codeql-action/init@v3
  with:
    languages: javascript, python

- uses: github/codeql-action/analyze@v3
  with:
    category: "/language:javascript"
```

## Supply Chain Security

### SBOM Generation

```yaml
- uses: anchore/sbom-action@v0
  with:
    format: spdx-json
    output-file: sbom.spdx.json

- uses: actions/upload-artifact@v4
  with:
    name: sbom
    path: sbom.spdx.json
```

### Container Image Signing (Cosign)

```yaml
- uses: sigstore/cosign-installer@v3

- name: Sign the container image
  run: |
    cosign sign --yes \
      --key env://COSIGN_KEY \
      myregistry/myapp@${{ steps.build.outputs.digest }}
  env:
    COSIGN_KEY: ${{ secrets.COSIGN_PRIVATE_KEY }}
```

### SLSA Provenance

```yaml
- uses: slsa-framework/slsa-github-generator/.github/workflows/generator_container_slsa3.yml@v2.0.0
  with:
    image: myregistry/myapp
    digest: ${{ steps.build.outputs.digest }}
```

## Pull Request Security

### Fork PR Restrictions

```yaml
# DANGEROUS: pull_request_target runs in the context of the base branch
# and has access to secrets even from forks
on:
  pull_request_target:  # Use with extreme caution

# SAFE: pull_request does not expose secrets to fork PRs
on:
  pull_request:
```

### Required Status Checks

Configure branch protection to require security scans before merge:

| Check | Blocks Merge If |
|-------|----------------|
| Dependency review | New high/critical vulnerabilities |
| CodeQL | New security findings |
| Container scan | Critical CVEs in base image |
| License check | Incompatible license detected |
| Secret scan | Hardcoded secrets detected |

## Audit and Compliance

### Audit Log Queries

```bash
# GitHub CLI: list workflow runs with deployment events
gh api /repos/OWNER/REPO/actions/runs --jq '.workflow_runs[] | {id, name, status, created_at}'

# List environment deployment history
gh api /repos/OWNER/REPO/deployments --jq '.[] | {id, environment, sha, created_at}'
```

### Compliance Matrix

| Requirement | Implementation |
|-------------|---------------|
| SOC 2: Change management | Branch protection + required reviews |
| SOC 2: Access control | Environment secrets + OIDC |
| PCI DSS: Vulnerability management | Dependency review + container scanning |
| SLSA Level 3: Provenance | SLSA GitHub generator + Sigstore |
