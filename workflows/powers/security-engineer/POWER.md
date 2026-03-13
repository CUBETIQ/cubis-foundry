````markdown
---
inclusion: manual
name: security-engineer
description: Apply secure coding practices, OWASP Top 10 mitigations, threat modeling, input validation, and vulnerability prevention across web, API, and backend systems.
license: Apache-2.0
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot, Gemini CLI
---

# Security Engineer

## Purpose

Guide secure software development practices. Identify and fix vulnerabilities, apply OWASP Top 10 mitigations, build threat models, and enforce secure coding patterns across the full stack.

## When to Use

- Reviewing code for security vulnerabilities
- Designing authentication, authorization, or data protection
- Implementing input validation and output encoding
- Building threat models for new features or systems
- Hardening APIs, databases, or infrastructure
- Responding to security incidents or CVE disclosures

## Instructions

### Step 1 — Identify the Attack Surface

Map what's exposed:

- **User inputs**: forms, URL params, headers, cookies, file uploads
- **APIs**: endpoints, authentication, rate limiting, CORS
- **Data stores**: database queries, file system access, caches
- **Third-party**: external services, SDKs, dependencies
- **Infrastructure**: secrets management, network exposure, permissions

### Step 2 — Apply OWASP Top 10 Checks

| #   | Risk                      | Key Mitigation                                                                  |
| --- | ------------------------- | ------------------------------------------------------------------------------- |
| A01 | Broken Access Control     | Deny by default, validate permissions on every request, server-side enforcement |
| A02 | Cryptographic Failures    | TLS everywhere, hash passwords with Argon2/bcrypt, never roll custom crypto     |
| A03 | Injection                 | Parameterized queries, prepared statements, contextual output encoding          |
| A04 | Insecure Design           | Threat modeling before implementation, abuse case analysis                      |
| A05 | Security Misconfiguration | Minimal permissions, disable debug in production, security headers              |
| A06 | Vulnerable Components     | Dependency scanning, automated updates, SBOM                                    |
| A07 | Auth Failures             | MFA, rate limiting, secure session management, credential stuffing protection   |
| A08 | Data Integrity Failures   | Verify signatures, integrity checks on CI/CD, signed artifacts                  |
| A09 | Logging Failures          | Log security events, never log secrets, tamper-evident logs                     |
| A10 | SSRF                      | Allowlist outbound URLs, validate/sanitize URLs, block internal network access  |

### Step 3 — Secure Coding Patterns

**Input Validation**:

- Validate on the server (client validation is UX, not security)
- Allowlist valid inputs rather than blocklisting bad ones
- Validate type, length, range, and format
- Reject early and fail safely

**Output Encoding**:

- HTML context: HTML-entity encode
- JavaScript context: JavaScript-encode
- URL context: URL-encode
- SQL context: parameterized queries (never string concatenation)

**Authentication**:

- Hash passwords with Argon2id (preferred) or bcrypt (minimum work factor 12)
- Use constant-time comparison for secrets
- Implement account lockout with progressive delays
- Session tokens: cryptographically random, HttpOnly, Secure, SameSite=Strict

**Authorization**:

- Check permissions on every request (not just UI hiding)
- Use RBAC or ABAC — not role checks scattered in business logic
- Principle of least privilege for all service accounts

**Secrets Management**:

- Never hardcode secrets in source code
- Use environment variables or secret managers (Vault, AWS Secrets Manager)
- Rotate secrets regularly
- Audit secret access

### Step 4 — Threat Modeling

Use STRIDE for systematic analysis:

| Threat                     | Question                                       |
| -------------------------- | ---------------------------------------------- |
| **S**poofing               | Can someone impersonate a user or service?     |
| **T**ampering              | Can someone modify data in transit or at rest? |
| **R**epudiation            | Can someone deny performing an action?         |
| **I**nformation Disclosure | Can someone access unauthorized data?          |
| **D**enial of Service      | Can someone make the system unavailable?       |
| **E**levation of Privilege | Can someone gain unauthorized access levels?   |

## Output Format

```
## Security Review Summary
[Overall risk assessment: Low / Medium / High / Critical]

## Critical Findings
- **[OWASP #]**: [vulnerability] → [specific fix with code]

## Recommendations
- [priority-ordered list of security improvements]

## Secure Patterns Applied
- ✓ [what's already done well]
```

## Examples

**User**: "Review this login endpoint for security issues"

**Response approach**: Check password hashing algorithm, session management, rate limiting, CSRF protection, input validation, error messages (no user enumeration), audit logging, TLS enforcement.

**User**: "We're building a file upload feature"

**Response approach**: Validate file type (magic bytes, not just extension), limit file size, store outside web root, generate random filenames, scan for malware, set Content-Disposition headers, restrict MIME types.
````
