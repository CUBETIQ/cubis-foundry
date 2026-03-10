# Records and Sealed Types

## Record Design

Records are transparent, immutable data carriers. They auto-generate `equals`, `hashCode`, `toString`, accessors, and a canonical constructor.

```java
// Basic record — ideal for DTOs, API responses, events
public record UserResponse(long id, String name, String email, Instant createdAt) {}

// Compact canonical constructor for validation
public record EmailAddress(String value) {
    public EmailAddress {
        if (value == null || !value.contains("@")) {
            throw new IllegalArgumentException("Invalid email: " + value);
        }
        value = value.toLowerCase().strip(); // reassign for normalization
    }
}

// Record with custom method
public record Money(BigDecimal amount, Currency currency) {
    public Money add(Money other) {
        if (!this.currency.equals(other.currency)) {
            throw new IllegalArgumentException("Currency mismatch");
        }
        return new Money(this.amount.add(other.amount), this.currency);
    }
}

// Record implementing interface
public sealed interface ApiResult<T> permits Success, Failure {
    record Success<T>(T data) implements ApiResult<T> {}
    record Failure<T>(String error, int code) implements ApiResult<T> {}
}
```

## Record Anti-Patterns

```java
// DON'T override equals/hashCode unless domain semantics differ from structural equality
// Records already provide correct implementations

// DON'T use records for mutable state or entities with identity
// BAD — entities need identity-based equality, not structural
public record User(long id, String name) {} // equals compares all fields
// Two users with same name but different IDs would be "equal" — wrong

// DON'T use records with mutable fields
// BAD — list can be modified, breaking immutability contract
public record Config(List<String> hosts) {}
config.hosts().add("evil.com"); // mutates the record!

// GOOD — defensive copy in compact constructor
public record Config(List<String> hosts) {
    public Config {
        hosts = List.copyOf(hosts); // immutable copy
    }
}
```

## Sealed Classes and Interfaces

Sealed types restrict which classes can extend/implement them. Combined with pattern matching, they enable exhaustive handling.

```java
// Sealed interface — closed hierarchy
public sealed interface Shape permits Circle, Rectangle, Triangle {
    double area();
}

public record Circle(double radius) implements Shape {
    public double area() { return Math.PI * radius * radius; }
}

public record Rectangle(double width, double height) implements Shape {
    public double area() { return width * height; }
}

public record Triangle(double base, double height) implements Shape {
    public double area() { return 0.5 * base * height; }
}

// Exhaustive pattern matching — compiler error if a variant is missing
String describe(Shape shape) {
    return switch (shape) {
        case Circle c     -> "Circle with radius " + c.radius();
        case Rectangle r  -> "Rectangle " + r.width() + "x" + r.height();
        case Triangle t   -> "Triangle with base " + t.base();
        // No default needed — sealed type is exhaustive
    };
}
```

## Pattern Matching with Switch Expressions

```java
// Type pattern matching
Object process(Object input) {
    return switch (input) {
        case Integer i when i > 0  -> i * 2;
        case Integer i             -> 0;
        case String s              -> s.toUpperCase();
        case List<?> list          -> list.size();
        case null                  -> "null input";
        default                    -> "unknown: " + input;
    };
}

// Record pattern destructuring (Java 21+)
String formatResult(ApiResult<?> result) {
    return switch (result) {
        case ApiResult.Success(var data) -> "OK: " + data;
        case ApiResult.Failure(var error, var code) -> "Error %d: %s".formatted(code, error);
    };
}

// Nested record patterns
record Point(int x, int y) {}
record Line(Point start, Point end) {}

boolean isHorizontal(Line line) {
    return switch (line) {
        case Line(Point(_, var y1), Point(_, var y2)) when y1 == y2 -> true;
        default -> false;
    };
}
```

## Sealed Hierarchy vs Enum

| Use                           | Sealed hierarchy                         | Enum                                         |
| ----------------------------- | ---------------------------------------- | -------------------------------------------- |
| Variants carry different data | Yes — each record has its own fields     | No — enum constants share the same field set |
| Need instances                | Yes — multiple `Circle(5)`, `Circle(10)` | No — fixed set of singleton constants        |
| Pattern matching              | Yes — destructure record fields          | Yes — but only on constant identity          |
| Serialization                 | Custom per variant                       | Built-in `name()`/`valueOf()`                |

```java
// Enum — fixed set with no per-instance data
public enum Status { PENDING, ACTIVE, SUSPENDED, DELETED }

// Sealed hierarchy — variants with different shapes
public sealed interface PaymentMethod permits CreditCard, BankTransfer, Wallet {
    record CreditCard(String last4, YearMonth expiry) implements PaymentMethod {}
    record BankTransfer(String iban, String bic) implements PaymentMethod {}
    record Wallet(String walletId, BigDecimal balance) implements PaymentMethod {}
}
```
