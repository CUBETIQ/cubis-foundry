# Eval Assertions — Sanitize PII

## Eval 1: PII Detection in Log Output

**ID:** `pii-detection-log-output`

| # | Assertion Type | Expected Value | Rationale |
|---|---------------|----------------|-----------|
| 1 | content_matches_regex | `email\|john\\.doe@\|email address` | Must identify the email address in the UserService log line as PII requiring redaction. |
| 2 | content_matches_regex | `credit card\|card number\|PAN\|4111\|CVV\|payment card` | Must identify the full credit card number and CVV as critical PII — a PCI DSS violation. |
| 3 | content_matches_regex | `SSN\|Social Security\|123-45-6789` | Must identify the SSN as critical PII with the highest sensitivity classification. |
| 4 | content_matches_regex | `redact\|mask\|filter\|sanitiz\|replace\|\\*{3,}\|\\[REDACTED\\]` | Must recommend a specific redaction or masking technique rather than just flagging the issue. |
| 5 | content_matches_regex | `API key\|sk_live\|secret\|credential\|token` | Must identify the exposed Stripe API key as both a PII and credential leak requiring rotation. |

## Eval 2: GDPR-Compliant Data Masking

**ID:** `gdpr-data-masking`

| # | Assertion Type | Expected Value | Rationale |
|---|---------------|----------------|-----------|
| 1 | content_matches_regex | `GDPR\|Article\|regulation\|data protection\|lawful` | Must ground the masking strategy in GDPR requirements since the application serves EU customers. |
| 2 | content_matches_regex | `email.*mask\|mask.*email\|fake.*email\|synthetic.*email\|anonymiz` | Must specify a concrete masking strategy for email addresses that preserves format but removes identity. |
| 3 | content_matches_regex | `format.preserv\|tokeniz\|synthetic\|faker\|fake data\|realistic` | Must recommend format-preserving masking or synthetic data generation for realistic non-production data. |
| 4 | content_matches_regex | `free.text\|support_ticket\|body\|unstructured\|ticket.*body\|agent.*notes` | Must address free-text fields which cannot be masked with simple find-replace and require NLP or full replacement. |
| 5 | content_matches_regex | `referential integrity\|foreign key\|user_id\|relationship\|consistent` | Must address referential integrity to ensure masked data remains consistent across related tables. |
