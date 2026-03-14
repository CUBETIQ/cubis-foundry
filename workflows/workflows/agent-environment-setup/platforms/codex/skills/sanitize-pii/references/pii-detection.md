# PII Detection Patterns Reference

## Overview

PII (Personally Identifiable Information) detection requires a combination of pattern matching, context analysis, and domain knowledge. This reference provides detection patterns, classification taxonomy, and scanning strategies for identifying PII in code, logs, databases, and data flows.

## PII Taxonomy

### Direct Identifiers

Can identify a person on their own.

| Category | Examples | Regex Pattern |
|----------|---------|---------------|
| Email address | john@example.com | `\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z\|a-z]{2,}\b` |
| Social Security Number | 123-45-6789 | `\b\d{3}-\d{2}-\d{4}\b` |
| Phone number | +1 (555) 123-4567 | `(\+\d{1,3}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}` |
| Credit card number | 4111 1111 1111 1111 | `\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b` |
| Passport number | Varies by country | Country-specific patterns |
| Driver's license | Varies by state/country | State-specific patterns |
| National ID | Varies by country | Country-specific patterns |
| IP address | 192.168.1.100 | `\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b` |
| IBAN | DE89 3704 0044 0532 0130 00 | `\b[A-Z]{2}\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{0,2}\b` |
| Bank account + routing | 021000021 / 1234567890 | `\b\d{9}\b` (routing), `\b\d{8,17}\b` (account) |

### Quasi-Identifiers

Can identify a person when combined.

| Category | Risk Level | Combined With |
|----------|-----------|---------------|
| Full name | Medium | Address, DOB, employer |
| Date of birth | Medium | ZIP code, gender |
| ZIP/postal code | Low alone | DOB, gender (87% re-identification rate per Sweeney) |
| Gender | Low alone | DOB, ZIP code |
| Ethnicity/race | Low alone | ZIP code, age |
| Job title + employer | Medium | Name, location |
| Medical condition | High (special category) | Any identifier |

### Sensitive Attributes (Special Category under GDPR)

| Category | GDPR Article | Extra Protection Required |
|----------|-------------|--------------------------|
| Health data | Art. 9 | Explicit consent or specific legal basis |
| Biometric data | Art. 9 | Purpose-limited, strong encryption |
| Genetic data | Art. 9 | Highest protection tier |
| Racial/ethnic origin | Art. 9 | Explicit consent required |
| Political opinions | Art. 9 | Explicit consent required |
| Religious beliefs | Art. 9 | Explicit consent required |
| Sexual orientation | Art. 9 | Explicit consent required |
| Trade union membership | Art. 9 | Explicit consent required |

## Detection Strategies

### 1. Regex Pattern Matching

Fast, high recall, but higher false positive rate.

```python
import re

PII_PATTERNS = {
    'email': re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'),
    'ssn': re.compile(r'\b\d{3}-\d{2}-\d{4}\b'),
    'credit_card': re.compile(r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b'),
    'phone_us': re.compile(r'(\+1\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}'),
    'ip_address': re.compile(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b'),
    'date_of_birth': re.compile(r'\b(0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])[-/](19|20)\d{2}\b'),
}

def scan_text(text):
    findings = []
    for pii_type, pattern in PII_PATTERNS.items():
        for match in pattern.finditer(text):
            findings.append({
                'type': pii_type,
                'value': match.group(),
                'position': match.span(),
            })
    return findings
```

### 2. NLP-Based Entity Recognition

Better for unstructured text (support tickets, notes, free-form fields).

```python
# Using Microsoft Presidio
from presidio_analyzer import AnalyzerEngine

analyzer = AnalyzerEngine()
results = analyzer.analyze(
    text="John Smith's SSN is 123-45-6789 and he lives at 42 Oak St",
    language='en',
    entities=[
        "PERSON", "PHONE_NUMBER", "EMAIL_ADDRESS",
        "US_SSN", "CREDIT_CARD", "LOCATION", "DATE_TIME",
    ]
)

for result in results:
    print(f"  Type: {result.entity_type}, Score: {result.score}")
    print(f"  Text: {text[result.start:result.end]}")
```

### 3. Database Schema Analysis

Identify PII by column names and types.

```python
PII_COLUMN_PATTERNS = {
    'email': ['email', 'email_address', 'e_mail', 'user_email'],
    'name': ['first_name', 'last_name', 'full_name', 'name', 'display_name'],
    'phone': ['phone', 'phone_number', 'mobile', 'telephone', 'cell'],
    'address': ['address', 'street', 'city', 'state', 'zip', 'postal_code', 'country'],
    'ssn': ['ssn', 'social_security', 'national_id', 'tax_id', 'tin'],
    'dob': ['date_of_birth', 'dob', 'birth_date', 'birthday'],
    'financial': ['credit_card', 'card_number', 'account_number', 'routing_number', 'iban'],
    'ip': ['ip_address', 'ip', 'client_ip', 'remote_addr'],
}

def classify_columns(schema):
    findings = []
    for table in schema.tables:
        for column in table.columns:
            col_lower = column.name.lower()
            for pii_type, patterns in PII_COLUMN_PATTERNS.items():
                if any(p in col_lower for p in patterns):
                    findings.append({
                        'table': table.name,
                        'column': column.name,
                        'pii_type': pii_type,
                        'data_type': column.type,
                    })
    return findings
```

### 4. Log Pattern Scanning

Detect PII in structured and unstructured log output.

```python
def scan_log_line(line):
    findings = []

    # Check structured fields
    if '=' in line:
        for pair in line.split():
            if '=' in pair:
                key, _, value = pair.partition('=')
                key_lower = key.lower()
                if any(k in key_lower for k in ['email', 'ssn', 'password', 'card', 'phone', 'name']):
                    findings.append({
                        'key': key,
                        'type': 'structured_pii_field',
                        'severity': 'high'
                    })

    # Check for PII patterns in unstructured content
    for pii_type, pattern in PII_PATTERNS.items():
        if pattern.search(line):
            findings.append({
                'type': pii_type,
                'severity': 'high' if pii_type in ['ssn', 'credit_card'] else 'medium'
            })

    return findings
```

## Code Scanning Patterns

### Logging Statements

```python
# PATTERNS TO FLAG IN CODE REVIEW

# Direct PII in log statements
logger.info(f"User registered: {user.email}")        # FLAG: email in log
logger.debug(f"Payment: card={card_number}")          # FLAG: card in log
logger.error(f"Auth failed: password={password}")     # FLAG: password in log

# Object serialization (may contain PII)
logger.info(f"User data: {json.dumps(user.__dict__)}") # FLAG: full object dump
logger.debug(f"Request body: {request.body}")          # FLAG: request body may have PII
```

### Semgrep Rules for PII in Logs

```yaml
rules:
  - id: pii-in-log-email
    patterns:
      - pattern: |
          $LOGGER.$METHOD(..., $MSG, ...)
      - metavariable-regex:
          metavariable: $MSG
          regex: ".*(email|e_mail).*"
      - metavariable-regex:
          metavariable: $METHOD
          regex: "(info|debug|warn|error|log)"
    message: "Potential PII (email) in log statement"
    severity: WARNING

  - id: pii-in-log-user-object
    pattern: |
      $LOGGER.$METHOD(..., json.dumps($USER.__dict__), ...)
    message: "Full object serialization in log may contain PII"
    severity: WARNING
```

## Scanning Tools

| Tool | Type | Strengths | Limitations |
|------|------|-----------|-------------|
| Microsoft Presidio | NLP + regex | Multi-language, extensible, open source | Requires Python runtime |
| AWS Macie | Managed SaaS | S3 scanning, ML-powered, low ops | AWS only, S3 only |
| Google DLP | Managed SaaS | 150+ detectors, infoTypes, de-identification | GCP API, cost per scan |
| piisern | CLI tool | Fast, simple, pattern-based | Limited to common patterns |
| detect-secrets | Pre-commit | Secret + PII patterns, baseline tracking | Secrets-focused, limited PII |
