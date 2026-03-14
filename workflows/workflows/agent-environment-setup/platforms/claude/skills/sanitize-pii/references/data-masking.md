# Data Masking Techniques Reference

## Overview

Data masking creates realistic but non-identifying versions of production data for use in non-production environments (staging, development, testing, analytics). Unlike redaction (which removes data), masking replaces data with realistic alternatives that preserve format, distribution, and referential integrity.

## Masking Techniques

### 1. Substitution

Replace real values with values from a lookup table or generated set.

```python
from faker import Faker

fake = Faker(['en_US', 'en_GB', 'de_DE'])

SUBSTITUTION_MAP = {
    'first_name': lambda: fake.first_name(),
    'last_name': lambda: fake.last_name(),
    'email': lambda row: f"user_{row['id']}@masked.example.com",
    'phone': lambda: fake.phone_number(),
    'address': lambda: fake.address(),
    'company': lambda: fake.company(),
    'job_title': lambda: fake.job(),
}

def mask_row(row, table_config):
    masked = dict(row)
    for column, generator in table_config.items():
        if column in masked:
            masked[column] = generator(row) if callable(generator) else generator
    return masked
```

### 2. Shuffling

Swap values between rows within the same column, preserving the value distribution but breaking the link to individuals.

```sql
-- PostgreSQL: shuffle email column
UPDATE customers c1
SET email = c2.email
FROM (
  SELECT id, email,
    ROW_NUMBER() OVER (ORDER BY random()) as rn
  FROM customers
) c2
WHERE c1.id = (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY random()) as rn
    FROM customers
  ) c3
  WHERE c3.rn = c2.rn
);
```

**Limitation:** Shuffling preserves the exact set of values, so unique or rare values may still be identifiable. Use substitution for small datasets.

### 3. Format-Preserving Encryption (FPE)

Encrypts data while maintaining the original format (length, character set).

```python
from ff3 import FF3Cipher

# FF3-1 format-preserving encryption
key = os.environ['FPE_KEY']  # 128 or 192 or 256 bit key
tweak = os.environ['FPE_TWEAK']  # 56 bit tweak

cipher = FF3Cipher(key, tweak, radix=10)

# Encrypt SSN (preserves format: 9 digits)
real_ssn = "123456789"
masked_ssn = cipher.encrypt(real_ssn)
# Returns: "947583216" (still 9 digits)

# Deterministic: same input always produces same output
# Reversible: can decrypt with the key (if needed)
```

**Use when:**
- Data must pass format validation
- Downstream systems expect specific formats
- Reversibility may be needed (with strict key access controls)

### 4. Variance / Perturbation

Add random noise to numerical values, preserving statistical properties.

```python
import numpy as np

def perturb_numeric(value, variance_pct=10):
    """Add random noise within +/- variance_pct percent."""
    noise = np.random.uniform(-variance_pct/100, variance_pct/100)
    return round(value * (1 + noise), 2)

def perturb_date(date, days_variance=30):
    """Shift date by random number of days."""
    shift = timedelta(days=np.random.randint(-days_variance, days_variance))
    return date + shift

# Usage
salary = 85000.00
masked_salary = perturb_numeric(salary, variance_pct=15)
# Returns: 78,350.00 to 97,750.00 (random within range)

dob = date(1990, 5, 15)
masked_dob = perturb_date(dob, days_variance=60)
# Returns: date within 60 days of original
```

### 5. Generalization

Replace specific values with broader categories.

```python
GENERALIZATION_RULES = {
    'age': lambda age: f"{(age // 10) * 10}-{(age // 10) * 10 + 9}",
    # 34 → "30-39"

    'postal_code': lambda pc: pc[:3] + "**",
    # 62704 → "627**"

    'date_of_birth': lambda dob: str(dob.year),
    # 1990-05-15 → "1990"

    'salary': lambda s: f"${(s // 10000) * 10}k-${(s // 10000 + 1) * 10}k",
    # 85000 → "$80k-$90k"
}
```

### 6. Synthetic Data Generation

Generate entirely new datasets that match the statistical properties of production data.

```python
# Using SDV (Synthetic Data Vault)
from sdv.single_table import GaussianCopulaSynthesizer
from sdv.metadata import SingleTableMetadata

# Learn data distribution
metadata = SingleTableMetadata()
metadata.detect_from_dataframe(production_df)
metadata.update_column('email', sdtype='email')
metadata.update_column('phone', sdtype='phone_number')

synthesizer = GaussianCopulaSynthesizer(metadata)
synthesizer.fit(production_df)

# Generate synthetic data
synthetic_df = synthesizer.sample(num_rows=200000)
# Statistical properties match production, but no real individuals
```

## Database Masking Pipeline

### PostgreSQL Masking Script

```sql
-- Step 1: Create masking functions
CREATE OR REPLACE FUNCTION mask_email(email TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN 'user_' || md5(email)::TEXT || '@masked.example.com';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mask_name(name TEXT)
RETURNS TEXT AS $$
DECLARE
  names TEXT[] := ARRAY['Alex', 'Jordan', 'Sam', 'Casey', 'Morgan',
                        'Riley', 'Quinn', 'Avery', 'Blake', 'Drew'];
BEGIN
  RETURN names[1 + (hashtext(name) % array_length(names, 1))::INT];
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mask_phone(phone TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN '+1-555-' || lpad((hashtext(phone) % 10000000)::TEXT, 7, '0');
END;
$$ LANGUAGE plpgsql;

-- Step 2: Apply masking
UPDATE customers SET
  email = mask_email(email),
  first_name = mask_name(first_name),
  last_name = mask_name(last_name || '_last'),
  phone = mask_phone(phone),
  national_id = 'XX' || lpad((hashtext(national_id) % 1000000)::TEXT, 6, '0') || 'X',
  address = 'Masked Address ' || id,
  date_of_birth = date_of_birth + (hashtext(email) % 60 - 30);  -- shift +/- 30 days

-- Step 3: Mask free-text fields (full replacement)
UPDATE support_tickets SET
  body = 'Synthetic ticket content for testing purposes. Ticket ID: ' || id,
  agent_notes = 'Synthetic agent notes for ticket ' || id;

UPDATE medical_records SET
  diagnosis = 'Condition-' || (hashtext(diagnosis) % 50 + 1),
  treatment = 'Treatment-Protocol-' || (hashtext(treatment) % 30 + 1),
  doctor_notes = 'Synthetic clinical notes for record ' || id;
```

## Referential Integrity

### Cross-Table Consistency

When masking related tables, the same source value must produce the same masked value across all tables.

```python
class ConsistentMasker:
    def __init__(self, salt):
        self.salt = salt
        self.cache = {}

    def mask(self, value, pii_type):
        cache_key = f"{pii_type}:{value}"
        if cache_key not in self.cache:
            seed = int(hashlib.sha256(
                f"{self.salt}:{cache_key}".encode()
            ).hexdigest()[:8], 16)
            fake.seed_instance(seed)

            if pii_type == 'email':
                self.cache[cache_key] = f"user_{seed % 999999}@masked.test"
            elif pii_type == 'name':
                self.cache[cache_key] = fake.name()

        return self.cache[cache_key]

# Same email in customers and orders tables → same masked email
masker = ConsistentMasker(salt="random-salt-per-masking-run")
```

### Foreign Key Preservation

```
Production:              Masked:
customers.id = 42        customers.id = 42  (preserved)
orders.customer_id = 42  orders.customer_id = 42  (preserved)
customers.email = real   customers.email = masked

FK relationships remain valid because IDs are preserved.
PII is masked in the columns that contain it.
```

## Masking Quality Validation

| Check | Method | Expected Result |
|-------|--------|-----------------|
| No real PII | Cross-reference with production hashes | Zero matches |
| Format preserved | Run application validation against masked data | All records pass |
| FK integrity | Run `ANALYZE` + FK constraint checks | Zero violations |
| Data distribution | Compare histograms (age, amounts) | Similar shape |
| Row counts | Compare counts per table | Exact match |
| Uniqueness | Check unique constraints | No duplicates where originals were unique |
| Null handling | Check null patterns | Same null distribution |

## Tools

| Tool | Type | Open Source | Features |
|------|------|------------|----------|
| Faker | Library | Yes | Generates fake data by locale |
| SDV | Library | Yes | ML-based synthetic data |
| Presidio | Library | Yes | PII detection + anonymization |
| AWS DMS | Service | No | Database migration with masking |
| Tonic.ai | SaaS | No | Enterprise data masking |
| Delphix | Enterprise | No | Dynamic data masking |
