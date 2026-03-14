# Stripe Integration Eval Assertions

## Eval 1: Subscription Flow with Webhooks

This eval tests the core Stripe subscription workflow: creating checkout sessions, handling lifecycle webhooks idempotently, and synchronizing subscription state to the application database.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                       |
|---|----------|-------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 1 | contains | `stripe.checkout.sessions.create` — Server-side session creation | Checkout sessions must be created server-side to ensure the server controls pricing, currency, and tax. Client-initiated amounts are a security vulnerability. |
| 2 | contains | `constructEvent` — Webhook signature verification | Every webhook must be verified with `stripe.webhooks.constructEvent` to prevent forged events from triggering fulfillment or state changes. |
| 3 | contains | `customer.subscription` — Subscription lifecycle events | The handler must process subscription lifecycle events (created, updated, deleted) to keep application state in sync with Stripe's source of truth. |
| 4 | contains | `idempotency` — Idempotent webhook processing   | Stripe may deliver the same event multiple times. Without idempotency checks, duplicate processing causes data corruption and double-fulfillment. |
| 5 | contains | `stripe_customer_id` — Customer ID persistence  | The Stripe customer ID must be stored in the database to link Stripe objects (subscriptions, invoices, payments) back to application users. |

### What a passing response looks like

- A server route that creates Checkout Sessions with explicit price IDs, customer reference, and metadata.
- Webhook endpoint that verifies signatures using `constructEvent` before processing any event.
- Event handlers for `customer.subscription.created`, `updated`, and `deleted` that update database records.
- Idempotency guard that checks processed event IDs or object versions before applying state changes.
- Database schema with `stripe_customer_id` and `stripe_subscription_id` columns on the users or subscriptions table.

---

## Eval 2: Checkout Session Implementation

This eval tests the Checkout Session flow: creating sessions with line items and metadata, handling post-payment webhooks, and supporting multiple payment methods.

### Assertions

| # | Type     | What it checks                                  | Why it matters                                                                                       |
|---|----------|-------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 1 | contains | `line_items` — Explicit line item configuration  | Checkout Sessions must define line items server-side with quantities and tax behavior. Omitting them causes checkout to display no items. |
| 2 | contains | `success_url` — Post-checkout redirect           | Users must be redirected to a confirmation page after payment. Without success_url, Stripe has nowhere to send the user after checkout completes. |
| 3 | contains | `metadata` — Session metadata attachment         | Metadata links the Stripe session to the internal order, enabling webhook handlers to correlate payment events with application records. |
| 4 | contains | `checkout.session.completed` — Fulfillment webhook | Fulfillment must be triggered by the webhook, not the client redirect, because users may close the browser before the redirect completes. |
| 5 | contains | `4242` — Test card numbers                       | Including test card numbers proves the implementation accounts for test mode verification, which is essential for development and CI testing. |

### What a passing response looks like

- API route that builds Checkout Session with line_items array, each containing price_data or price ID.
- success_url and cancel_url configured with `{CHECKOUT_SESSION_ID}` template variable for order lookup.
- Metadata attached to the session containing internal order ID and user ID.
- Webhook handler for `checkout.session.completed` that marks the order as paid and triggers fulfillment.
- Test section listing Stripe test card numbers (4242... for success, 4000... for various decline scenarios).
