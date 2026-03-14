# Eval Assertions — VibeSec

## Eval 1: Quick Security Vibe Check

**ID:** `vibesec-quick-assessment`

| # | Assertion Type | Expected Value | Rationale |
|---|---------------|----------------|-----------|
| 1 | content_matches_regex | `RED\|ORANGE\|red\|orange` | Given committed secrets, wildcard CORS, root containers, and stack trace leaks, the vibe must be RED or ORANGE. |
| 2 | content_matches_regex | `\\.env\|secret\|credential\|DATABASE_URL` | The committed .env file with database credentials is the most critical finding and must be flagged immediately. |
| 3 | content_matches_regex | `CORS\|Access-Control\|origin.*\\*` | Wildcard CORS is a commonly exploited misconfiguration that enables cross-origin attacks. Must be identified. |
| 4 | content_matches_regex | `stack trace\|error\|debug\|production` | Stack trace exposure in production leaks internal architecture details to attackers. Must be flagged. |
| 5 | content_matches_regex | `root\|container\|Docker\|privilege` | Containers running as root amplify any container escape vulnerability. Must be identified. |

## Eval 2: Dependency Health Audit

**ID:** `vibesec-dependency-audit`

| # | Assertion Type | Expected Value | Rationale |
|---|---------------|----------------|-----------|
| 1 | content_matches_regex | `Django.*3\\.2\|outdated\|end.of.life\|EOL\|upgrade\|update` | Django 3.2 is past end-of-life and must be flagged for upgrade, especially for a financial application. |
| 2 | content_matches_regex | `Pillow\|CVE\|vulnerability\|vulnerab` | Pillow 8.0.0 has multiple known CVEs and must be identified as vulnerable. |
| 3 | content_matches_regex | `PyYAML\|YAML\|deserializ\|unsafe` | PyYAML 5.3 has known unsafe deserialization vulnerabilities (CVE-2020-14343) that must be flagged. |
| 4 | content_matches_regex | `pip.audit\|safety\|dependabot\|renovate\|scan` | Must recommend an automated dependency scanning tool for ongoing monitoring. |
| 5 | content_matches_regex | `financial\|critical\|high.*risk\|sensitive\|priority` | The financial transaction context must elevate the risk assessment and urgency of remediation. |
