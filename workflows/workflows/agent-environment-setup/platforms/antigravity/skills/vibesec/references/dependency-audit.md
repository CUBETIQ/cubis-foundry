# Dependency Audit Reference

## Overview

Dependency vulnerabilities are the most common real-world attack vector. This reference covers scanning tools, triage processes, and remediation strategies for every major ecosystem.

## Scanning by Ecosystem

### Node.js / npm

```bash
# Built-in audit
npm audit --production           # Production deps only
npm audit --audit-level=high     # Fail on high+ only

# With detailed output
npm audit --json | jq '.vulnerabilities | to_entries | .[] | {name: .key, severity: .value.severity, via: .value.via}'

# Fix automatically (safe updates only)
npm audit fix

# Fix with breaking changes (review carefully)
npm audit fix --force
```

**Override transitive dependencies:**
```json
// package.json
{
  "overrides": {
    "vulnerable-package": ">=2.0.0"
  }
}
```

### Python

```bash
# pip-audit (recommended)
pip-audit --strict --desc
pip-audit -r requirements.txt

# Safety (alternative)
safety check --full-report -r requirements.txt

# pip-audit with fix suggestions
pip-audit --fix --dry-run
```

### Go

```bash
# govulncheck (official Go tool)
govulncheck ./...

# With verbose output showing affected functions
govulncheck -show=verbose ./...
```

### Rust

```bash
# cargo-audit
cargo audit

# With fix suggestions
cargo audit fix --dry-run
```

### Java / Maven

```bash
# OWASP Dependency-Check
mvn org.owasp:dependency-check-maven:check

# Gradle
gradle dependencyCheckAnalyze
```

### Ruby

```bash
# bundler-audit
bundle audit check --update

# Fix
bundle audit fix
```

### Multi-Language

```bash
# Trivy (covers most languages + containers)
trivy fs .
trivy fs --severity HIGH,CRITICAL .

# Snyk
snyk test
snyk test --severity-threshold=high

# Grype (Anchore)
grype dir:.
```

## Triage Framework

### Severity Assessment

| CVSS Score | Severity | SLA |
|-----------|----------|-----|
| 9.0 - 10.0 | Critical | Fix within 24 hours |
| 7.0 - 8.9 | High | Fix within 1 week |
| 4.0 - 6.9 | Medium | Fix within 1 month |
| 0.1 - 3.9 | Low | Next maintenance window |

### Context-Based Adjustment

| Context | Impact on Priority |
|---------|-------------------|
| Dependency is dev-only | Lower by 1 level (unless build-time RCE) |
| Vulnerable function not called in your code | Lower by 1 level (document why) |
| Network-reachable exploit but dep is client-only | Lower by 1 level |
| Dependency processes user input | Raise or maintain level |
| Application handles financial/health/PII data | Raise by 1 level |

### Decision Matrix

| Exploitable? | Patch Available? | Action |
|-------------|-----------------|--------|
| Yes | Yes | Update immediately |
| Yes | No | Mitigate (WAF, input validation) or replace package |
| No | Yes | Update at next opportunity |
| No | No | Document, monitor, set reminder |

## Maintenance Health Indicators

| Indicator | Healthy | Concerning | Action Needed |
|-----------|---------|-----------|---------------|
| Last publish | < 6 months | 6-12 months | > 12 months |
| Open issues/PRs | Actively managed | Growing backlog | Abandoned |
| Maintainer count | 2+ active | 1 active | 0 active |
| Download trend | Stable or growing | Declining | Rapidly declining |
| Funding | Sponsored/corporate | Community only | No support |

### Check Package Health

```bash
# npm: check package metadata
npm view package-name time --json | jq 'to_entries | sort_by(.value) | last(3)'

# Check for known malicious packages
npx socket-security/cli report
```

## SBOM Generation

Software Bill of Materials — required for compliance and supply chain security.

```bash
# CycloneDX for Node.js
npx @cyclonedx/cyclonedx-npm --output-file sbom.json

# CycloneDX for Python
pip install cyclonedx-bom
cyclonedx-py environment -o sbom.json

# Syft (multi-language)
syft dir:. -o cyclonedx-json > sbom.json

# Trivy SBOM
trivy fs . --format cyclonedx --output sbom.json
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Dependency Audit
on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '0 8 * * 1'  # Weekly Monday 8 AM

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm audit --production --audit-level=high
      - name: Trivy scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          severity: 'HIGH,CRITICAL'
          exit-code: '1'
```

### Automated Dependency Updates

| Tool | Ecosystem | Features |
|------|-----------|----------|
| Dependabot | Multi-language | GitHub-native, simple config, grouped updates |
| Renovate | Multi-language | Highly configurable, auto-merge, scheduling |
| Socket.dev | npm | Supply chain attack detection |

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    groups:
      production-deps:
        dependency-type: "production"
      dev-deps:
        dependency-type: "development"
    open-pull-requests-limit: 10
```

## Dependency Pinning Strategy

| Environment | Strategy | Rationale |
|------------|----------|-----------|
| Application | Pin exact versions in lockfile | Reproducible builds |
| Library | Use semver ranges | Allow consumers to update |
| Docker base images | Pin digest (sha256) | Prevent supply chain attacks |
| CI tool versions | Pin exact | Reproducible pipelines |
