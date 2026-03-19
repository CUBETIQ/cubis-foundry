---
name: stripe-integration
description: "Use when building Stripe payment integrations: checkout sessions, subscriptions, webhook handling, idempotent API calls, fraud prevention, and end-to-end payment testing with Stripe CLI."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---
# Stripe Integration

## Purpose

Guide the design and implementation of production-grade Stripe payment integrations covering one-time checkout sessions, recurring subscriptions with lifecycle management, secure webhook processing, idempotent server-side calls, and comprehensive test coverage using Stripe test mode and CLI tooling.

## When to Use

- Building a new Stripe Checkout or Payment Intent flow from scratch.
- Adding subscription billing with plan upgrades, downgrades, and cancellations.
- Implementing webhook endpoints that handle payment and subscription events.
- Securing payment flows with idempotency keys, signature verification, and fraud prevention.
- Writing integration tests against Stripe test mode or Stripe CLI fixtures.
- Debugging failed payments, subscription state mismatches, or webhook delivery issues.

## Instructions

1. **Select the integration pattern before writing code** because Stripe offers hosted Checkout, embedded Payment Element, and raw Payment Intents, each with different PCI compliance burden and UI control tradeoffs. Default to hosted Checkout unless custom UI is required.

2. **Create products and prices in Stripe Dashboard or via API before building flows** because all checkout sessions and subscriptions reference price IDs, and defining them upfront avoids runtime price creation that is harder to audit.

3. **Generate checkout sessions server-side with explicit line items and metadata** because the server is the trust boundary for amounts, currency, and tax behavior. Never let the client dictate pricing.

4. **Attach idempotency keys to every mutating Stripe API call** because network retries without idempotency can create duplicate charges, subscriptions, or refunds. Use a deterministic key derived from the business operation (e.g., `order:{orderId}:checkout`).

5. **Store the Stripe customer ID in your database at creation time** because every subsequent operation (checkout, subscription, invoice, portal) requires the customer reference, and re-creating customers produces orphaned records.

6. **Implement webhook signature verification on every incoming event** because unsigned webhooks can be forged by any attacker who discovers the endpoint URL. Use `stripe.webhooks.constructEvent` with the raw body and endpoint secret.

7. **Return HTTP 200 from webhook handlers immediately, then process asynchronously** because Stripe retries delivery if it does not receive a 2xx within a timeout, and long-running synchronous processing causes duplicate delivery.

8. **Handle webhook events idempotently by checking event ID or object version** because Stripe may deliver the same event multiple times during retries and endpoint recovery. Deduplicate by storing processed event IDs.

9. **Sync subscription status exclusively through webhooks, not polling** because webhooks deliver state changes in near-real-time and avoid the latency, rate-limit pressure, and cost of periodic API calls.

10. **Implement dunning logic for failed subscription payments** because Stripe retries automatically, but your application must notify users, display payment update prompts, and enforce grace periods before access revocation.

11. **Use Stripe Customer Portal for self-service billing management** because building plan change, payment method update, and invoice history UI from scratch is error-prone and duplicates functionality Stripe provides.

12. **Configure Stripe Radar rules for fraud prevention** because automated fraud detection with configurable risk thresholds, velocity checks, and block lists reduces chargebacks without manual review overhead.

13. **Test every payment flow with Stripe test card numbers and Stripe CLI** because test mode isolates your integration from real money, and `stripe trigger` plus `stripe listen --forward-to` reproduce webhook sequences locally without deploying.

14. **Separate API keys by environment and never commit them to source control** because leaked live keys grant full access to your Stripe account. Use environment variables and restrict live keys to production deployments.

15. **Handle SCA and 3D Secure flows by using Payment Intents with `requires_action` status** because European regulations mandate Strong Customer Authentication, and payment flows that skip it will see elevated decline rates.

16. **Log Stripe request IDs alongside your internal operation IDs** because Stripe support requires request IDs to investigate issues, and correlating them with your operations accelerates debugging.

## Output Format

```
## Integration Architecture
[Checkout/subscription/payment flow diagram and pattern choice rationale]

## Implementation
[Server and client code with idempotency, error handling, and type safety]

## Webhook Setup
[Events to subscribe, signature verification, idempotent processing logic]

## Testing Plan
[Test card numbers, Stripe CLI commands, edge case scenarios]
```

## References

| File                          | Load when                                                                                     |
| ----------------------------- | --------------------------------------------------------------------------------------------- |
| `references/payment-flows.md` | Building checkout sessions, redirect flows, or embedded payment forms.                       |
| `references/subscription-lifecycle.md` | Implementing recurring billing, plan changes, trials, dunning, and customer portal flows. |
| `references/webhook-handling.md` | Setting up webhook endpoints, handling events, and debugging delivery behavior.           |

## Examples

- "Set up Stripe Checkout for a SaaS app with monthly and annual subscription plans."
- "Implement a webhook handler for subscription lifecycle events with idempotent processing."
- "Add Stripe Customer Portal for self-service billing with plan upgrade and downgrade support."

## Copilot Platform Notes

- Custom agents live under `../../agents/` relative to the mirrored skill directory and use YAML frontmatter such as `name`, `description`, `tools`, `model`, and `handoffs`.
- Agent `handoffs` can guide workflow transitions (for example, `@planner` → `@implementer`).
- Skill files are stored under `.github/skills/` (skill markdown) and `.github/prompts/` (prompt files).
- Path-scoped instructions live under `../../instructions/` and provide file-pattern-targeted guidance via `applyTo` frontmatter.
- User arguments are provided as natural language input in the prompt, not through a `$ARGUMENTS` variable.
- Frontmatter keys `context: fork` and `allowed-tools` are not natively supported; guidance is advisory.
- Reference files can be included via `#file:references/<name>.md` syntax in Copilot Chat.
- MCP configuration lives in `.vscode/mcp.json`. MCP skill tools are available when configured.
- Rules file relative to the mirrored skill directory: `../../rules/copilot-instructions.md` — broad and stable, not task-specific.
