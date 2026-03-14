# Modern Java Reference (JDK 21+)

## Records

Records are transparent, immutable data carriers. They auto-generate `equals()`, `hashCode()`, `toString()`, and accessor methods.

### Basic Record

```java
// Simple data carrier -- replaces 40+ lines of boilerplate
public record UserDto(String id, String name, String email) {}

// Usage
var user = new UserDto("1", "Alice", "alice@example.com");
String name = user.name();  // Accessor (no 'get' prefix)
```

### Compact Constructor for Validation

```java
public record Money(BigDecimal amount, String currency) {
    // Compact constructor -- parameters are implicit
    public Money {
        Objects.requireNonNull(amount, "amount must not be null");
        Objects.requireNonNull(currency, "currency must not be null");
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Amount must not be negative");
        }
        currency = currency.toUpperCase(Locale.ROOT);
        // amount and currency are assigned automatically
    }
}
```

### Records with Custom Methods

```java
public record DateRange(LocalDate start, LocalDate end) {
    public DateRange {
        if (end.isBefore(start)) {
            throw new IllegalArgumentException("end must be after start");
        }
    }

    public long days() {
        return ChronoUnit.DAYS.between(start, end);
    }

    public boolean contains(LocalDate date) {
        return !date.isBefore(start) && !date.isAfter(end);
    }

    public boolean overlaps(DateRange other) {
        return !this.end.isBefore(other.start) && !other.end.isBefore(this.start);
    }
}
```

### When NOT to Use Records

- **Entities with identity**: JPA entities need mutable state and identity-based equality.
- **Inheritance**: Records are implicitly `final` and cannot extend other classes.
- **Large field counts**: Records with 10+ fields signal a design problem -- decompose into smaller records.

## Sealed Classes and Interfaces

Sealed types restrict which classes can implement or extend them, enabling exhaustive pattern matching.

### Sealed Interface with Record Subtypes

```java
public sealed interface Shape
    permits Circle, Rectangle, Triangle {
}

public record Circle(double radius) implements Shape {}
public record Rectangle(double width, double height) implements Shape {}
public record Triangle(double base, double height) implements Shape {}
```

### Pattern Matching with Switch Expressions (JDK 21)

```java
public static double area(Shape shape) {
    return switch (shape) {
        case Circle c -> Math.PI * c.radius() * c.radius();
        case Rectangle r -> r.width() * r.height();
        case Triangle t -> 0.5 * t.base() * t.height();
        // No default needed -- compiler knows all subtypes
    };
}
```

### Guarded Patterns

```java
public static String classify(Shape shape) {
    return switch (shape) {
        case Circle c when c.radius() > 100 -> "large circle";
        case Circle c -> "small circle";
        case Rectangle r when r.width() == r.height() -> "square";
        case Rectangle r -> "rectangle";
        case Triangle t -> "triangle";
    };
}
```

### Nested Sealed Hierarchies

```java
public sealed interface Result<T> {
    record Success<T>(T value) implements Result<T> {}
    record Failure<T>(String error, Throwable cause) implements Result<T> {}
}

// Usage
public static <T> T unwrap(Result<T> result) {
    return switch (result) {
        case Result.Success<T> s -> s.value();
        case Result.Failure<T> f -> throw new RuntimeException(f.error(), f.cause());
    };
}
```

## Text Blocks

```java
// Multi-line strings with automatic indentation stripping
String sql = """
        SELECT u.id, u.name, u.email
        FROM users u
        JOIN orders o ON o.user_id = u.id
        WHERE o.status = ?
        ORDER BY o.created_at DESC
        LIMIT ?
        """;

// The closing """ position controls indentation stripping.
// 8-space prefix is removed because """ is at column 8.

// String templates with formatted()
String json = """
        {
            "id": "%s",
            "name": "%s",
            "active": %b
        }
        """.formatted(user.id(), user.name(), user.isActive());
```

## Helpful New APIs

### Sequenced Collections (JDK 21)

```java
// SequencedCollection adds first/last access to all ordered collections
SequencedCollection<String> list = List.of("a", "b", "c");
String first = list.getFirst();  // "a"
String last = list.getLast();    // "c"
SequencedCollection<String> reversed = list.reversed();

// SequencedMap
SequencedMap<String, Integer> map = LinkedHashMap.of("a", 1, "b", 2);
Map.Entry<String, Integer> firstEntry = map.firstEntry();
map.putFirst("z", 0);
```

### Stream Gatherers (JDK 22 Preview -> JDK 24)

```java
// Custom intermediate stream operations
List<List<Integer>> windows = IntStream.range(0, 10)
    .boxed()
    .gather(Gatherers.windowSliding(3))
    .toList();
// [[0,1,2], [1,2,3], [2,3,4], ...]

// Fixed-size groups
List<List<String>> batches = items.stream()
    .gather(Gatherers.windowFixed(100))
    .toList();
```

### Scoped Values (JDK 21 Preview)

```java
// Thread-safe, immutable alternative to ThreadLocal for virtual threads
private static final ScopedValue<RequestContext> CONTEXT = ScopedValue.newInstance();

public void handleRequest(Request request) {
    ScopedValue.runWhere(CONTEXT, new RequestContext(request.traceId()), () -> {
        // All code in this scope (including virtual threads) sees the context
        processRequest(request);
    });
}

public void processRequest(Request request) {
    String traceId = CONTEXT.get().traceId();  // Available without passing it as a parameter
}
```

### Unnamed Patterns and Variables (JDK 22)

```java
// Use _ for unused variables
try {
    return Integer.parseInt(input);
} catch (NumberFormatException _) {
    return defaultValue;
}

// Unnamed pattern in switch
switch (shape) {
    case Circle _ -> "circle";
    case Rectangle _ -> "rectangle";
    case Triangle _ -> "triangle";
}

// Unnamed variable in enhanced for
for (var _ : collection) {
    count++;
}
```
