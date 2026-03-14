# Redaction Strategies Reference

## Overview

Redaction removes or replaces PII values so the data cannot identify individuals. The right strategy depends on whether redaction must be reversible, whether data utility must be preserved, and what compliance requirements apply.

## Redaction Types

| Type | Description | Reversible | Data Utility | Use Case |
|------|------------|-----------|-------------|----------|
| Destructive | Replace with fixed token | No | None | Logs, error messages |
| Deterministic | Same input always produces same output | No (but consistent) | Referential | Analytics, testing |
| Format-preserving | Output matches input format | Optional | High | Staging databases |
| Tokenization | Replace with random token, store mapping | Yes (with vault) | None (without vault) | Payment processing |
| Partial masking | Reveal some characters | No | Partial | Display (card ending 4242) |

## Implementation Patterns

### Destructive Redaction (Logs)

```javascript
// Log sanitizer middleware
const REDACTION_RULES = [
  { name: 'email', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[REDACTED:email]' },
  { name: 'ssn', pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[REDACTED:ssn]' },
  { name: 'credit_card', pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: '[REDACTED:card]' },
  { name: 'phone', pattern: /(\+\d{1,3}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g, replacement: '[REDACTED:phone]' },
  { name: 'ip', pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, replacement: '[REDACTED:ip]' },
];

function sanitizeLogMessage(message) {
  let sanitized = message;
  for (const rule of REDACTION_RULES) {
    sanitized = sanitized.replace(rule.pattern, rule.replacement);
  }
  return sanitized;
}

// Integrate with logging library
const winston = require('winston');
const sanitizeFormat = winston.format((info) => {
  info.message = sanitizeLogMessage(info.message);
  return info;
});

const logger = winston.createLogger({
  format: winston.format.combine(
    sanitizeFormat(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});
```

### Deterministic Redaction (Analytics)

Same input always produces the same pseudonym, enabling joins and aggregation.

```python
import hashlib
import hmac

REDACTION_KEY = os.environ['REDACTION_HMAC_KEY']

def deterministic_redact(value, pii_type):
    """Same input always produces same output for consistent references."""
    tag = hmac.new(
        REDACTION_KEY.encode(),
        f"{pii_type}:{value}".encode(),
        hashlib.sha256
    ).hexdigest()[:16]
    return f"[{pii_type}:{tag}]"

# Usage
email = "sarah@example.com"
redacted = deterministic_redact(email, "email")
# Always returns: [email:a7b3c9d1e5f2g8h4]
# Can join records by this pseudonym without knowing the real email
```

### Format-Preserving Redaction (Staging)

Output looks like real data and passes format validation.

```python
from faker import Faker
import hashlib

fake = Faker()

def format_preserving_redact(value, pii_type, seed_salt):
    """Replace PII with realistic fake data, deterministically."""
    seed = int(hashlib.sha256(f"{seed_salt}:{value}".encode()).hexdigest()[:8], 16)
    fake.seed_instance(seed)

    if pii_type == 'email':
        return f"{fake.user_name()}@masked.example.com"
    elif pii_type == 'name':
        return fake.name()
    elif pii_type == 'phone':
        return fake.phone_number()
    elif pii_type == 'address':
        return fake.address()
    elif pii_type == 'ssn':
        return f"{fake.random_int(100,999)}-{fake.random_int(10,99)}-{fake.random_int(1000,9999)}"
    elif pii_type == 'credit_card':
        return fake.credit_card_number()
    elif pii_type == 'date_of_birth':
        return fake.date_of_birth(minimum_age=18, maximum_age=80).isoformat()
    else:
        return f"[REDACTED:{pii_type}]"
```

### Tokenization (Payment Processing)

Replace sensitive data with a random token; store the mapping in a secure vault.

```python
class TokenVault:
    def __init__(self, vault_client):
        self.vault = vault_client

    def tokenize(self, value, data_type):
        """Replace value with a random token, store mapping in vault."""
        token = f"tok_{secrets.token_hex(16)}"
        self.vault.write(
            f"tokens/data/{token}",
            original=value,
            data_type=data_type,
            created_at=datetime.utcnow().isoformat()
        )
        return token

    def detokenize(self, token):
        """Retrieve original value (requires vault access + authorization)."""
        secret = self.vault.read(f"tokens/data/{token}")
        return secret['data']['original']
```

### Partial Masking (Display)

```javascript
function partialMask(value, type) {
  switch (type) {
    case 'email':
      const [local, domain] = value.split('@');
      return `${local[0]}***@${domain}`;
      // sarah@example.com → s***@example.com

    case 'phone':
      return value.replace(/\d(?=\d{4})/g, '*');
      // +1 (555) 123-4567 → +* (***) ***-4567

    case 'credit_card':
      return `**** **** **** ${value.slice(-4)}`;
      // 4111111111111111 → **** **** **** 1111

    case 'ssn':
      return `***-**-${value.slice(-4)}`;
      // 123-45-6789 → ***-**-6789

    default:
      return '[MASKED]';
  }
}
```

## Structured Logging with Built-in Redaction

### PII-Aware Logger

```javascript
class PIIAwareLogger {
  constructor(sensitiveFields) {
    this.sensitiveFields = new Set(sensitiveFields);
  }

  sanitizeObject(obj) {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (this.sensitiveFields.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  log(level, message, context = {}) {
    const sanitizedContext = this.sanitizeObject(context);
    console.log(JSON.stringify({
      level,
      message,
      ...sanitizedContext,
      timestamp: new Date().toISOString(),
    }));
  }
}

const logger = new PIIAwareLogger([
  'email', 'password', 'ssn', 'credit_card', 'phone',
  'date_of_birth', 'address', 'name', 'first_name', 'last_name',
  'card_number', 'cvv', 'national_id', 'passport',
]);

// Usage — PII fields are automatically redacted
logger.log('info', 'User created', {
  user_id: 123,
  email: 'sarah@example.com',  // → [REDACTED]
  plan: 'premium',
});
```

## Redaction Validation

### Testing Redaction Effectiveness

```python
def test_redaction_completeness():
    """Assert that no real PII appears in redacted output."""
    real_emails = load_production_emails()  # Hashed for comparison
    redacted_data = load_redacted_dataset()

    for record in redacted_data:
        for field_value in record.values():
            if isinstance(field_value, str):
                # Check no real email pattern exists
                assert not re.search(r'@(gmail|yahoo|outlook|company)', field_value), \
                    f"Possible real email in redacted data: {field_value}"

                # Check no SSN pattern exists
                assert not re.search(r'\b\d{3}-\d{2}-\d{4}\b', field_value), \
                    f"Possible SSN in redacted data: {field_value}"

                # Check against known production values
                hashed = hashlib.sha256(field_value.encode()).hexdigest()
                assert hashed not in real_emails, \
                    f"Production PII found in redacted data"
```

## Performance Considerations

| Strategy | Throughput | Memory | Latency |
|----------|-----------|--------|---------|
| Regex replacement | Very high | Low | < 1ms per record |
| NLP-based detection | Low | High | 50-200ms per record |
| Format-preserving encryption | High | Low | < 5ms per record |
| Tokenization (with vault) | Medium | Low | 10-50ms per record (network) |
| Deterministic HMAC | Very high | Low | < 1ms per record |
