---
name: stripe-best-practices
description: Implement Stripe payments, subscriptions, webhooks, checkout flows, and billing management with security and compliance best practices.
license: Apache-2.0
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot, Gemini CLI
---

# Stripe Best Practices

## Purpose

Guide implementation of Stripe payment integrations including one-time payments, subscriptions, webhook handling, and billing management with security and compliance best practices.

## When to Use

- Integrating Stripe Checkout or Payment Intents
- Building subscription billing with Stripe
- Handling Stripe webhooks securely
- Managing customers, invoices, and payment methods
- Implementing pricing pages and plan management
- Debugging failed payments or webhook issues

## Instructions

### Step 1 — Choose the Right Integration

| Pattern | Use When |
|---------|----------|
| Stripe Checkout (hosted) | Fastest to ship, Stripe handles the UI and PCI compliance |
| Payment Element (embedded) | Custom UI needed, Stripe handles payment method logic |
| Payment Intents (API-only) | Full control, server-side payment flow |
| Stripe Billing | Recurring subscriptions with invoicing |

**Default to Stripe Checkout** unless you have a specific reason for embedded or API-only.

### Step 2 — Payment Flow Architecture

**Server-side creates, client-side confirms**:

```
Client                    Server                   Stripe
  │                         │                        │
  ├─ "I want to pay" ──────►│                        │
  │                         ├─ Create PaymentIntent ─►│
  │                         │◄─ client_secret ────────┤
  │◄─ client_secret ────────┤                        │
  ├─ confirmPayment() ─────────────────────────────►│
  │◄─ result ──────────────────────────────────────-─┤
  │                         │◄─ webhook: succeeded ──┤
  │                         ├─ fulfill order ────────►│
```

**Rules**:
- Never trust the client for amounts or currency — set on the server
- Use idempotency keys for all server-side Stripe API calls
- Always handle the `payment_intent.succeeded` webhook for fulfillment
- Don't fulfill on client-side confirmation alone (user could close the tab)

### Step 3 — Webhook Handling

**Verify every webhook signature**:
```typescript
const event = stripe.webhooks.constructEvent(
  body,        // raw request body
  signature,   // Stripe-Signature header
  endpointSecret  // from Stripe dashboard
);
```

**Essential webhook events**:
| Event | Action |
|-------|--------|
| `payment_intent.succeeded` | Fulfill the order |
| `payment_intent.payment_failed` | Notify user, retry logic |
| `customer.subscription.created` | Activate subscription |
| `customer.subscription.updated` | Update plan/features |
| `customer.subscription.deleted` | Deactivate subscription |
| `invoice.payment_failed` | Dunning: email user, retry |
| `invoice.paid` | Extend subscription period |

**Webhook best practices**:
- Return 200 immediately, process asynchronously
- Handle events idempotently (same event may be delivered multiple times)
- Log every event with its ID for debugging
- Set up webhook endpoint monitoring

### Step 4 — Subscription Management

**Subscription lifecycle**:
```
trial → active → past_due → canceled
                     ↓
                  unpaid → canceled
```

**Implementation**:
- Store `stripe_customer_id` and `stripe_subscription_id` in your database
- Sync subscription status from webhooks (not API polling)
- Implement dunning (failed payment retries): Stripe auto-retries, you handle UX
- Allow users to update payment method without canceling
- Prorate when changing plans mid-cycle

### Step 5 — Security & Compliance

**PCI Compliance**:
- Use Stripe Elements or Checkout — never handle raw card numbers
- No card data in your logs, database, or error messages
- Use HTTPS everywhere

**Fraud Prevention**:
- Enable Stripe Radar for automated fraud detection
- Verify billing address (AVS) and CVC
- Implement velocity checks (too many attempts in short time)
- Review high-risk payments manually

**Testing**:
- Use test mode API keys (never production keys in development)
- Use Stripe test card numbers (4242... for success, 4000... for declines)
- Test webhook handling with Stripe CLI: `stripe listen --forward-to localhost:3000/webhooks`

## Output Format

```
## Payment Integration
[architecture and flow]

## Implementation
[code with security considerations]

## Webhook Setup
[events to handle and processing logic]

## Testing Plan
[test scenarios and test card numbers]
```

## Examples

**User**: "Set up Stripe Checkout for our SaaS pricing page with monthly and annual plans"

**Response approach**: Create Stripe Products and Prices for each plan. Server route creates Checkout Session with correct price ID. Redirect to Stripe Checkout. Handle `checkout.session.completed` webhook. Store customer and subscription IDs. Build subscription management page.

**User**: "Handle failed payments for our subscription service"

**Response approach**: Implement dunning flow. Handle `invoice.payment_failed` webhook. Email customer with payment update link. Configure Stripe retry schedule. Handle `customer.subscription.updated` with `status: past_due`. Implement grace period before cancellation.
