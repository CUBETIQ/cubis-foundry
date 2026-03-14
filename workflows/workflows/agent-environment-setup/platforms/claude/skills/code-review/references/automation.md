# Review Automation

## Overview

Human reviewers should focus on logic, design, and correctness. Everything else — formatting, lint violations, type errors, dependency audits, and common security patterns — should be caught by automation before a human sees the PR.

## CI Checks That Replace Manual Review

### Formatting and Style

**Tools**: Prettier, Black, gofmt, rustfmt

These tools produce deterministic output. If the CI check passes, formatting is correct. Reviewers should never comment on formatting.

```yaml
# .github/workflows/lint.yml
name: Lint
on: [pull_request]
jobs:
  format:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx prettier --check "**/*.{js,ts,json,md}"
      - run: npx eslint --max-warnings 0 .
```

### Type Checking

**Tools**: TypeScript (`tsc --noEmit`), mypy, Flow

Type errors are objective. If the type checker passes, the types are consistent. Reviewers should not manually verify types.

```yaml
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx tsc --noEmit
```

### Dependency Security

**Tools**: npm audit, Snyk, Dependabot, Socket.dev

Dependency vulnerabilities are detectable by tooling. Reviewers should not manually inspect lock file changes.

```yaml
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=high
```

### Test Coverage

**Tools**: Jest, pytest, coverage.py, Istanbul

Enforce minimum coverage thresholds in CI. Reviewers verify test quality, not coverage numbers.

```yaml
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx jest --coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80}}'
```

## Review Bots

### GitHub Actions as Review Bot

Create a custom action that posts automated review comments:

```yaml
name: Review Bot
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Check PR size
        run: |
          ADDITIONS=$(gh pr view ${{ github.event.pull_request.number }} --json additions -q .additions)
          if [ "$ADDITIONS" -gt 400 ]; then
            gh pr comment ${{ github.event.pull_request.number }} \
              --body "This PR has $ADDITIONS additions. Consider splitting into smaller PRs for easier review."
          fi
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Check PR description
        run: |
          BODY=$(gh pr view ${{ github.event.pull_request.number }} --json body -q .body)
          if [ ${#BODY} -lt 50 ]; then
            gh pr comment ${{ github.event.pull_request.number }} \
              --body "The PR description is short. Please add: what changed, why, and how to test."
          fi
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### CODEOWNERS

Automatically assign reviewers based on file ownership:

```
# .github/CODEOWNERS
src/auth/           @security-team
src/billing/        @payments-team
src/api/            @backend-team
src/ui/             @frontend-team
*.sql               @dba-team
Dockerfile          @platform-team
.github/            @devops-team
```

### Danger.js

Danger runs during CI and posts review comments based on custom rules:

```javascript
// dangerfile.js
import { danger, warn, fail, message } from 'danger';

// Warn if PR is too large
if (danger.github.pr.additions + danger.github.pr.deletions > 500) {
  warn('This PR is large. Consider splitting it into smaller PRs.');
}

// Fail if no tests are modified
const hasTestChanges = danger.git.modified_files.some(f => f.includes('test') || f.includes('spec'));
const hasCodeChanges = danger.git.modified_files.some(f => f.endsWith('.ts') || f.endsWith('.js'));
if (hasCodeChanges && !hasTestChanges) {
  warn('This PR modifies code but no tests. Please add test coverage.');
}

// Warn if package.json changed without lock file
const packageChanged = danger.git.modified_files.includes('package.json');
const lockChanged = danger.git.modified_files.includes('package-lock.json');
if (packageChanged && !lockChanged) {
  fail('package.json changed but package-lock.json did not. Run `npm install` to update the lock file.');
}

// Celebrate new tests
const newTests = danger.git.created_files.filter(f => f.includes('test') || f.includes('spec'));
if (newTests.length > 0) {
  message(`New tests added: ${newTests.join(', ')}`);
}
```

## Static Analysis

### Security Scanning

**Tools**: Semgrep, CodeQL, SonarQube, Snyk Code

These tools detect common vulnerability patterns:
- SQL injection
- XSS
- Hardcoded secrets
- Insecure deserialization
- Path traversal

```yaml
  semgrep:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/owasp-top-ten
```

### Code Quality

**Tools**: SonarQube, CodeClimate, ESLint (with plugins)

Track code quality metrics over time:
- Cyclomatic complexity
- Duplicate code
- Function length
- Dependency depth

## PR Templates

Automate PR structure with a template:

```markdown
<!-- .github/pull_request_template.md -->
## What

<!-- What does this PR do? -->

## Why

<!-- Why is this change needed? Link to issue. -->

## How to Test

<!-- Steps to verify the change works correctly. -->

## Checklist

- [ ] Tests added/updated
- [ ] Documentation updated (if applicable)
- [ ] No secrets or PII in the code
- [ ] Breaking changes documented
```

## Automation Priority

What to automate first, based on impact:

| Priority | Check                  | Reason                                              |
|----------|------------------------|-----------------------------------------------------|
| 1        | Formatting (Prettier)  | Eliminates 30-50% of review comments immediately.   |
| 2        | Type checking (tsc)    | Catches type errors before human review.             |
| 3        | Lint rules (ESLint)    | Enforces code style and catches common mistakes.     |
| 4        | Test coverage          | Ensures new code has tests without manual checks.    |
| 5        | Security scanning      | Catches OWASP top 10 vulnerabilities automatically.  |
| 6        | PR size check          | Encourages smaller, reviewable PRs.                  |
| 7        | CODEOWNERS             | Routes PRs to the right reviewers automatically.     |
| 8        | Dependency audit       | Catches vulnerable dependencies before merge.        |
