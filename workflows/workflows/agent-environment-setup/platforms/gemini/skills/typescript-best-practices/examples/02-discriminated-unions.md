# Example: Type-Safe State Machine with Discriminated Unions

## Scenario

Design a payment processing state machine where each state carries different data and only specific transitions are valid. Invalid transitions must be compile-time errors.

## Implementation

```typescript
// --- State definitions ---

interface PendingPayment {
  readonly status: "pending";
  readonly amount: number;
  readonly currency: string;
  readonly createdAt: Date;
}

interface AuthorizedPayment {
  readonly status: "authorized";
  readonly amount: number;
  readonly currency: string;
  readonly createdAt: Date;
  readonly authorizationCode: string;
  readonly authorizedAt: Date;
}

interface CapturedPayment {
  readonly status: "captured";
  readonly amount: number;
  readonly currency: string;
  readonly createdAt: Date;
  readonly authorizationCode: string;
  readonly captureId: string;
  readonly capturedAt: Date;
}

interface RefundedPayment {
  readonly status: "refunded";
  readonly amount: number;
  readonly currency: string;
  readonly createdAt: Date;
  readonly captureId: string;
  readonly refundId: string;
  readonly refundedAt: Date;
}

interface FailedPayment {
  readonly status: "failed";
  readonly amount: number;
  readonly currency: string;
  readonly createdAt: Date;
  readonly failureReason: string;
  readonly failedAt: Date;
}

// Discriminated union of all states
type Payment =
  | PendingPayment
  | AuthorizedPayment
  | CapturedPayment
  | RefundedPayment
  | FailedPayment;

// --- Transition event types ---

interface AuthorizeEvent {
  readonly type: "authorize";
  readonly authorizationCode: string;
}

interface CaptureEvent {
  readonly type: "capture";
  readonly captureId: string;
}

interface RefundEvent {
  readonly type: "refund";
  readonly refundId: string;
}

interface FailEvent {
  readonly type: "fail";
  readonly reason: string;
}

// Map of which events are valid from which states
type TransitionMap = {
  pending: AuthorizeEvent | FailEvent;
  authorized: CaptureEvent | FailEvent;
  captured: RefundEvent;
  refunded: never; // terminal state
  failed: never; // terminal state
};

// --- Type-safe transition function ---

function transition<S extends Payment["status"]>(
  payment: Extract<Payment, { status: S }>,
  event: TransitionMap[S]
): Payment {
  switch (payment.status) {
    case "pending": {
      const e = event as AuthorizeEvent | FailEvent;
      if (e.type === "authorize") {
        return {
          status: "authorized",
          amount: payment.amount,
          currency: payment.currency,
          createdAt: payment.createdAt,
          authorizationCode: e.authorizationCode,
          authorizedAt: new Date(),
        };
      }
      return {
        status: "failed",
        amount: payment.amount,
        currency: payment.currency,
        createdAt: payment.createdAt,
        failureReason: e.reason,
        failedAt: new Date(),
      };
    }

    case "authorized": {
      const e = event as CaptureEvent | FailEvent;
      if (e.type === "capture") {
        return {
          status: "captured",
          amount: payment.amount,
          currency: payment.currency,
          createdAt: payment.createdAt,
          authorizationCode: payment.authorizationCode,
          captureId: e.captureId,
          capturedAt: new Date(),
        };
      }
      return {
        status: "failed",
        amount: payment.amount,
        currency: payment.currency,
        createdAt: payment.createdAt,
        failureReason: e.reason,
        failedAt: new Date(),
      };
    }

    case "captured": {
      const e = event as RefundEvent;
      return {
        status: "refunded",
        amount: payment.amount,
        currency: payment.currency,
        createdAt: payment.createdAt,
        captureId: payment.captureId,
        refundId: e.refundId,
        refundedAt: new Date(),
      };
    }

    case "refunded":
    case "failed":
      // Terminal states — TransitionMap maps these to `never`,
      // so this code is unreachable if types are correct
      throw new Error(`Cannot transition from terminal state: ${payment.status}`);

    default: {
      // Exhaustiveness check — compiler errors if a new status is added
      const _exhaustive: never = payment;
      throw new Error(`Unknown payment status: ${(_exhaustive as Payment).status}`);
    }
  }
}

// --- Usage: compile-time safety demonstration ---

const pending: PendingPayment = {
  status: "pending",
  amount: 100,
  currency: "USD",
  createdAt: new Date(),
};

// Valid: pending -> authorized
const authorized = transition(pending, {
  type: "authorize",
  authorizationCode: "AUTH-123",
});

// COMPILE ERROR: Cannot transition from a refunded payment (TransitionMap["refunded"] is never)
// const invalid = transition(refundedPayment, { type: "authorize", authorizationCode: "X" });

// --- Display helper with exhaustiveness ---

function getStatusLabel(payment: Payment): string {
  switch (payment.status) {
    case "pending":
      return "Awaiting authorization";
    case "authorized":
      return `Authorized (${payment.authorizationCode})`;
    case "captured":
      return `Captured (${payment.captureId})`;
    case "refunded":
      return `Refunded (${payment.refundId})`;
    case "failed":
      return `Failed: ${payment.failureReason}`;
    default: {
      const _exhaustive: never = payment;
      return `Unknown: ${(_exhaustive as Payment).status}`;
    }
  }
}
```

## Key Patterns

1. **Literal discriminant** — `status` field with string literal types enables TypeScript narrowing in `switch`.
2. **State-specific fields** — each state carries only the data relevant to it (e.g., `captureId` only on `CapturedPayment`).
3. **`TransitionMap` type** — maps each state to its valid events; terminal states map to `never`.
4. **`Extract<Payment, { status: S }>`** — narrows the payment type based on the generic status parameter.
5. **`never` exhaustiveness** — the `default` case assigns to `never`, so adding a new state without handling it is a compile error.
