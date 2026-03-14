# Example 1: Detecting and Remediating PII in Application Logs

## User Prompt

> Our compliance team flagged that our application logs might contain PII. Review these log samples and tell us what to fix:
>
> ```
> 2025-03-10 09:15:22 INFO  [UserController] User registered: email=sarah.jones@company.com, name=Sarah Jones, DOB=1990-05-15
> 2025-03-10 09:15:23 DEBUG [PaymentService] Charging card 4532015112830366 exp 12/26 for user_id=8842
> 2025-03-10 09:15:24 ERROR [AuthService] Failed login attempt: username=admin, password=P@ssw0rd123, IP=203.0.113.42
> 2025-03-10 09:15:25 INFO  [OrderService] Shipping order #9921 to 742 Evergreen Terrace, Springfield, IL 62704
> 2025-03-10 09:15:26 WARN  [APIGateway] Rate limited: user_agent=Mozilla/5.0, client_ip=198.51.100.23, api_key=ak_prod_7f3a9b2c1d
> 2025-03-10 09:15:27 INFO  [SupportBot] Ticket #4412 from John Smith (SSN: 987-65-4321): "I need to update my bank account to 021000021-1234567890"
> ```

## Expected Response

### PII Detection Report

#### Findings Summary

| # | Log Line | PII Type | Sensitivity | Severity |
|---|----------|----------|-------------|----------|
| 1 | UserController | Email, full name, date of birth | High | High |
| 2 | PaymentService | Full credit card number, expiration | Critical | Critical |
| 3 | AuthService | Plaintext password | Critical | Critical |
| 4 | OrderService | Physical address | Medium | Medium |
| 5 | APIGateway | IP address, API key | Medium | Medium |
| 6 | SupportBot | SSN, full name, bank routing + account number | Critical | Critical |

---

#### Finding 1: User Registration Log (HIGH)

**Location:** `[UserController]` — user registration flow

**PII detected:**
- Email address: `sarah.jones@company.com`
- Full name: `Sarah Jones`
- Date of birth: `1990-05-15`

**Risk:** Email + name + DOB is sufficient for identity theft and social engineering. Violates GDPR data minimization principle.

**Remediation:**
```javascript
// BEFORE (leaking PII)
logger.info(`User registered: email=${user.email}, name=${user.name}, DOB=${user.dob}`);

// AFTER (redacted)
logger.info(`User registered: user_id=${user.id}`);
```

Log only the internal user ID. If email is needed for debugging, use a truncated hash: `email_hash=${sha256(user.email).slice(0,8)}`.

---

#### Finding 2: Credit Card in Payment Log (CRITICAL)

**Location:** `[PaymentService]` — payment processing

**PII detected:**
- Full credit card number: `4532015112830366`
- Expiration date: `12/26`

**Risk:** This is a PCI DSS violation. Logging full card numbers can result in fines up to $500,000 per incident and loss of payment processing privileges.

**Remediation:**
```javascript
// BEFORE (PCI violation)
logger.debug(`Charging card ${cardNumber} exp ${expiry} for user_id=${userId}`);

// AFTER (PCI compliant)
logger.debug(`Charging card ending ${cardNumber.slice(-4)} for user_id=${userId}`);
```

Additionally, change log level from DEBUG to INFO for payment events and never log expiration dates.

---

#### Finding 3: Plaintext Password in Auth Log (CRITICAL)

**Location:** `[AuthService]` — authentication flow

**PII detected:**
- Plaintext password: `P@ssw0rd123`

**Risk:** Passwords must never be logged under any circumstances. If logs are compromised, all passwords logged this way are exposed. This also violates every security compliance framework.

**Remediation:**
```javascript
// BEFORE (catastrophic)
logger.error(`Failed login: username=${username}, password=${password}, IP=${ip}`);

// AFTER (safe)
logger.warn(`Failed login attempt: username=${username}, IP=${ip}`);
```

Remove the password parameter entirely from all logging code paths. Add a log sanitizer that blocks any field named `password`, `passwd`, `secret`, or `token`.

---

#### Finding 4: Physical Address (MEDIUM)

**Location:** `[OrderService]` — shipping flow

**Remediation:** Log only order ID and shipping status. If address debugging is needed, log city/state only.

#### Finding 5: IP Address and API Key (MEDIUM)

**Location:** `[APIGateway]` — rate limiting

**Remediation:** IP addresses are PII under GDPR. Hash or truncate IPs in logs. Redact the API key to last 4 characters.

#### Finding 6: SSN and Bank Account (CRITICAL)

**Location:** `[SupportBot]` — ticket ingestion

**Remediation:** Implement PII scrubbing on all free-text input before logging. Use regex patterns to detect and redact SSN, bank account numbers, and credit card numbers from support ticket bodies before they reach the logging pipeline.

---

### Systematic Remediation Plan

**1. Build a centralized log sanitizer middleware:**
```javascript
const PII_PATTERNS = {
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  credit_card: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  bank_account: /\b\d{9}-\d{7,17}\b/g,
};

function sanitizeLog(message) {
  let sanitized = message;
  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    sanitized = sanitized.replace(pattern, `[REDACTED:${type}]`);
  }
  return sanitized;
}
```

**2. Add pre-commit PII scanning** using `detect-secrets` or a custom regex scanner.

**3. Configure structured logging** so PII fields can be programmatically redacted rather than relying on string matching.

**4. Audit all existing log statements** across all services for PII exposure patterns.
