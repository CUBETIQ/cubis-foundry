# Example: Payment State Machine with Sealed Classes

## Scenario

A payment processing service needs to model payment states where each state carries different data. The model must support type-safe state transitions, exhaustive handling, and JSON serialization for API responses and event storage.

## Implementation

### PaymentState.java

```java
import com.fasterxml.jackson.annotation.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "status")
@JsonSubTypes({
    @JsonSubTypes.Type(value = PaymentState.Pending.class, name = "PENDING"),
    @JsonSubTypes.Type(value = PaymentState.Authorized.class, name = "AUTHORIZED"),
    @JsonSubTypes.Type(value = PaymentState.Captured.class, name = "CAPTURED"),
    @JsonSubTypes.Type(value = PaymentState.Refunded.class, name = "REFUNDED"),
    @JsonSubTypes.Type(value = PaymentState.Declined.class, name = "DECLINED"),
    @JsonSubTypes.Type(value = PaymentState.Cancelled.class, name = "CANCELLED"),
})
public sealed interface PaymentState {

    String paymentId();
    BigDecimal amount();

    record Pending(
        String paymentId,
        BigDecimal amount,
        Instant createdAt
    ) implements PaymentState {
        public Pending {
            Objects.requireNonNull(paymentId);
            Objects.requireNonNull(amount);
            Objects.requireNonNull(createdAt);
        }
    }

    record Authorized(
        String paymentId,
        BigDecimal amount,
        String authorizationCode,
        Instant authorizedAt
    ) implements PaymentState {
        public Authorized {
            Objects.requireNonNull(authorizationCode, "Authorization code required");
        }
    }

    record Captured(
        String paymentId,
        BigDecimal amount,
        String authorizationCode,
        Instant capturedAt
    ) implements PaymentState {}

    record Refunded(
        String paymentId,
        BigDecimal amount,
        BigDecimal refundAmount,
        String reason,
        Instant refundedAt
    ) implements PaymentState {
        public Refunded {
            if (refundAmount.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Refund amount must be positive");
            }
            if (refundAmount.compareTo(amount) > 0) {
                throw new IllegalArgumentException("Refund exceeds payment amount");
            }
        }
    }

    record Declined(
        String paymentId,
        BigDecimal amount,
        String declineCode,
        String declineReason
    ) implements PaymentState {}

    record Cancelled(
        String paymentId,
        BigDecimal amount,
        String cancelledBy,
        Instant cancelledAt
    ) implements PaymentState {}
}
```

### PaymentTransitions.java

```java
import java.math.BigDecimal;
import java.time.Instant;

public final class PaymentTransitions {

    // Exhaustive pattern matching over the sealed hierarchy.
    // Adding a new state variant causes a compile error here.
    public static String describeState(PaymentState state) {
        return switch (state) {
            case PaymentState.Pending p ->
                "Payment %s pending since %s".formatted(p.paymentId(), p.createdAt());
            case PaymentState.Authorized a ->
                "Payment %s authorized (code: %s)".formatted(a.paymentId(), a.authorizationCode());
            case PaymentState.Captured c ->
                "Payment %s captured at %s".formatted(c.paymentId(), c.capturedAt());
            case PaymentState.Refunded r ->
                "Payment %s refunded %s (%s)".formatted(r.paymentId(), r.refundAmount(), r.reason());
            case PaymentState.Declined d ->
                "Payment %s declined: %s (%s)".formatted(d.paymentId(), d.declineReason(), d.declineCode());
            case PaymentState.Cancelled c ->
                "Payment %s cancelled by %s".formatted(c.paymentId(), c.cancelledBy());
        };
    }

    // State transition with guarded patterns for validation
    public static PaymentState authorize(PaymentState state, String authCode) {
        return switch (state) {
            case PaymentState.Pending p ->
                new PaymentState.Authorized(p.paymentId(), p.amount(), authCode, Instant.now());

            case PaymentState.Authorized a ->
                throw new InvalidTransitionException("Payment already authorized");
            case PaymentState.Captured c ->
                throw new InvalidTransitionException("Cannot authorize a captured payment");
            case PaymentState.Refunded r ->
                throw new InvalidTransitionException("Cannot authorize a refunded payment");
            case PaymentState.Declined d ->
                throw new InvalidTransitionException("Cannot authorize a declined payment");
            case PaymentState.Cancelled c ->
                throw new InvalidTransitionException("Cannot authorize a cancelled payment");
        };
    }

    public static PaymentState capture(PaymentState state) {
        return switch (state) {
            case PaymentState.Authorized a ->
                new PaymentState.Captured(a.paymentId(), a.amount(), a.authorizationCode(), Instant.now());

            // Guarded pattern: allow re-capture only if within 24h window
            case PaymentState.Captured c when c.capturedAt().isAfter(Instant.now().minusSeconds(86400)) ->
                c; // Idempotent within 24h

            case PaymentState.Captured c ->
                throw new InvalidTransitionException("Capture window expired");

            default ->
                throw new InvalidTransitionException(
                    "Cannot capture payment in state: " + state.getClass().getSimpleName());
        };
    }

    public static PaymentState refund(PaymentState state, BigDecimal refundAmount, String reason) {
        return switch (state) {
            case PaymentState.Captured c ->
                new PaymentState.Refunded(
                    c.paymentId(), c.amount(), refundAmount, reason, Instant.now());

            case PaymentState.Refunded r when r.refundAmount().compareTo(r.amount()) < 0 ->
                // Allow additional partial refund
                new PaymentState.Refunded(
                    r.paymentId(), r.amount(),
                    r.refundAmount().add(refundAmount), reason, Instant.now());

            case PaymentState.Refunded r ->
                throw new InvalidTransitionException("Payment already fully refunded");

            default ->
                throw new InvalidTransitionException(
                    "Cannot refund payment in state: " + state.getClass().getSimpleName());
        };
    }
}
```

## Key Decisions

1. **Sealed interface** with common methods (`paymentId()`, `amount()`) provides a shared contract while records carry state-specific data.
2. **Compact constructors** in records enforce invariants (non-null checks, refund amount validation) at construction time.
3. **Pattern matching switch** is exhaustive over the sealed hierarchy -- the compiler flags missing cases.
4. **Guarded patterns** (`case Captured c when ...`) encode business rules (24h capture window, partial refund allowance) directly in the match.
5. **Jackson `@JsonTypeInfo`/`@JsonSubTypes`** enables polymorphic serialization using a `"status"` discriminator field, so `{"status":"AUTHORIZED","paymentId":"..."}` deserializes to the correct record type.
6. **`InvalidTransitionException`** (a custom unchecked exception) provides clear diagnostics for illegal state transitions.
