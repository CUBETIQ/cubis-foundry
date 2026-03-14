# API Design Reference

## REST API Contracts

### Resource Naming

```
GET    /api/v1/orders              # List orders
POST   /api/v1/orders              # Create order
GET    /api/v1/orders/{id}         # Get single order
PUT    /api/v1/orders/{id}         # Replace order
PATCH  /api/v1/orders/{id}         # Update order fields
DELETE /api/v1/orders/{id}         # Delete order

GET    /api/v1/orders/{id}/items   # Nested resource
POST   /api/v1/orders/{id}/cancel  # Action (verb, exceptional)

# Use kebab-case for multi-word resources
GET    /api/v1/order-items
GET    /api/v1/shipping-addresses
```

### Standard Response Envelope

```java
// Consistent response wrapper for all API endpoints
public record ApiResponse<T>(
    T data,
    ApiMeta meta
) {
    public record ApiMeta(
        String requestId,
        Instant timestamp,
        ApiPagination pagination
    ) {}

    public record ApiPagination(
        int page,
        int pageSize,
        long totalItems,
        int totalPages
    ) {}

    // Factory methods
    public static <T> ApiResponse<T> of(T data, String requestId) {
        return new ApiResponse<>(data, new ApiMeta(requestId, Instant.now(), null));
    }

    public static <T> ApiResponse<List<T>> paginated(
        List<T> data, String requestId, int page, int pageSize, long total
    ) {
        var pagination = new ApiPagination(page, pageSize, total, (int) Math.ceil((double) total / pageSize));
        return new ApiResponse<>(data, new ApiMeta(requestId, Instant.now(), pagination));
    }
}
```

### Error Response

```java
public record ApiError(
    String code,
    String message,
    List<FieldError> fieldErrors,
    String requestId,
    Instant timestamp
) {
    public record FieldError(String field, String message, Object rejectedValue) {}

    public static ApiError of(String code, String message, String requestId) {
        return new ApiError(code, message, List.of(), requestId, Instant.now());
    }

    public static ApiError withFields(String code, String message, String requestId, List<FieldError> fields) {
        return new ApiError(code, message, fields, requestId, Instant.now());
    }
}
```

## DTO Mapping

### Separation Between Domain and Transport

```java
// Domain model -- rich, with behavior
public sealed interface Order {
    record Pending(OrderId id, UserId userId, List<LineItem> items, Instant createdAt) implements Order {}
    record Confirmed(OrderId id, UserId userId, List<LineItem> items, Instant confirmedAt, Money total) implements Order {}
}

// API DTO -- flat, serialization-friendly
public record OrderResponse(
    String id,
    String userId,
    String status,
    List<LineItemResponse> items,
    String total,
    Instant createdAt,
    Instant confirmedAt
) {}

// Mapper -- explicit conversion at the boundary
public final class OrderMapper {

    public static OrderResponse toResponse(Order order) {
        return switch (order) {
            case Order.Pending p -> new OrderResponse(
                p.id().value(), p.userId().value(), "PENDING",
                p.items().stream().map(LineItemMapper::toResponse).toList(),
                null, p.createdAt(), null
            );
            case Order.Confirmed c -> new OrderResponse(
                c.id().value(), c.userId().value(), "CONFIRMED",
                c.items().stream().map(LineItemMapper::toResponse).toList(),
                c.total().format(), null, c.confirmedAt()
            );
        };
    }
}
```

### Why Separate DTOs?

1. **Domain types evolve independently** from API contracts. Renaming a domain field does not break API consumers.
2. **Sealed types cannot be directly serialized** without configuration. DTOs are simple records that serialize cleanly.
3. **Different views for different consumers**. An admin API might expose more fields than a public API. Each gets its own DTO.
4. **Validation at boundaries**. Request DTOs carry `@Valid` annotations; domain types enforce invariants via compact constructors.

## Jackson Configuration for Sealed Types

### Polymorphic Serialization

```java
@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "type"
)
@JsonSubTypes({
    @JsonSubTypes.Type(value = Event.OrderCreated.class, name = "ORDER_CREATED"),
    @JsonSubTypes.Type(value = Event.OrderShipped.class, name = "ORDER_SHIPPED"),
    @JsonSubTypes.Type(value = Event.OrderDelivered.class, name = "ORDER_DELIVERED"),
})
public sealed interface Event {
    record OrderCreated(String orderId, Instant at) implements Event {}
    record OrderShipped(String orderId, String trackingNumber, Instant at) implements Event {}
    record OrderDelivered(String orderId, Instant deliveredAt) implements Event {}
}

// Serialized JSON:
// {"type":"ORDER_CREATED","orderId":"ord-1","at":"2024-01-15T10:30:00Z"}
```

### ObjectMapper Configuration

```java
@Bean
public ObjectMapper objectMapper() {
    return JsonMapper.builder()
        .addModule(new JavaTimeModule())
        .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
        .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
        .enable(DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES)
        .serializationInclusion(JsonInclude.Include.NON_NULL)
        .build();
}
```

## Request Validation

### Spring Boot Validation

```java
public record CreateOrderRequest(
    @NotBlank String userId,
    @NotEmpty @Size(max = 100) List<@Valid LineItemRequest> items,
    @NotNull @Future Instant deliveryDate
) {}

public record LineItemRequest(
    @NotBlank String productId,
    @Min(1) @Max(9999) int quantity
) {}

// Controller
@PostMapping("/orders")
public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
    @Valid @RequestBody CreateOrderRequest request,
    @RequestHeader("X-Request-Id") String requestId
) {
    var order = orderService.create(OrderMapper.toDomain(request));
    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(ApiResponse.of(OrderMapper.toResponse(order), requestId));
}

// Exception handler for validation errors
@ExceptionHandler(MethodArgumentNotValidException.class)
public ResponseEntity<ApiError> handleValidation(
    MethodArgumentNotValidException ex,
    HttpServletRequest request
) {
    var fields = ex.getFieldErrors().stream()
        .map(e -> new ApiError.FieldError(e.getField(), e.getDefaultMessage(), e.getRejectedValue()))
        .toList();

    return ResponseEntity
        .badRequest()
        .body(ApiError.withFields("VALIDATION_ERROR", "Invalid request", getRequestId(request), fields));
}
```

## API Versioning

### URL Path Versioning (Recommended for REST)

```java
@RestController
@RequestMapping("/api/v1/orders")
public class OrderControllerV1 {
    @GetMapping("/{id}")
    public ApiResponse<OrderResponseV1> getOrder(@PathVariable String id) { ... }
}

@RestController
@RequestMapping("/api/v2/orders")
public class OrderControllerV2 {
    @GetMapping("/{id}")
    public ApiResponse<OrderResponseV2> getOrder(@PathVariable String id) { ... }
}
```

### Header Versioning (For Internal APIs)

```java
@GetMapping(value = "/orders/{id}", headers = "X-API-Version=2")
public ApiResponse<OrderResponseV2> getOrderV2(@PathVariable String id) { ... }
```

## Pagination Patterns

### Cursor-Based (Recommended for Real-Time Data)

```java
public record PageRequest(String cursor, int limit) {
    public PageRequest {
        if (limit < 1 || limit > 100) {
            throw new IllegalArgumentException("Limit must be between 1 and 100");
        }
    }
}

public record PageResponse<T>(
    List<T> items,
    String nextCursor,  // null when no more pages
    boolean hasMore
) {}

// Usage
// GET /api/v1/orders?cursor=eyJpZCI6MTAwfQ&limit=20
```

### Offset-Based (Simpler, for Admin UIs)

```java
// GET /api/v1/orders?page=2&size=20
public record OffsetPageRequest(
    @Min(0) int page,
    @Min(1) @Max(100) int size
) {
    public int offset() { return page * size; }
}
```

## Idempotency

```java
// Use Idempotency-Key header for non-idempotent operations
@PostMapping("/payments")
public ResponseEntity<ApiResponse<PaymentResponse>> createPayment(
    @Valid @RequestBody CreatePaymentRequest request,
    @RequestHeader("Idempotency-Key") String idempotencyKey
) {
    // Check if this key was already processed
    var existing = idempotencyStore.find(idempotencyKey);
    if (existing.isPresent()) {
        return ResponseEntity.ok(existing.get());
    }

    var payment = paymentService.process(request);
    var response = ApiResponse.of(PaymentMapper.toResponse(payment), idempotencyKey);

    idempotencyStore.save(idempotencyKey, response, Duration.ofHours(24));
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
}
```
