# Example 2: GDPR-Compliant Data Masking for Staging Environment

## User Prompt

> Design a GDPR-compliant data masking strategy for our staging database. Schema:
>
> ```sql
> CREATE TABLE customers (
>   id SERIAL PRIMARY KEY,
>   email VARCHAR(255) UNIQUE NOT NULL,
>   first_name VARCHAR(100),
>   last_name VARCHAR(100),
>   phone VARCHAR(20),
>   date_of_birth DATE,
>   national_id VARCHAR(20),
>   address TEXT
> );
>
> CREATE TABLE medical_records (
>   id SERIAL PRIMARY KEY,
>   customer_id INT REFERENCES customers(id),
>   diagnosis TEXT,
>   treatment TEXT,
>   doctor_notes TEXT,
>   created_at TIMESTAMP
> );
>
> CREATE TABLE payments (
>   id SERIAL PRIMARY KEY,
>   customer_id INT REFERENCES customers(id),
>   card_last_four VARCHAR(4),
>   amount DECIMAL(10,2),
>   billing_address TEXT
> );
> ```
>
> We have 200,000 customer records. Staging must be realistic for QA testing but contain zero real PII. We serve EU customers.

## Expected Response

### GDPR-Compliant Data Masking Strategy

#### Regulatory Context

Under GDPR, copying production personal data to non-production environments without a lawful basis violates:
- **Article 5(1)(b)** — Purpose limitation (staging is not the original collection purpose)
- **Article 5(1)(c)** — Data minimization (full production data exceeds what testing requires)
- **Article 25** — Data protection by design and by default

The masking strategy must ensure that masked data cannot be re-identified, even when combined across tables.

#### Field Classification and Masking Rules

**customers table:**

| Field | PII Type | Sensitivity | Masking Strategy | Example |
|-------|----------|-------------|------------------|---------|
| id | Pseudoidentifier | Low | Preserve (FK integrity) | 12345 → 12345 |
| email | Direct identifier | High | Format-preserving synthetic | sarah.jones@gmail.com → user_12345@masked.test |
| first_name | Direct identifier | High | Faker-generated, locale-aware | Sarah → Emilia |
| last_name | Direct identifier | High | Faker-generated, locale-aware | Jones → Bergström |
| phone | Direct identifier | High | Format-preserving random | +44 20 7946 0123 → +44 20 7946 9876 |
| date_of_birth | Quasi-identifier | Medium | Year-preserving randomization | 1990-05-15 → 1990-08-22 |
| national_id | Direct identifier | Critical | Full replacement | AB123456C → XX000000X |
| address | Direct identifier | High | Faker-generated, same country | 42 Oxford St, London → 17 Elm Road, Bristol |

**medical_records table:**

| Field | PII Type | Sensitivity | Masking Strategy |
|-------|----------|-------------|------------------|
| id | Internal key | Low | Preserve (FK integrity) |
| customer_id | Reference | Low | Preserve (matches masked customer) |
| diagnosis | Special category (Art. 9) | Critical | Replace with synthetic medical terms from codebook |
| treatment | Special category (Art. 9) | Critical | Replace with synthetic treatment descriptions |
| doctor_notes | Free-text with embedded PII | Critical | Full replacement with synthetic clinical notes |
| created_at | Temporal | Low | Preserve (needed for testing time-based logic) |

**payments table:**

| Field | PII Type | Sensitivity | Masking Strategy |
|-------|----------|-------------|------------------|
| id | Internal key | Low | Preserve |
| customer_id | Reference | Low | Preserve (matches masked customer) |
| card_last_four | Partial identifier | Medium | Random 4 digits |
| amount | Financial | Low | Preserve (needed for testing calculations) |
| billing_address | Direct identifier | High | Faker-generated, same country as customer |

#### Implementation: Masking Pipeline

```python
# masking_pipeline.py — using Faker for synthetic data generation

from faker import Faker
import hashlib
import psycopg2
import json

fake = Faker(['en_GB', 'de_DE', 'fr_FR', 'es_ES'])  # EU locales

def deterministic_seed(original_value, salt):
    """Ensure same input always produces same masked output
    for referential integrity across tables."""
    return int(hashlib.sha256(f"{salt}:{original_value}".encode()).hexdigest()[:8], 16)

def mask_customer(row, salt):
    seed = deterministic_seed(row['email'], salt)
    fake.seed_instance(seed)

    return {
        'id': row['id'],  # preserve for FK integrity
        'email': f"user_{row['id']}@masked.test",
        'first_name': fake.first_name(),
        'last_name': fake.last_name(),
        'phone': fake.phone_number(),
        'date_of_birth': row['date_of_birth'].replace(
            month=fake.random_int(1, 12),
            day=fake.random_int(1, 28)
        ),
        'national_id': f"XX{fake.random_int(100000, 999999)}X",
        'address': fake.address(),
    }

def mask_medical_record(row, salt):
    seed = deterministic_seed(str(row['id']), salt)
    fake.seed_instance(seed)

    synthetic_diagnoses = [
        "Condition Type A - Grade 2",
        "Condition Type B - Mild",
        "Condition Type C - Under observation",
    ]
    synthetic_treatments = [
        "Standard treatment protocol Alpha",
        "Medication regimen Beta - 30 day course",
        "Monitoring protocol Gamma - quarterly review",
    ]

    return {
        'id': row['id'],
        'customer_id': row['customer_id'],  # FK preserved
        'diagnosis': fake.random_element(synthetic_diagnoses),
        'treatment': fake.random_element(synthetic_treatments),
        'doctor_notes': f"Synthetic clinical note: {fake.paragraph(nb_sentences=3)}",
        'created_at': row['created_at'],  # preserve timestamps
    }
```

#### Referential Integrity Guarantees

- **Customer IDs are preserved** — all FK references in `medical_records` and `payments` remain valid
- **Deterministic seeding** — running the pipeline twice on the same data produces identical masked output
- **Cross-table consistency** — a customer's masked name is the same whether accessed via `customers` or joined through `payments`

#### Free-Text Field Handling

Free-text fields (`doctor_notes`, `diagnosis`, `treatment`, `billing_address`) require special attention:

1. **Simple replacement** (recommended for staging): Replace entire text with synthetic content. Fastest and most reliable.
2. **NLP-based entity recognition**: Use spaCy or Presidio to detect and replace named entities within the text. Preserves structure but risk of missed entities.
3. **Template-based generation**: Create domain-specific templates and fill with synthetic data. Good balance of realism and safety.

**Recommendation for medical records:** Use full replacement (option 1) because medical free text often contains patient names, family member names, and location references that NER may miss.

#### Pipeline Execution

```bash
# 1. Snapshot production database (encrypted, access-logged)
pg_dump -h prod-db.internal -U readonly -Fc appdb > /secure-tmp/prod_snapshot.dump

# 2. Restore to isolated masking environment (no network access to production)
pg_restore -h masking-db.internal -U admin -d masking_appdb /secure-tmp/prod_snapshot.dump

# 3. Run masking pipeline
python masking_pipeline.py --source masking_appdb --target staging_appdb --salt $(openssl rand -hex 16)

# 4. Validate: assert no real PII remains
python validate_masking.py --db staging_appdb --original-emails /secure-tmp/original_emails.hash

# 5. Delete production snapshot
shred -u /secure-tmp/prod_snapshot.dump
```

#### Validation Checks

After masking, run these automated assertions:

- No email in staging matches any production email
- No phone number in staging matches any production phone
- No national_id in staging matches any production national_id
- No doctor_notes contain any production customer name
- All FK relationships remain valid
- Row counts match between production and staging
- Amount distributions are statistically similar (for realistic testing)

#### GDPR Compliance Checklist

- [x] No direct identifiers in staging environment
- [x] Quasi-identifiers randomized to prevent re-identification
- [x] Special category data (medical) fully replaced
- [x] Free-text fields fully replaced (not pattern-masked)
- [x] Masking is irreversible (no mapping table stored)
- [x] Production snapshot deleted after masking
- [x] Audit trail of masking pipeline execution
- [x] Documented in DPIA (Data Protection Impact Assessment)
