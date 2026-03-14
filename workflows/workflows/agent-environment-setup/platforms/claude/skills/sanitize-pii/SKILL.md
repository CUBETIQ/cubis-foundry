---
name: sanitize-pii
description: "Detect and sanitize personally identifiable information (PII) in code, logs, databases, and data pipelines. Covers PII identification, redaction strategies, data masking, GDPR/CCPA compliance, and audit trail implementation."
allowed-tools: Read Grep Glob Bash
user-invocable: true
argument-hint: "Codebase, logs, or data pipeline to scan for PII"
---

# Sanitize PII — PII Detection and Sanitization

## Purpose

Guide the detection, classification, and sanitization of personally identifiable information across application code, log outputs, database schemas, and data pipelines. This skill ensures that PII handling meets GDPR, CCPA, and other privacy regulation requirements through systematic identification, consistent redaction, reversible masking where needed, and auditable compliance controls.

## When to Use

- Scanning log output or application telemetry for accidental PII exposure
- Implementing data masking for non-production environments
- Building PII redaction into data pipelines or ETL processes
- Conducting a GDPR or CCPA compliance review of data handling
- Designing audit trails for PII access and processing
- Reviewing code for patterns that inadvertently persist or transmit PII

## Instructions

1. **Define the PII taxonomy for the project** — Enumerate all PII categories relevant to the application (names, emails, phone numbers, SSNs, IP addresses, geolocation, biometrics, financial data, health records) because the definition of PII varies by jurisdiction and incomplete taxonomy leads to incomplete protection.

2. **Map PII data flows** — Trace each PII category from point of collection through storage, processing, transmission, and deletion to identify every location where PII exists because you cannot sanitize data you have not located.

3. **Classify PII by sensitivity tier** — Assign each category a sensitivity level (direct identifiers like SSN/passport = critical; quasi-identifiers like ZIP+DOB = high; general contact info = standard) because sensitivity drives the required protection strength and breach notification obligations.

4. **Scan source code for PII patterns** — Use regex patterns and AST analysis to find logging statements, string interpolation, serialization, and debug output that may include PII fields because developers frequently log user objects without redacting sensitive fields.

5. **Scan log output and telemetry** — Review structured and unstructured logs for PII leakage including email addresses in error messages, user IDs in URLs, and stack traces containing request bodies because logs are often stored with weaker access controls than databases.

6. **Implement field-level redaction** — Apply deterministic redaction (consistent replacement tokens) or destructive redaction (irreversible removal) to PII in logs, exports, and non-production data because redaction prevents PII from reaching unauthorized storage while preserving data utility.

7. **Implement data masking for non-production environments** — Use format-preserving encryption, tokenization, or synthetic data generation to create realistic but non-identifying datasets because developers and testers need representative data without real PII.

8. **Build PII-aware logging utilities** — Create or configure logging middleware that automatically redacts known PII fields before writing because relying on individual developers to remember redaction is unreliable at scale.

9. **Implement right-to-erasure (GDPR Article 17) support** — Design deletion workflows that remove or anonymize all instances of a data subject's PII across all storage systems including backups, caches, and derived datasets because GDPR requires complete erasure upon valid request.

10. **Implement data subject access requests (DSAR)** — Build the ability to export all PII associated with a data subject in a portable format because GDPR Article 15 and CCPA Section 1798.100 require this capability.

11. **Configure consent and purpose tracking** — Record the legal basis (consent, legitimate interest, contract) and processing purpose for each PII collection point because GDPR Article 6 requires a lawful basis and purpose limitation for all personal data processing.

12. **Set up PII access audit trails** — Log every read, write, export, and deletion of PII with actor identity, timestamp, purpose, and data categories accessed because audit trails demonstrate compliance and enable breach impact assessment.

13. **Implement retention and auto-deletion policies** — Configure time-based or event-based deletion for each PII category according to the data retention schedule because storing PII beyond its purpose violates the storage limitation principle.

14. **Validate PII sanitization with automated tests** — Write tests that assert PII fields are redacted in log output, masked in non-production exports, and absent from API responses that should not contain them because manual verification does not scale.

15. **Document the PII handling architecture** — Produce a data protection impact assessment (DPIA) or privacy design document covering data flows, protection measures, retention periods, and compliance mapping because documentation is itself a regulatory requirement.

16. **Establish breach notification procedures** — Define the workflow for identifying, assessing, and reporting PII breaches within the 72-hour GDPR window including impact assessment, authority notification, and data subject communication because delayed notification incurs significant regulatory penalties.

## Output Format

```
## PII Sanitization Report

### PII Taxonomy
| Category | Sensitivity | Locations Found | Protection Method |
|----------|------------|-----------------|-------------------|
| Email | Standard | user_service, logs, analytics | Redact in logs, encrypt at rest |
| SSN | Critical | payroll_service | Tokenize, vault storage |

### Data Flow Map
[Collection → Processing → Storage → Transmission → Deletion per category]

### Findings

| # | Location | PII Type | Issue | Severity | Remediation |
|---|----------|----------|-------|----------|-------------|
| 1 | logger.js:42 | Email | Logged in plaintext | High | Add to redaction filter |

### Compliance Status
| Requirement | GDPR Article | Status | Gap |
|-------------|-------------|--------|-----|
| Right to erasure | Art. 17 | Partial | Backups not covered |

### Remediation Plan
[Priority-ordered action items with implementation guidance]

### Audit Trail Configuration
[What is logged, where, retention period]
```

## References

| Topic | Reference | Load When |
|-------|-----------|-----------|
| PII Detection Patterns | `references/pii-detection.md` | Scanning code or logs for PII |
| Redaction Strategies | `references/redaction-strategies.md` | Implementing field-level redaction |
| Data Masking Techniques | `references/data-masking.md` | Creating non-production datasets |
| GDPR/CCPA Compliance | `references/compliance.md` | Reviewing regulatory requirements |
| Audit Trail Design | `references/audit-trails.md` | Implementing PII access logging |

## Claude Platform Notes

- Use `$ARGUMENTS` to access user-provided arguments passed when the skill is invoked.
- Reference skill-local files with `${CLAUDE_SKILL_DIR}/references/<file>` for portable paths.
- When `context: fork` is set, the skill runs in an isolated subagent context; the `agent` field names the fork target.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available for dynamic skill discovery and loading.
- Use `allowed-tools` in frontmatter to restrict tool access for security-sensitive skills.
