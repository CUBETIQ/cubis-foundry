# Eval Assertions — OWASP Security Review

## Eval 1: Injection Vulnerability Detection

**ID:** `owasp-injection-detection`

| # | Assertion Type | Expected Value | Rationale |
|---|---------------|----------------|-----------|
| 1 | content_contains | "SQL injection" | The code concatenates `req.query.name` directly into a SQL string. The skill must identify this as SQL injection. |
| 2 | content_contains | "XSS" | The code reflects `req.query.name` and `err.message` directly into HTML. The skill must identify reflected XSS. |
| 3 | content_matches_regex | `A0[3]\|Injection\|injection` | The finding must reference OWASP A03:2025 (Injection) to demonstrate proper categorization. |
| 4 | content_contains | "parameterized" | Remediation must recommend parameterized queries (prepared statements) as the primary fix for SQL injection. |
| 5 | content_matches_regex | `encod\|escap\|sanitiz\|DOMPurify` | Remediation must recommend output encoding, escaping, or sanitization for XSS prevention. |

## Eval 2: Threat Model Generation

**ID:** `owasp-threat-model-generation`

| # | Assertion Type | Expected Value | Rationale |
|---|---------------|----------------|-----------|
| 1 | content_matches_regex | `STRIDE\|spoofing\|tampering\|repudiation\|information disclosure\|denial of service\|elevation of privilege` | The threat model must use a recognized framework (STRIDE) or enumerate its threat categories. |
| 2 | content_matches_regex | `trust boundar\|boundary\|ingress\|external\|internal` | Must identify trust boundaries between the public internet, Kubernetes ingress, and internal services. |
| 3 | content_matches_regex | `JWT\|token\|session` | Must analyze JWT security concerns including signing algorithm, token expiry, and storage. |
| 4 | content_matches_regex | `password reset\|reset.password\|account takeover` | Must identify the password reset flow as a high-value attack vector for account takeover. |
| 5 | content_matches_regex | `Critical\|High\|Medium\|Low\|severity\|risk.*(rating\|level)` | Must assign severity or risk ratings to each identified threat to enable prioritization. |
