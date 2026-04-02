# Secret Scanning Reference

## Overview

Secret scanning detects credentials, API keys, tokens, and other sensitive values that have been accidentally committed to source code repositories. This reference covers tool configuration, CI/CD integration, and incident response for detected secrets.

## Tool Comparison

| Tool | Type | Speed | Accuracy | Custom Rules | License |
|------|------|-------|----------|-------------|---------|
| gitleaks | Pre-commit + CI | Fast | High | TOML config | MIT |
| trufflehog | Git history scan | Medium | Very high (verified) | Detector plugins | AGPL |
| detect-secrets | Pre-commit + CI | Fast | Medium | Plugin system | Apache 2.0 |
| GitHub Secret Scanning | Push protection | Real-time | High (pattern partners) | Limited | GitHub feature |
| GitGuardian | SaaS | Real-time | Very high | Custom patterns | Commercial |

## Gitleaks Configuration

### Installation

```bash
# macOS
brew install gitleaks

# Linux
wget https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks_linux_x64.tar.gz

# Docker
docker run --rm -v $(pwd):/code zricethezav/gitleaks detect --source /code
```

### Pre-Commit Hook

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks
```

### Custom Configuration

```toml
# .gitleaks.toml
title = "Custom gitleaks config"

# Extend default rules
[extend]
useDefault = true

# Add custom rules
[[rules]]
id = "internal-api-key"
description = "Internal API Key"
regex = '''internal_api_key_[a-zA-Z0-9]{32}'''
secretGroup = 0
entropy = 3.5

[[rules]]
id = "database-url"
description = "Database Connection URL"
regex = '''(postgres|mysql|mongodb)(\+\w+)?:\/\/[^:]+:[^@]+@[^\/]+'''

# Allowlist paths that are safe
[allowlist]
paths = [
  '''\.gitleaks\.toml$''',
  '''\.env\.example$''',
  '''test/fixtures/''',
  '''__mocks__/''',
]

# Allowlist specific values (hashes of known safe strings)
regexes = [
  '''EXAMPLE_KEY_DO_NOT_USE''',
  '''test-api-key-not-real''',
]
```

### Scanning Commands

```bash
# Scan current state
gitleaks detect --source . --verbose

# Scan git history
gitleaks detect --source . --log-opts="--all" --verbose

# Scan specific commit range
gitleaks detect --source . --log-opts="main..HEAD"

# Generate SARIF report
gitleaks detect --source . --report-format sarif --report-path gitleaks.sarif

# Scan with baseline (ignore known findings)
gitleaks detect --source . --baseline-path .gitleaks-baseline.json
```

## Trufflehog Configuration

### Installation and Usage

```bash
# Install
brew install trufflehog

# Scan filesystem
trufflehog filesystem --directory . --only-verified

# Scan git repository (including history)
trufflehog git file://. --only-verified

# Scan GitHub organization
trufflehog github --org=myorg --only-verified

# Scan with JSON output
trufflehog git file://. --only-verified --json > findings.json
```

Trufflehog's `--only-verified` flag reduces false positives by actually testing if detected credentials are valid (e.g., attempting authentication with found API keys).

## CI/CD Integration

### GitHub Actions

```yaml
name: Secret Scanning
on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  gitleaks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for git scan

      - name: Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITLEAKS_LICENSE: ${{ secrets.GITLEAKS_LICENSE }}

  trufflehog:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Trufflehog
        uses: trufflesecurity/trufflehog@main
        with:
          extra_args: --only-verified
```

### GitLab CI

```yaml
secret_scanning:
  stage: test
  image: zricethezav/gitleaks:latest
  script:
    - gitleaks detect --source . --verbose --log-opts="$CI_MERGE_REQUEST_DIFF_BASE_SHA..$CI_COMMIT_SHA"
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

## Common Secret Patterns

| Pattern | Regex | Service |
|---------|-------|---------|
| AWS Access Key | `AKIA[0-9A-Z]{16}` | AWS IAM |
| AWS Secret Key | `[0-9a-zA-Z/+=]{40}` (near AKIA) | AWS IAM |
| GitHub Token | `gh[pousr]_[A-Za-z0-9_]{36,}` | GitHub |
| Stripe Key | `[sr]k_(live\|test)_[0-9a-zA-Z]{24,}` | Stripe |
| Slack Token | `xox[bpors]-[0-9a-zA-Z-]+` | Slack |
| Google API Key | `AIza[0-9A-Za-z_-]{35}` | Google Cloud |
| Private Key | `-----BEGIN (RSA\|EC\|DSA\|OPENSSH) PRIVATE KEY-----` | Any |
| JWT | `eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+` | Any |
| Generic password | `password\s*[:=]\s*['"][^'"]{8,}['"]` | Any |
| Connection string | `(postgres\|mysql\|mongodb)://[^:]+:[^@]+@` | Databases |

## Incident Response for Detected Secrets

### Severity Classification

| Secret Type | Severity | Impact |
|-------------|----------|--------|
| Cloud provider credentials (AWS/GCP/Azure) | Critical | Full infrastructure compromise |
| Database credentials (production) | Critical | Data breach |
| Payment API keys (Stripe, Braintree) | Critical | Financial loss |
| Private TLS/SSH keys | High | Man-in-the-middle, impersonation |
| Third-party API keys | High | Service abuse, data access |
| Internal service tokens | Medium | Internal lateral movement |
| Development/test credentials | Low | If isolated from production |

### Response Procedure

1. **Revoke immediately** — Rotate the exposed credential before any other action
2. **Assess exposure window** — When was the secret committed? When was it pushed?
3. **Check access logs** — Review the service's access logs for unauthorized use during the window
4. **Remove from history** — Use `git filter-branch` or BFG Repo Cleaner to scrub from git history
5. **Deploy new secret** — Ensure all consuming services receive the rotated credential
6. **Post-incident review** — Document root cause and prevention measures

### Git History Cleanup

```bash
# BFG Repo Cleaner (recommended — faster and simpler)
bfg --replace-text passwords.txt repo.git

# git filter-repo (newer alternative)
git filter-repo --replace-text expressions.txt

# After cleanup: force push (coordinate with team)
git push --force --all
git push --force --tags
```

**Important:** Force-pushing rewrites history. All team members must re-clone or reset their local repositories.

## Prevention Best Practices

1. **Pre-commit hooks** — Block commits containing secrets before they enter history
2. **CI scanning** — Catch secrets in PRs before they merge to main
3. **Push protection** — GitHub Secret Scanning push protection blocks pushes with known patterns
4. **Developer education** — Train developers to use environment variables and vaults
5. **Gitignore hygiene** — Maintain comprehensive `.gitignore` files
6. **.env.example** — Use clearly fake placeholder values
7. **IDE plugins** — Enable secret detection in VS Code, IntelliJ, etc.
