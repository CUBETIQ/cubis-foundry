# Payment Flows

Load this when building checkout sessions, Payment Intents, or choosing between Stripe's payment integration patterns.

## Choosing a Payment Pattern

### Stripe Checkout (Hosted)

Use for most cases. Stripe hosts the payment page, handles SCA/3DS, and manages payment method collection.

```typescript
const session = await stripe.checkout.sessions.create({
  mode: 'payment', // or 'subscription' or 'setup'
  line_items: [{ price: 'price_xxx', quantity: 1 }],
  success_url: 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://example.com/cancel',
  customer: customerId,
  metadata: { orderId: 'order_123' },
});
// Redirect user to session.url
```

- PCI compliance: SAQ-A (simplest level).
- Supports Apple Pay, Google Pay, bank transfers, and 40+ local payment methods.
- Limited UI customization: colors, logo, and fonts only.

### Payment Element (Embedded)

Use when you need the payment form embedded in your own UI but still want Stripe to handle payment method rendering.

```typescript
// Server: create a PaymentIntent
const paymentIntent = await stripe.paymentIntents.create({
  amount: 2999,
  currency: 'usd',
  customer: customerId,
  automatic_payment_methods: { enabled: true },
  metadata: { orderId: 'order_123' },
});

// Client: mount the Payment Element
const elements = stripe.elements({
  clientSecret: paymentIntent.client_secret,
});
const paymentElement = elements.create('payment');
paymentElement.mount('#payment-element');
```

- PCI compliance: SAQ-A-EP (moderate).
- Full control over the surrounding page layout.
- Stripe handles payment method selection and 3DS challenges.

### Raw Payment Intents

Use only when Payment Element does not meet your requirements (custom card entry, server-to-server charges).

```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 2999,
  currency: 'usd',
  payment_method: 'pm_card_visa',
  confirm: true,
  return_url: 'https://example.com/return',
});
```

- PCI compliance: SAQ-D (highest burden) if you handle raw card numbers.
- You manage 3DS challenges, error handling, and payment method display.

## Idempotency Keys

Attach an idempotency key to every mutating Stripe API call. Stripe caches the response for 24 hours and returns the same result for duplicate requests.

```typescript
await stripe.paymentIntents.create(
  { amount: 5000, currency: 'usd', customer: 'cus_xxx' },
  { idempotencyKey: `order:${orderId}:payment` }
);
```

- Derive keys from the business operation, not random UUIDs, so that retries of the same operation use the same key.
- Different operations on the same entity need different keys: `order:123:payment` vs `order:123:refund`.
- Idempotency keys are scoped to the API key (test vs live).

## Handling 3D Secure (SCA)

European regulations require Strong Customer Authentication. Payment Intents transition through states:

```
requires_payment_method -> requires_confirmation -> requires_action -> processing -> succeeded
```

```typescript
// After confirming, check the status
if (paymentIntent.status === 'requires_action') {
  // Redirect the user to paymentIntent.next_action.redirect_to_url.url
  // or use stripe.js handleNextAction() on the client
}
```

- Always use `return_url` or `next_action` handling. Never assume payment succeeds after `confirm`.
- Test with card `4000 0025 0000 3155` (requires authentication) and `4000 0000 0000 3220` (3DS2 required).

## Currency and Amount Handling

Stripe amounts are in the smallest currency unit (cents for USD, yen for JPY).

```typescript
// $29.99 in USD
const amount = 2999;

// For zero-decimal currencies (JPY, KRW), use the full amount
const amountJpy = 3000; // 3000 yen

// Helper for conversion
function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}
```

- Never use floating-point arithmetic for currency. Convert to integers immediately.
- Use Stripe's `currency` parameter to declare the currency. Stripe validates the amount against the currency's decimal places.

## Error Handling

```typescript
try {
  const charge = await stripe.charges.create({ amount: 2000, currency: 'usd' });
} catch (err) {
  if (err instanceof Stripe.errors.StripeCardError) {
    // Card was declined: err.code, err.decline_code
    console.log('Decline code:', err.decline_code);
  } else if (err instanceof Stripe.errors.StripeRateLimitError) {
    // Too many requests: implement exponential backoff
  } else if (err instanceof Stripe.errors.StripeInvalidRequestError) {
    // Invalid parameters: fix the request
  } else if (err instanceof Stripe.errors.StripeAPIError) {
    // Stripe server error: retry with idempotency key
  } else if (err instanceof Stripe.errors.StripeConnectionError) {
    // Network error: retry with idempotency key
  }
}
```

- Always log `err.requestId` for Stripe support investigations.
- Card errors are expected in normal flow; do not treat them as bugs.
- Retry API errors and connection errors with exponential backoff and the same idempotency key.
