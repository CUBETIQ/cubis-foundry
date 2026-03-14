# Subscription Lifecycle

Load this when implementing recurring billing, handling plan changes, managing trials, or building dunning logic.

## Creating Subscriptions

### Via Checkout Session

```typescript
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  customer: customerId,
  line_items: [{ price: 'price_monthly_pro', quantity: 1 }],
  subscription_data: {
    trial_period_days: 14,
    metadata: { userId: 'user_123', plan: 'pro' },
  },
  success_url: 'https://app.example.com/welcome',
  cancel_url: 'https://app.example.com/pricing',
});
```

### Via API (for returning customers)

```typescript
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: 'price_monthly_pro' }],
  default_payment_method: 'pm_xxx',
  trial_period_days: 14,
  payment_behavior: 'default_incomplete',
  expand: ['latest_invoice.payment_intent'],
});
```

- `default_incomplete` requires the client to confirm payment before activating. Use this for SCA compliance.
- `allow_incomplete` activates immediately and creates a pending invoice. Use for trusted customers or free trials.

## Subscription States

```
trialing -> active -> past_due -> canceled
                   -> canceled (immediate)
                   -> unpaid (after all retries)
                   -> paused (manual)
```

- **trialing**: No charge yet. Transitions to `active` when trial ends and first payment succeeds.
- **active**: Payment current. The desired steady state.
- **past_due**: Payment failed but retries remain. User should still have access during grace period.
- **canceled**: Terminal state. No more invoices. Access should be revoked.
- **unpaid**: All retries exhausted. Configure this vs `canceled` in Stripe subscription settings.

## Plan Changes (Upgrades and Downgrades)

### Immediate Proration (Default)

```typescript
const subscription = await stripe.subscriptions.retrieve(subId);
const baseItem = subscription.items.data[0];

await stripe.subscriptions.update(subId, {
  items: [{ id: baseItem.id, price: 'price_monthly_enterprise' }],
  proration_behavior: 'create_prorations',
});
```

- Stripe calculates unused time on the old plan as a credit and charges the remaining time on the new plan.
- The proration appears as line items on the next invoice.

### Proration Options

| Behavior | Effect |
|----------|--------|
| `create_prorations` | Credit old plan, charge new plan prorated (default) |
| `always_invoice` | Same as above but immediately creates and pays an invoice |
| `none` | No proration. New price applies at next billing cycle |

### Previewing Proration

```typescript
const preview = await stripe.invoices.retrieveUpcoming({
  customer: customerId,
  subscription: subId,
  subscription_items: [
    { id: itemId, price: 'price_monthly_enterprise' },
  ],
  subscription_proration_behavior: 'create_prorations',
});

console.log('Next invoice total:', preview.total); // in cents
console.log('Proration line items:', preview.lines.data);
```

- Always show the proration preview to the user before confirming a plan change.

## Trial Periods

```typescript
// Trial on subscription creation
const sub = await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: 'price_monthly_pro' }],
  trial_period_days: 14,
});

// Trial with explicit end date
const sub = await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: 'price_monthly_pro' }],
  trial_end: Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60,
});

// End trial immediately (start billing now)
await stripe.subscriptions.update(subId, {
  trial_end: 'now',
});
```

- Collect a payment method during trial signup. Trials without payment methods have high churn.
- Send a reminder email 3 days before trial ends using the `customer.subscription.trial_will_end` event.

## Cancellation Patterns

### Cancel at Period End (Recommended)

```typescript
await stripe.subscriptions.update(subId, {
  cancel_at_period_end: true,
});
// User retains access until the end of the billing period
// Stripe fires customer.subscription.updated immediately
// Stripe fires customer.subscription.deleted at period end
```

### Cancel Immediately

```typescript
await stripe.subscriptions.cancel(subId);
// Access should be revoked immediately
// Stripe fires customer.subscription.deleted
```

### Reactivate Before Period End

```typescript
await stripe.subscriptions.update(subId, {
  cancel_at_period_end: false,
});
```

## Dunning Strategy

Stripe retries failed payments automatically based on your Smart Retries configuration. Your application handles the user-facing communication.

```typescript
// Webhook: invoice.payment_failed
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const attemptCount = invoice.attempt_count;
  const userId = invoice.subscription_details?.metadata?.userId;

  switch (attemptCount) {
    case 1:
      await notify(userId, 'payment_failed_gentle', {
        message: 'Your payment failed. We will retry automatically.',
        updatePaymentUrl: await createPortalUrl(invoice.customer as string),
      });
      break;
    case 2:
      await notify(userId, 'payment_failed_urgent', {
        message: 'Second payment attempt failed. Please update your payment method.',
        daysUntilCancellation: 7,
      });
      break;
    case 3:
      await notify(userId, 'payment_failed_final', {
        message: 'Final payment attempt failed. Your subscription will be cancelled.',
      });
      break;
  }
}
```

### Dunning Best Practices

- Show an in-app banner for `past_due` subscriptions with a direct link to update payment.
- Keep access active during the retry period (typically 1-3 weeks).
- Send the Customer Portal URL so users can update their payment method without contacting support.
- Configure Smart Retries in Stripe Dashboard for optimal retry timing.
- Use `invoice.upcoming` webhook to warn users about upcoming charges 3 days before renewal.

## Metered Billing

```typescript
// Report usage on a metered subscription item
await stripe.subscriptionItems.createUsageRecord(
  meteredItemId,
  {
    quantity: 150,          // units consumed
    timestamp: timestamp,   // when usage occurred
    action: 'increment',    // or 'set' to replace
  }
);
```

- Use `increment` for additive reporting (safer with retries).
- Use `set` only when you maintain the canonical usage count and report the total.
- Report usage before the billing period ends. Unreported usage is not billed.
- Stripe aggregates usage records per billing period and adds them to the invoice.
