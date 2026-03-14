# OWASP Top 10 (2025) Reference

## Overview

The OWASP Top 10 is the most widely adopted standard for web application security awareness. This reference covers the 2025 edition categories, detection patterns, and remediation strategies.

## Categories

### A01:2025 — Broken Access Control

**Description:** Restrictions on what authenticated users are allowed to do are not properly enforced. Attackers can exploit flaws to access unauthorized functionality or data.

**Common patterns:**
- Insecure Direct Object References (IDOR) — modifying resource IDs in URLs/parameters
- Missing function-level access control — admin endpoints without role checks
- CORS misconfiguration allowing unauthorized cross-origin access
- Metadata manipulation — modifying JWT claims, cookies, or hidden fields
- Force browsing to authenticated or privileged pages

**Detection:**
```
# Semgrep: missing authorization check
rules:
  - id: missing-auth-check
    patterns:
      - pattern: |
          app.$METHOD($PATH, (req, res) => { ... })
      - pattern-not-inside: |
          app.$METHOD($PATH, authMiddleware, ...)
    message: "Route handler without authorization middleware"
```

**Remediation:**
- Deny by default — require explicit access grants
- Implement RBAC or ABAC with centralized policy enforcement
- Validate object-level permissions on every data access
- Disable directory listing and ensure metadata files are not accessible
- Rate-limit API access and log access control failures

### A02:2025 — Cryptographic Failures

**Description:** Failures related to cryptography that lead to exposure of sensitive data.

**Common patterns:**
- Data transmitted in cleartext (HTTP, FTP, SMTP without TLS)
- Deprecated cryptographic algorithms (MD5, SHA1, DES, RC4)
- Weak or default encryption keys
- Missing certificate validation
- Use of ECB mode or deterministic encryption for sensitive data
- Hardcoded keys or initialization vectors

**Detection:**
- Scan for HTTP URLs in configuration files
- Check TLS versions (require TLS 1.2+)
- Search for `md5(`, `sha1(`, `DES`, `RC4` in codebase
- Verify certificate pinning in mobile applications

**Remediation:**
- Classify data by sensitivity and apply encryption requirements
- Use AES-256-GCM or ChaCha20-Poly1305 for symmetric encryption
- Use RSA-2048+ or Ed25519 for asymmetric operations
- Generate random IVs/nonces for every encryption operation
- Store encryption keys in a vault, never in source code

### A03:2025 — Injection

**Description:** User-supplied data is sent to an interpreter as part of a command or query without proper validation, sanitization, or escaping.

**Types:**
- SQL injection (SQLi)
- Cross-Site Scripting (XSS) — reflected, stored, DOM-based
- OS command injection
- LDAP injection
- Server-Side Template Injection (SSTI)
- NoSQL injection
- XPath injection

**Detection patterns:**
```
# SQL injection detection
- String concatenation in SQL: query = "SELECT * FROM " + table
- Template literals in SQL: `SELECT * FROM users WHERE id = ${id}`
- Format strings in SQL: f"SELECT * FROM users WHERE id = {id}"

# XSS detection
- innerHTML assignment with user data
- document.write() with unescaped input
- Dangerously setting HTML in React (dangerouslySetInnerHTML)
- Server-side HTML string building with user input
```

**Remediation:**
- Parameterized queries (prepared statements) for SQL
- Context-aware output encoding for XSS
- Input validation with allowlists (not blocklists)
- Use ORMs correctly (avoid raw queries with interpolation)
- Content Security Policy headers to mitigate XSS impact

### A04:2025 — Insecure Design

**Description:** Security flaws inherent in the design of the application, as opposed to implementation bugs.

**Common patterns:**
- Missing rate limiting on authentication endpoints
- Predictable resource identifiers (sequential IDs)
- Business logic that trusts client-side validation alone
- Missing re-authentication for sensitive operations
- Recovery flows weaker than primary authentication

### A05:2025 — Security Misconfiguration

**Description:** Missing or incorrect security configuration at any level of the application stack.

**Common patterns:**
- Default credentials left unchanged
- Unnecessary features enabled (debug endpoints, directory listing)
- Missing security headers (CSP, HSTS, X-Frame-Options)
- Verbose error messages exposing stack traces
- Cloud storage with public access
- Outdated software with known vulnerabilities

### A06:2025 — Vulnerable and Outdated Components

**Description:** Using components with known vulnerabilities or components that are no longer maintained.

### A07:2025 — Identification and Authentication Failures

**Description:** Weaknesses in authentication mechanisms that allow attackers to assume other users' identities.

### A08:2025 — Software and Data Integrity Failures

**Description:** Code and infrastructure that does not protect against integrity violations (unsigned updates, insecure CI/CD, untrusted deserialization).

### A09:2025 — Security Logging and Monitoring Failures

**Description:** Insufficient logging, detection, monitoring, and active response.

### A10:2025 — Server-Side Request Forgery (SSRF)

**Description:** The application fetches a remote resource without validating the user-supplied URL, allowing attackers to access internal services.

## Scoring Guide

| Severity | CVSS Range | Exploitability | Impact |
|----------|-----------|----------------|--------|
| Critical | 9.0 - 10.0 | Easy, no auth required | Full system compromise |
| High | 7.0 - 8.9 | Moderate, may require auth | Significant data exposure |
| Medium | 4.0 - 6.9 | Requires specific conditions | Limited data/functionality exposure |
| Low | 0.1 - 3.9 | Difficult, unlikely | Minimal impact |

## Quick Reference

| Category | Key Question | Primary Control |
|----------|-------------|-----------------|
| A01 | Can users access others' data? | Authorization checks |
| A02 | Is sensitive data encrypted? | Strong cryptography |
| A03 | Is user input in commands/queries? | Parameterization |
| A04 | Was security part of the design? | Threat modeling |
| A05 | Are defaults secure? | Hardening procedures |
| A06 | Are components up to date? | Dependency management |
| A07 | Is authentication strong? | MFA, session management |
| A08 | Is integrity verified? | Signing, integrity checks |
| A09 | Are attacks detected? | Logging and monitoring |
| A10 | Are URLs user-controlled? | Input validation, allowlists |
