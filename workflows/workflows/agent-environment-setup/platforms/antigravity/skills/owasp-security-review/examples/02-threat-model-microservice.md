# Example 2: Threat Model for a Payment Processing Service

## User Prompt

> Build a threat model for our payment processing microservice. It accepts payment requests via REST API from our frontend, validates with Stripe API, stores transaction records in PostgreSQL, sends confirmation emails via SQS + Lambda, and exposes a webhook endpoint for Stripe callbacks. Runs in AWS ECS Fargate behind an ALB.

## Expected Response

### Threat Model — Payment Processing Service

#### System Overview

```
[Browser] → [ALB] → [ECS Fargate: Payment Service] → [Stripe API]
                                    ↓                       ↓
                              [PostgreSQL RDS]        [Stripe Webhooks]
                                    ↓                       ↓
                              [SQS Queue] → [Lambda: Email Sender]
```

#### Trust Boundaries

| # | Boundary | Between | Risk Level |
|---|----------|---------|------------|
| TB1 | Internet → ALB | External users and public load balancer | High |
| TB2 | ALB → ECS | Load balancer and application container | Medium |
| TB3 | ECS → PostgreSQL | Application and persistent data store | High |
| TB4 | ECS → Stripe API | Application and third-party payment processor | High |
| TB5 | Stripe → Webhook endpoint | Third-party callback and application | High |
| TB6 | ECS → SQS | Application and async message queue | Medium |

#### STRIDE Analysis

| Threat Category | Threat | Trust Boundary | Severity | Mitigation |
|----------------|--------|----------------|----------|------------|
| **Spoofing** | Attacker forges Stripe webhook calls | TB5 | Critical | Verify Stripe webhook signatures using `stripe.webhooks.constructEvent()` |
| **Spoofing** | Stolen JWT used to initiate payments | TB1 | High | Short-lived tokens, device fingerprinting, transaction limits |
| **Tampering** | Payment amount modified in transit | TB1 | Critical | Server-side amount calculation; never trust client-submitted amounts |
| **Tampering** | Transaction records altered in database | TB3 | High | Database audit logging, append-only transaction table, row-level security |
| **Repudiation** | User denies making a payment | TB1 | Medium | Immutable audit trail with timestamps, IP, and user agent |
| **Information Disclosure** | Card data logged or stored | TB3 | Critical | Never handle raw card data — use Stripe.js tokenization; PCI DSS compliance |
| **Information Disclosure** | Database credentials in environment | TB3 | High | Use AWS Secrets Manager with automatic rotation |
| **Denial of Service** | Payment endpoint overwhelmed | TB1 | High | Rate limiting per user, ALB WAF rules, circuit breaker to Stripe |
| **Elevation of Privilege** | Non-admin user refunds own transactions | TB2 | High | Role-based authorization on refund endpoints, separate admin API |

#### High-Priority Recommendations

1. **Webhook signature verification** (Critical) — Validate every Stripe webhook using their signing secret. Reject unsigned or replayed events.
2. **Server-side amount validation** (Critical) — Always calculate payment amounts server-side from the cart/order state. Never accept amounts from the client.
3. **PCI DSS scope minimization** (Critical) — Ensure raw card numbers never touch the server. Use Stripe.js + Payment Intents for client-side tokenization.
4. **Database credential rotation** (High) — Migrate from static credentials to AWS Secrets Manager with RDS integration for automatic rotation.
5. **Idempotency keys** (High) — Implement idempotency for payment creation to prevent duplicate charges from retries.
6. **Audit logging** (High) — Log all payment events (create, capture, refund, webhook) with immutable timestamps for dispute resolution.

#### Residual Risks

| Risk | Likelihood | Impact | Acceptance Rationale |
|------|-----------|--------|---------------------|
| Stripe API outage | Low | High | Circuit breaker + queue for retry; Stripe SLA covers this |
| Insider threat (DB admin) | Low | Critical | Mitigated by audit logging and encryption at rest; accepted given trust model |
