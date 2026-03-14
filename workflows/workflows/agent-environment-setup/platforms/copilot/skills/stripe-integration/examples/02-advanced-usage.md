# Example: Subscription with Usage-Based Billing and Dunning

## Scenario

A team is building an API platform that charges customers a base subscription fee plus metered usage for API calls. The Pro plan costs $49/mo and includes 10,000 API calls; additional calls are billed at $0.005 each. The system must report usage to Stripe hourly, handle failed payment retries with dunning emails, support plan upgrades and downgrades mid-cycle with proration, and provide a customer portal for self-service billing management.

## Prompt

"Implement a usage-based Stripe subscription for our API platform. Pro plan is $49/mo base with 10,000 included API calls, then $0.005 per additional call. Report usage to Stripe hourly. Handle invoice payment failures with dunning. Support mid-cycle plan changes with proration. Add Stripe Customer Portal for self-service billing."

## Expected Output

### Stripe Price Configuration

```typescript
// scripts/setup-stripe-products.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function setupProducts() {
  const product = await stripe.products.create({
    name: 'API Platform',
    description: 'API access with usage-based billing',
  });

  // Base subscription price
  const basePrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 4900,
    currency: 'usd',
    recurring: { interval: 'month' },
    lookup_key: 'pro_base',
  });

  // Metered usage price (per API call above included tier)
  const usagePrice = await stripe.prices.create({
    product: product.id,
    currency: 'usd',
    recurring: {
      interval: 'month',
      usage_type: 'metered',
    },
    billing_scheme: 'tiered',
    tiers_mode: 'graduated',
    tiers: [
      { up_to: 10000, unit_amount: 0 },       // First 10k included
      { up_to: 'inf', unit_amount_decimal: '0.5' }, // $0.005 per call after
    ],
    lookup_key: 'pro_usage',
  });

  console.log('Base price:', basePrice.id);
  console.log('Usage price:', usagePrice.id);
}

setupProducts();
```

### Subscription Creation with Multiple Prices

```typescript
// app/api/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
  });

  const subscription = await stripe.subscriptions.create(
    {
      customer: user.stripeCustomerId!,
      items: [
        { price: process.env.STRIPE_PRO_BASE_PRICE_ID! },
        { price: process.env.STRIPE_PRO_USAGE_PRICE_ID! },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: { userId: user.id },
    },
    { idempotencyKey: `subscribe:${user.id}:pro` }
  );

  const invoice = subscription.latest_invoice as Stripe.Invoice;
  const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

  return NextResponse.json({
    subscriptionId: subscription.id,
    clientSecret: paymentIntent.client_secret,
  });
}
```

### Usage Reporting Service

```typescript
// lib/usage-reporter.ts
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';

export async function reportUsageForAllSubscriptions() {
  const activeSubscriptions = await db.subscription.findMany({
    where: { status: 'active' },
    include: { user: true },
  });

  for (const sub of activeSubscriptions) {
    // Get unreported API calls since last report
    const unreportedCount = await db.apiCallLog.count({
      where: {
        userId: sub.userId,
        reportedToStripe: false,
        createdAt: { gte: sub.currentPeriodStart },
      },
    });

    if (unreportedCount === 0) continue;

    // Find the metered subscription item
    const stripeSubscription = await stripe.subscriptions.retrieve(
      sub.stripeSubscriptionId,
      { expand: ['items.data'] }
    );

    const meteredItem = stripeSubscription.items.data.find(
      (item) => item.price.recurring?.usage_type === 'metered'
    );

    if (!meteredItem) continue;

    // Report usage to Stripe
    await stripe.subscriptionItems.createUsageRecord(
      meteredItem.id,
      {
        quantity: unreportedCount,
        timestamp: Math.floor(Date.now() / 1000),
        action: 'increment',
      },
      { idempotencyKey: `usage:${sub.id}:${Date.now()}` }
    );

    // Mark calls as reported
    await db.apiCallLog.updateMany({
      where: {
        userId: sub.userId,
        reportedToStripe: false,
        createdAt: { gte: sub.currentPeriodStart },
      },
      data: { reportedToStripe: true },
    });

    console.log(`Reported ${unreportedCount} calls for user ${sub.userId}`);
  }
}
```

### Cron Job for Hourly Usage Reporting

```typescript
// app/api/cron/report-usage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { reportUsageForAllSubscriptions } from '@/lib/usage-reporter';

export async function POST(req: NextRequest) {
  // Verify cron secret to prevent unauthorized triggers
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await reportUsageForAllSubscriptions();
  return NextResponse.json({ success: true });
}
```

### Dunning and Payment Failure Webhook Handlers

```typescript
// app/api/webhooks/stripe/route.ts (extended handler)
async function handleWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const userId = invoice.subscription_details?.metadata?.userId;
      if (!userId) break;

      const attemptCount = invoice.attempt_count ?? 0;

      // Update subscription status to past_due
      await db.subscription.update({
        where: { stripeSubscriptionId: invoice.subscription as string },
        data: { status: 'past_due' },
      });

      // Send dunning email based on attempt count
      if (attemptCount === 1) {
        await sendEmail(userId, 'payment-failed-first', {
          updateUrl: await createPortalLink(invoice.customer as string),
        });
      } else if (attemptCount === 2) {
        await sendEmail(userId, 'payment-failed-second', {
          updateUrl: await createPortalLink(invoice.customer as string),
          daysRemaining: 7,
        });
      } else if (attemptCount >= 3) {
        await sendEmail(userId, 'payment-failed-final', {
          updateUrl: await createPortalLink(invoice.customer as string),
        });
      }
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      await db.subscription.update({
        where: { stripeSubscriptionId: invoice.subscription as string },
        data: { status: 'active' },
      });
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await db.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: { status: 'cancelled', cancelledAt: new Date() },
      });

      // Revoke API access
      await db.apiKey.updateMany({
        where: { userId: subscription.metadata.userId },
        data: { isActive: false },
      });
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await db.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      });
      break;
    }
  }
}
```

### Mid-Cycle Plan Change with Proration

```typescript
// app/api/subscription/change-plan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const PLAN_PRICES: Record<string, string> = {
  starter: process.env.STRIPE_STARTER_BASE_PRICE_ID!,
  pro: process.env.STRIPE_PRO_BASE_PRICE_ID!,
  enterprise: process.env.STRIPE_ENTERPRISE_BASE_PRICE_ID!,
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { newPlan } = await req.json();
  if (!PLAN_PRICES[newPlan]) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const sub = await db.subscription.findUniqueOrThrow({
    where: { userId: session.user.id },
  });

  const stripeSubscription = await stripe.subscriptions.retrieve(
    sub.stripeSubscriptionId
  );

  // Find the base price item (non-metered)
  const baseItem = stripeSubscription.items.data.find(
    (item) => item.price.recurring?.usage_type !== 'metered'
  );

  if (!baseItem) {
    return NextResponse.json({ error: 'No base plan found' }, { status: 400 });
  }

  const updated = await stripe.subscriptions.update(
    sub.stripeSubscriptionId,
    {
      items: [
        {
          id: baseItem.id,
          price: PLAN_PRICES[newPlan],
        },
      ],
      proration_behavior: 'create_prorations',
    },
    { idempotencyKey: `plan-change:${sub.id}:${newPlan}:${Date.now()}` }
  );

  await db.subscription.update({
    where: { id: sub.id },
    data: { plan: newPlan },
  });

  return NextResponse.json({ subscription: updated.id });
}
```

### Customer Portal Session

```typescript
// app/api/billing/portal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
  });

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId!,
    return_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/billing`,
  });

  return NextResponse.json({ url: portalSession.url });
}

// Helper used by dunning emails
export async function createPortalLink(customerId: string): Promise<string> {
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/billing`,
  });
  return portalSession.url;
}
```

### Integration Test with Stripe CLI

```bash
# Start local webhook forwarding
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Test the full subscription lifecycle
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted

# Test metered usage reporting
curl -X POST http://localhost:3000/api/cron/report-usage \
  -H "Authorization: Bearer $CRON_SECRET"

# Verify usage records in Stripe Dashboard
stripe subscription_items list_usage_record_summaries si_XXXXX
```

## Key Decisions

- **Graduated tiered pricing** -- the first 10,000 calls are free (included in base), and only excess usage is charged. This is cleaner than calculating overages manually.
- **Hourly usage reporting with idempotency** -- reporting hourly balances cost accuracy against API call volume. The idempotency key prevents duplicate reports if the cron job retries.
- **`action: 'increment'` for usage records** -- avoids race conditions that `set` would introduce if multiple cron executions overlap, since increments are additive.
- **Dunning escalation based on `attempt_count`** -- graduated urgency in emails matches Stripe's automatic retry schedule, giving users multiple chances to fix payment before cancellation.
- **Proration on plan changes** -- Stripe automatically calculates credits and charges for mid-cycle changes, so the application only needs to update its own records.
- **Customer Portal for self-service** -- delegates payment method updates, invoice history, and plan cancellation to Stripe's hosted UI, avoiding the complexity and PCI scope of building these flows.
