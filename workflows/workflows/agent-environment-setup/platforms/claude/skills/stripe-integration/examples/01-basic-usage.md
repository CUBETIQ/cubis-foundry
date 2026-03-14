# Example: Basic Stripe Checkout for a SaaS Product

## Scenario

A team is building a SaaS application that sells two subscription plans (Starter at $29/mo and Pro at $99/mo). They need a server-side Stripe Checkout integration that creates checkout sessions, redirects users to Stripe's hosted payment page, and handles the `checkout.session.completed` webhook to activate the subscription in the application database.

## Prompt

"Set up Stripe Checkout for our SaaS app. We have two plans: Starter ($29/mo) and Pro ($99/mo). Create the checkout session server-side with Next.js API routes, handle the success redirect, and process the checkout.session.completed webhook to activate the user's subscription."

## Expected Output

### Stripe Product Setup

```typescript
// lib/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export const PLANS = {
  starter: {
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
    name: 'Starter',
  },
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    name: 'Pro',
  },
} as const;

export type PlanKey = keyof typeof PLANS;
```

### Checkout Session Creation

```typescript
// app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe, PLANS, PlanKey } from '@/lib/stripe';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { plan } = (await req.json()) as { plan: PlanKey };
  if (!PLANS[plan]) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  // Ensure user has a Stripe customer ID
  let customerId = session.user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;
    await db.user.update({
      where: { id: session.user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create(
    {
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing?checkout=cancelled`,
      subscription_data: {
        metadata: { userId: session.user.id, plan },
      },
    },
    {
      idempotencyKey: `checkout:${session.user.id}:${plan}:${Date.now()}`,
    }
  );

  return NextResponse.json({ url: checkoutSession.url });
}
```

### Webhook Handler

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Idempotency: skip already-processed events
  const existing = await db.stripeEvent.findUnique({
    where: { eventId: event.id },
  });
  if (existing) {
    return NextResponse.json({ received: true });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.subscription_data?.metadata?.userId
      ?? session.metadata?.userId;

    if (userId && session.subscription) {
      await db.subscription.upsert({
        where: { userId },
        create: {
          userId,
          stripeSubscriptionId: session.subscription as string,
          status: 'active',
          plan: session.metadata?.plan ?? 'starter',
        },
        update: {
          stripeSubscriptionId: session.subscription as string,
          status: 'active',
          plan: session.metadata?.plan ?? 'starter',
        },
      });
    }
  }

  // Record event as processed
  await db.stripeEvent.create({
    data: { eventId: event.id, type: event.type },
  });

  return NextResponse.json({ received: true });
}
```

### Client-Side Checkout Button

```typescript
// components/checkout-button.tsx
'use client';

import { useState } from 'react';
import { PlanKey } from '@/lib/stripe';

export function CheckoutButton({ plan }: { plan: PlanKey }) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleCheckout} disabled={loading}>
      {loading ? 'Redirecting...' : 'Subscribe'}
    </button>
  );
}
```

### Testing with Stripe CLI

```bash
# Forward webhooks to local dev server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger a checkout session completed event
stripe trigger checkout.session.completed

# Use test card numbers in Stripe Checkout:
# Success:        4242 4242 4242 4242
# Requires auth:  4000 0025 0000 3155
# Declined:       4000 0000 0000 0002
```

## Key Decisions

- **Stripe-hosted Checkout over embedded Payment Element** -- reduces PCI compliance burden to SAQ-A and eliminates custom payment form UI bugs.
- **Customer ID stored at first checkout** -- avoids orphaned Stripe customers by creating and persisting the customer before the checkout session.
- **Idempotency key on session creation** -- prevents duplicate checkout sessions if the user double-clicks the subscribe button.
- **Webhook event deduplication** -- stores processed event IDs to handle Stripe's at-least-once delivery guarantee without duplicate subscription activations.
- **Server-side plan validation** -- the plan and price ID are resolved server-side, so clients cannot manipulate pricing.
