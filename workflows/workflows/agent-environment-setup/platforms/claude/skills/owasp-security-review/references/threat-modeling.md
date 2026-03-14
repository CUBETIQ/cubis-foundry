# Threat Modeling Reference

## Overview

Threat modeling is a structured approach to identifying security threats, determining their potential impact, and designing mitigations. This reference covers STRIDE, PASTA, and lightweight approaches suitable for feature-level and system-level analysis.

## STRIDE Framework

STRIDE categorizes threats by type. Apply each category to every component and data flow in the system.

| Category | Threat | Example | Primary Mitigation |
|----------|--------|---------|--------------------|
| **S**poofing | Pretending to be someone/something else | Forged JWT, stolen credentials | Authentication (MFA, certificate pinning) |
| **T**ampering | Modifying data or code | SQL injection, man-in-the-middle | Integrity controls (signing, checksums, TLS) |
| **R**epudiation | Denying an action occurred | User denies placing order | Audit logging, digital signatures |
| **I**nformation Disclosure | Exposing data to unauthorized parties | Error messages with stack traces | Encryption, access controls, data classification |
| **D**enial of Service | Making a system unavailable | Resource exhaustion, API flooding | Rate limiting, scaling, input validation |
| **E**levation of Privilege | Gaining unauthorized access levels | Regular user gains admin | Authorization, least privilege, input validation |

## STRIDE-per-Element Process

### Step 1: Draw the Data Flow Diagram

Document these elements:
- **External entities** — users, third-party APIs, external systems
- **Processes** — application components, microservices, functions
- **Data stores** — databases, caches, file systems, queues
- **Data flows** — connections between elements showing data direction
- **Trust boundaries** — lines separating different trust levels

### Step 2: Enumerate Trust Boundaries

Trust boundaries exist where:
- Data crosses from external to internal networks
- Requests move between services with different privilege levels
- Data flows from user-controlled input to application processing
- Data moves between your infrastructure and third-party services
- Different authentication realms interact

### Step 3: Apply STRIDE to Each Element

| Element Type | Applicable STRIDE Categories |
|-------------|------------------------------|
| External entity | S, R |
| Process | S, T, R, I, D, E |
| Data store | T, I, D |
| Data flow | T, I, D |

### Step 4: Assess Risk

For each identified threat, assess:

**Likelihood factors:**
- Attack complexity (how easy is it?)
- Required access level (anonymous, authenticated, admin)
- Required technical skill
- Existing mitigations already in place

**Impact factors:**
- Confidentiality impact (data exposure scope)
- Integrity impact (data modification scope)
- Availability impact (service disruption scope)
- Business impact (financial, reputational, regulatory)

**Risk rating matrix:**

| | Low Impact | Medium Impact | High Impact |
|---|-----------|---------------|-------------|
| **High Likelihood** | Medium | High | Critical |
| **Medium Likelihood** | Low | Medium | High |
| **Low Likelihood** | Low | Low | Medium |

## PASTA Framework

Process for Attack Simulation and Threat Analysis — a risk-centric methodology with seven stages.

| Stage | Activity | Output |
|-------|----------|--------|
| 1. Define objectives | Business requirements, compliance needs | Security objectives document |
| 2. Define technical scope | Architecture, technology stack, data flows | Technical scope diagram |
| 3. Application decomposition | Components, APIs, data stores, trust zones | DFD, asset inventory |
| 4. Threat analysis | Threat intelligence, attack patterns, STRIDE | Threat library |
| 5. Vulnerability analysis | Known CVEs, code review findings, scan results | Vulnerability list |
| 6. Attack modeling | Attack trees, exploit scenarios | Prioritized attack scenarios |
| 7. Risk and impact analysis | Business impact, likelihood, risk rating | Risk mitigation plan |

## Lightweight Threat Model Template

For feature-level analysis when a full PASTA is too heavyweight:

```markdown
## Threat Model: [Feature Name]

### What are we building?
[One paragraph describing the feature and its data flows]

### What can go wrong?
| # | Threat | Category | Likelihood | Impact | Risk |
|---|--------|----------|-----------|--------|------|
| 1 | ...    | STRIDE-X | H/M/L     | H/M/L  | H/M/L|

### What are we going to do about it?
| Threat # | Mitigation | Owner | Status |
|----------|-----------|-------|--------|
| 1        | ...       | ...   | ...    |

### What did we miss?
[Assumptions, known gaps, areas needing further analysis]
```

## Common Threat Patterns by Architecture

### Web Applications
- Session hijacking via XSS
- CSRF on state-changing operations
- SSRF through user-supplied URLs
- Authentication bypass via parameter manipulation
- Mass assignment on API endpoints

### Microservices
- Service-to-service authentication bypass
- Message queue poisoning
- Shared secret compromise affecting multiple services
- Cascading failures from dependency issues
- Data leakage through logging aggregation

### Cloud-Native
- IAM misconfiguration (overly permissive roles)
- Storage bucket public access
- Container escape to host
- Metadata service SSRF (169.254.169.254)
- Cross-account access confusion

### API-First
- Broken object-level authorization (BOLA)
- Excessive data exposure in responses
- Rate limiting bypass via distributed requests
- GraphQL introspection and batching attacks
- API key leakage in client-side code

## Threat Model Review Cadence

| Trigger | Scope |
|---------|-------|
| New feature or service | Feature-level threat model |
| Architecture change | System-level threat model update |
| New third-party integration | Integration-specific threat model |
| Post-incident | Targeted threat model revision |
| Quarterly | Review and update all active threat models |
