# Webhook Handling

Load this when setting up Stripe webhook endpoints, processing events, or debugging delivery issues.

## Endpoint Setup

### Express/Next.js Webhook Route

The critical requirement is receiving the **raw request body** for signature verification. Parsed JSON bodies will fail verification.

```typescript
// Next.js App Router
export async function POST(req: NextRequest) {
  const rawBody = await req.text(); // raw body, not req.json()
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Process event...
  return NextResponse.json({ received: true });
}
```

```typescript
// Express.js -- must use raw body parser for the webhook route
app.post(
  '/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature']!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    // Process event...
    res.json({ received: true });
  }
);
```

- Never apply JSON body parsing middleware to the webhook route.
- Return HTTP 200 immediately. Process the event asynchronously.
- Stripe retries on non-2xx responses with exponential backoff for up to 3 days.

## Event Idempotency

Stripe guarantees at-least-once delivery. Your handler must be idempotent.

```typescript
async function processEvent(event: Stripe.Event) {
  // Strategy 1: Deduplicate by event ID
  const processed = await db.processedEvent.findUnique({
    where: { stripeEventId: event.id },
  });
  if (processed) return; // already handled

  // Strategy 2: Check object version (for updates)
  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription;
    const local = await db.subscription.findUnique({
      where: { stripeId: sub.id },
    });
    // Skip if local version is newer (based on Stripe's created timestamp)
    if (local && local.lastEventTimestamp >= event.created) return;
  }

  await handleEvent(event);

  await db.processedEvent.create({
    data: {
      stripeEventId: event.id,
      type: event.type,
      processedAt: new Date(),
    },
  });
}
```

## Essential Events by Feature

### Checkout

| Event | When | Action |
|-------|------|--------|
| `checkout.session.completed` | Payment succeeds | Activate order or subscription |
| `checkout.session.expired` | Session unused for 24h | Clean up pending records |
| `checkout.session.async_payment_succeeded` | Bank transfer clears | Activate order |
| `checkout.session.async_payment_failed` | Bank transfer fails | Notify user |

### Subscriptions

| Event | When | Action |
|-------|------|--------|
| `customer.subscription.created` | New subscription | Record in database |
| `customer.subscription.updated` | Plan change, status change | Sync local state |
| `customer.subscription.deleted` | Subscription cancelled | Revoke access |
| `invoice.payment_succeeded` | Recurring payment works | Confirm active status |
| `invoice.payment_failed` | Payment retry fails | Send dunning email |
| `invoice.upcoming` | 3 days before renewal | Notify user (optional) |

### Payment Intents

| Event | When | Action |
|-------|------|--------|
| `payment_intent.succeeded` | Payment confirmed | Fulfill order |
| `payment_intent.payment_failed` | Card declined | Show error to user |
| `payment_intent.requires_action` | 3DS challenge needed | Redirect user |

## Webhook Security

```typescript
// Always verify signatures
const event = stripe.webhooks.constructEvent(rawBody, signature, secret);

// Rotate webhook secrets during key rotation:
// 1. Add new endpoint with new secret
// 2. Verify against both secrets during transition
// 3. Remove old endpoint after confirming delivery
function verifyWithFallback(body: string, sig: string): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET_OLD!);
  }
}
```

## Local Development with Stripe CLI

```bash
# Listen to all events
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Listen to specific events only
stripe listen --events checkout.session.completed,invoice.payment_failed \
  --forward-to localhost:3000/api/webhooks/stripe

# Trigger a specific event sequence
stripe trigger payment_intent.succeeded

# Replay a specific event from your Stripe account
stripe events resend evt_xxxxxxxxxxxxx
```

- The CLI prints the webhook signing secret on startup. Use it as `STRIPE_WEBHOOK_SECRET` for local development.
- CLI-forwarded events use a different signing secret than your production webhook endpoint.

## Debugging Delivery Issues

1. Check the Stripe Dashboard under Developers > Webhooks for failed deliveries.
2. Look at the HTTP response code and body your endpoint returned.
3. Verify the raw body is passed to `constructEvent`, not a parsed JSON object.
4. Confirm the webhook secret matches the endpoint (test vs live, CLI vs dashboard).
5. Check that no middleware is transforming the request body before your handler.
