# SAST and DAST Patterns Reference

## Overview

Static Application Security Testing (SAST) analyzes source code without executing it. Dynamic Application Security Testing (DAST) tests running applications. Both are complementary — SAST finds code-level flaws early; DAST finds runtime and configuration issues.

## SAST Tools by Language

| Language | Tool | Free/Paid | Strengths |
|----------|------|-----------|-----------|
| Multi-language | Semgrep | Free (OSS) | Custom rules, fast, low FP rate |
| Multi-language | CodeQL | Free (GitHub) | Deep data-flow analysis |
| Multi-language | SonarQube | Free/Paid | Broad coverage, CI integration |
| JavaScript/TS | ESLint Security | Free | Easy integration, low overhead |
| Python | Bandit | Free | Python-specific security rules |
| Go | gosec | Free | Go-specific vulnerability patterns |
| Java | SpotBugs + FindSecBugs | Free | Bytecode analysis |
| Ruby | Brakeman | Free | Rails-specific vulnerability scanner |
| PHP | Psalm (taint analysis) | Free | PHP type and taint analysis |
| C/C++ | Flawfinder | Free | Buffer overflow, format string detection |
| Rust | cargo-audit | Free | Dependency vulnerability checking |

## SAST Rule Categories

### Injection Rules

```yaml
# Semgrep: SQL injection via string concatenation
rules:
  - id: sql-injection-string-concat
    patterns:
      - pattern: |
          $QUERY = "..." + $INPUT + "..."
      - metavariable-pattern:
          metavariable: $QUERY
          pattern-regex: "(?i)(select|insert|update|delete|drop)"
    message: "Potential SQL injection via string concatenation"
    severity: ERROR

  - id: sql-injection-template-literal
    patterns:
      - pattern: |
          $DB.query(`...${$INPUT}...`)
    message: "Potential SQL injection via template literal in database query"
    severity: ERROR
```

### XSS Rules

```yaml
# Semgrep: reflected XSS patterns
rules:
  - id: xss-innerhtml
    pattern: $EL.innerHTML = $INPUT
    message: "Potential XSS via innerHTML assignment"
    severity: WARNING

  - id: xss-dangerously-set
    pattern: dangerouslySetInnerHTML={{__html: $INPUT}}
    message: "Review dangerouslySetInnerHTML for XSS"
    severity: WARNING
```

### Authentication Rules

```yaml
# Semgrep: weak JWT configuration
rules:
  - id: jwt-none-algorithm
    pattern: jwt.verify($TOKEN, $SECRET, {algorithms: ["none", ...]})
    message: "JWT configured to accept 'none' algorithm"
    severity: ERROR

  - id: hardcoded-jwt-secret
    pattern: jwt.sign($PAYLOAD, "...")
    message: "Hardcoded JWT signing secret"
    severity: ERROR
```

## DAST Tools

| Tool | Type | Free/Paid | Best For |
|------|------|-----------|----------|
| OWASP ZAP | Proxy-based | Free | General web app scanning |
| Burp Suite | Proxy-based | Paid (Community free) | Manual + automated testing |
| Nuclei | Template-based | Free | Custom vulnerability templates |
| Nikto | Web server | Free | Server misconfiguration |
| sqlmap | SQL injection | Free | Automated SQLi exploitation |
| wfuzz | Fuzzer | Free | Parameter fuzzing |
| Arachni | Spider-based | Free | Automated web app scanning |

## DAST Test Categories

### Header and Configuration Tests

| Test | Expected Result | Tool |
|------|----------------|------|
| Missing CSP | Content-Security-Policy header present | ZAP, Nuclei |
| Missing HSTS | Strict-Transport-Security with max-age >= 31536000 | ZAP, curl |
| Missing X-Frame-Options | DENY or SAMEORIGIN set | ZAP, curl |
| Missing X-Content-Type-Options | nosniff set | ZAP, curl |
| CORS misconfiguration | No wildcard origin in production | curl, Burp |
| TLS version | TLS 1.2+ only; no SSLv3, TLS 1.0, TLS 1.1 | testssl.sh, sslyze |
| Cookie flags | Secure, HttpOnly, SameSite on session cookies | Burp, ZAP |

### Runtime Vulnerability Tests

| Test | Method | Severity |
|------|--------|----------|
| SQL injection | Parameter fuzzing with SQLi payloads | Critical |
| XSS (reflected) | Inject `<script>alert(1)</script>` in parameters | High |
| CSRF | Submit state-changing requests without CSRF token | High |
| Open redirect | Inject external URL in redirect parameters | Medium |
| SSRF | Inject internal IPs (127.0.0.1, 169.254.169.254) in URL parameters | High |
| Directory traversal | Inject `../../../etc/passwd` in file parameters | High |
| IDOR | Access other users' resources by changing IDs | Critical |

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Security Scans
on: [pull_request]

jobs:
  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Semgrep
        uses: semgrep/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/owasp-top-ten
            p/javascript
          publishToken: ${{ secrets.SEMGREP_APP_TOKEN }}

  dast:
    runs-on: ubuntu-latest
    needs: deploy-preview
    steps:
      - name: ZAP Scan
        uses: zaproxy/action-baseline@v0.12.0
        with:
          target: ${{ env.PREVIEW_URL }}
          rules_file_name: ".zap/rules.tsv"
```

### OWASP Coverage Matrix

| OWASP Category | SAST Coverage | DAST Coverage | Gap |
|----------------|--------------|---------------|-----|
| A01 Broken Access Control | Partial (pattern-based) | Good (IDOR, force browse) | Business logic requires manual |
| A02 Cryptographic Failures | Good (algorithm detection) | Good (TLS, headers) | Key management requires manual |
| A03 Injection | Excellent (pattern + data flow) | Good (fuzzing) | Stored injection needs both |
| A04 Insecure Design | Poor | Poor | Requires threat modeling |
| A05 Security Misconfiguration | Partial (config files) | Excellent (runtime check) | Cloud config needs specialized tools |
| A06 Vulnerable Components | Excellent (SCA tools) | N/A | Use dedicated SCA |
| A07 Authentication Failures | Partial (code patterns) | Good (brute force, session) | Requires manual review |
| A08 Integrity Failures | Partial (deserialization) | Partial | CI/CD audit requires manual |
| A09 Logging Failures | Partial (missing log calls) | Poor | Requires manual review |
| A10 SSRF | Good (URL handling patterns) | Good (fuzzing) | Cloud metadata needs specific tests |
