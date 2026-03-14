# Example 2: Dependency Health Audit for a Django Project

## User Prompt

> Audit the dependency health of our Django REST API project that handles healthcare data:
>
> ```
> Django==3.2.18
> djangorestframework==3.14.0
> celery==5.2.7
> redis==4.5.1
> Pillow==9.4.0
> cryptography==39.0.0
> boto3==1.26.0
> psycopg2-binary==2.9.5
> gunicorn==20.1.0
> requests==2.28.1
> PyJWT==2.6.0
> django-cors-headers==3.13.0
> ```
>
> We process HIPAA-regulated patient data.

## Expected Response

### VibeSec Dependency Audit

### Overall Vibe: ORANGE

Multiple outdated packages with known CVEs in a HIPAA-regulated healthcare context. The regulatory environment and data sensitivity elevate every finding by at least one severity level. Immediate action required.

### Dependency Health Summary

| Package | Installed | Latest Stable | Status | Risk |
|---------|-----------|---------------|--------|------|
| Django | 3.2.18 | 5.1.x | End-of-life (April 2024) | Critical |
| djangorestframework | 3.14.0 | 3.15.x | Minor update available | Low |
| celery | 5.2.7 | 5.4.x | Outdated, security fixes in 5.3+ | Medium |
| redis | 4.5.1 | 5.2.x | Major version behind | Medium |
| Pillow | 9.4.0 | 11.x | Multiple CVEs (buffer overflow, DoS) | High |
| cryptography | 39.0.0 | 44.x | Multiple CVEs, OpenSSL updates | Critical |
| boto3 | 1.26.0 | 1.35.x | Very outdated, missing security patches | Medium |
| psycopg2-binary | 2.9.5 | 2.9.9 | Minor update | Low |
| gunicorn | 20.1.0 | 22.x | HTTP request smuggling fix in 21.x | High |
| requests | 2.28.1 | 2.32.x | CVE-2023-32681 (proxy auth leak) | High |
| PyJWT | 2.6.0 | 2.9.x | Algorithm confusion fix in 2.8+ | Medium |
| django-cors-headers | 3.13.0 | 4.6.x | Feature updates, no critical CVEs | Low |

### Critical Findings

**1. Django 3.2 — End of Life (CRITICAL)**
Django 3.2 LTS reached end-of-life in April 2024 and no longer receives security patches. In a HIPAA context, running unsupported software is a compliance violation.
- **Action:** Upgrade to Django 5.0+ or at minimum Django 4.2 LTS
- **Effort:** Medium-high (breaking changes in URL routing, middleware, and form rendering)

**2. cryptography 39.0.0 — Multiple CVEs (CRITICAL)**
This version is affected by CVEs in the underlying OpenSSL and Rust bindings. The `cryptography` package is foundational — everything depending on it (TLS, token signing, encryption) is affected.
- **Action:** Upgrade to cryptography >= 43.0
- **Effort:** Low (usually backwards-compatible)

**3. Pillow 9.4.0 — Buffer Overflow CVEs (HIGH)**
Multiple CVEs including buffer overflow and denial-of-service in image parsing. If the application processes user-uploaded images, this is exploitable.
- **Action:** Upgrade to Pillow >= 10.3
- **Effort:** Low-medium (some deprecated function removals)

**4. gunicorn 20.1.0 — HTTP Request Smuggling (HIGH)**
CVE-2024-1135 (HTTP request smuggling) affects versions before 22.0. Request smuggling can bypass authentication and authorization controls.
- **Action:** Upgrade to gunicorn >= 22.0
- **Effort:** Low

**5. requests 2.28.1 — Proxy Auth Credential Leak (HIGH)**
CVE-2023-32681 allows proxy authentication credentials to leak to the destination server.
- **Action:** Upgrade to requests >= 2.31.0
- **Effort:** Low

### HIPAA Compliance Impact

Running end-of-life software and packages with known vulnerabilities violates the HIPAA Security Rule requirements for:
- **164.308(a)(5)(ii)(B):** Protection from malicious software
- **164.312(e)(2)(ii):** Encryption mechanism integrity
- **164.306(a)(1):** Ensure confidentiality of ePHI

A breach traceable to a known, unpatched CVE would significantly increase regulatory penalties.

### Recommended Actions

1. **Immediate:** Upgrade `cryptography`, `requests`, `gunicorn`, `Pillow` (low effort, high impact)
2. **This sprint:** Plan Django 4.2 LTS migration path
3. **Ongoing:** Enable `pip-audit` in CI, configure Dependabot for automated PRs
4. **Audit:** Run `pip-audit --strict` and address all findings before next deployment

```bash
# Quick fix for low-effort upgrades
pip install --upgrade cryptography requests gunicorn Pillow PyJWT
pip-audit --strict
```
