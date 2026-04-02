# Modern C# Features Reference

## Records

### Record classes (reference types)

```csharp
// Positional record — generates constructor, Deconstruct, Equals, GetHashCode, ToString
public record OrderResponse(
    string Id,
    string CustomerId,
    IReadOnlyList<OrderLineResponse> Lines,
    decimal Total,
    DateTimeOffset CreatedAt);

// Record with body — mix positional and explicit properties
public record Customer(string Id, string Name)
{
    public required string Email { get; init; }
    public string? Phone { get; init; }
}

// Non-destructive mutation with `with`
var updated = original with { Name = "New Name", Phone = "555-1234" };
```

### Record structs (value types)

```csharp
// Stack-allocated, value equality, no heap overhead for small types
public readonly record struct Money(decimal Amount, string Currency)
{
    public Money Add(Money other)
    {
        if (Currency != other.Currency)
            throw new InvalidOperationException($"Cannot add {Currency} to {other.Currency}");
        return this with { Amount = Amount + other.Amount };
    }

    public string Formatted => $"{Amount:F2} {Currency}";
}
```

### When to use records

| Type | Use when |
| --- | --- |
| `record class` | DTOs, API responses, domain events, anything needing value equality with reference semantics |
| `record struct` | Small value types (< 16 bytes), money, coordinates, identifiers |
| `class` | Mutable state holders, services, controllers |
| `struct` | High-perf value types without equality needs |

## Pattern Matching

### Switch expressions with exhaustive matching

```csharp
public string FormatStatus(OrderStatus status) => status switch
{
    OrderStatus.Pending => "Awaiting confirmation",
    OrderStatus.Confirmed => "Order confirmed",
    OrderStatus.Shipped => "In transit",
    OrderStatus.Delivered => "Delivered",
    OrderStatus.Cancelled => "Cancelled",
    _ => throw new UnreachableException()
};
```

### Property patterns

```csharp
decimal CalculateDiscount(Order order) => order switch
{
    { Total: > 1000, Customer.Tier: CustomerTier.Premium } => order.Total * 0.15m,
    { Total: > 500, Customer.Tier: CustomerTier.Premium } => order.Total * 0.10m,
    { Total: > 1000 } => order.Total * 0.05m,
    _ => 0m
};
```

### Relational and logical patterns

```csharp
string Classify(int score) => score switch
{
    >= 90 and <= 100 => "A",
    >= 80 and < 90 => "B",
    >= 70 and < 80 => "C",
    >= 60 and < 70 => "D",
    >= 0 and < 60 => "F",
    _ => throw new ArgumentOutOfRangeException(nameof(score))
};
```

### List patterns (C# 11+)

```csharp
string DescribeSequence(int[] numbers) => numbers switch
{
    [] => "empty",
    [var single] => $"single: {single}",
    [var first, .., var last] => $"from {first} to {last}",
};
```

## Primary Constructors (C# 12)

```csharp
// For services — parameters become captured variables (not properties)
public sealed class OrderService(
    IOrderRepository repository,
    ILogger<OrderService> logger,
    TimeProvider timeProvider)
{
    public async Task<Order> CreateAsync(CreateOrderRequest request, CancellationToken ct)
    {
        logger.LogInformation("Creating order for {CustomerId}", request.CustomerId);
        var order = new Order { CreatedAt = timeProvider.GetUtcNow() };
        await repository.SaveAsync(order, ct);
        return order;
    }
}
```

Primary constructor parameters are **not** automatically properties. They are captured fields. If you need a public property, declare it explicitly.

## Collection Expressions (C# 13)

```csharp
// Unified syntax for all collection types
List<int> list = [1, 2, 3];
int[] array = [4, 5, 6];
Span<int> span = [7, 8, 9];
ImmutableArray<int> immutable = [10, 11, 12];

// Spread operator
int[] combined = [..list, ..array, 99];

// Empty collection
List<string> empty = [];
```

## params Span (C# 13)

```csharp
// No array allocation for variadic methods
public static T Min<T>(params ReadOnlySpan<T> values) where T : IComparable<T>
{
    if (values.IsEmpty) throw new ArgumentException("At least one value required");

    var min = values[0];
    for (int i = 1; i < values.Length; i++)
    {
        if (values[i].CompareTo(min) < 0) min = values[i];
    }
    return min;
}

// Caller: no allocation
var smallest = Min(3, 1, 4, 1, 5);
```

## Source Generators

### Incremental generator skeleton

```csharp
[Generator]
public class DtoMapperGenerator : IIncrementalGenerator
{
    public void Initialize(IncrementalGeneratorInitializationContext context)
    {
        // 1. Filter syntax nodes
        var records = context.SyntaxProvider.ForAttributeWithMetadataName(
            "MyApp.AutoMapAttribute",
            predicate: (node, _) => node is RecordDeclarationSyntax,
            transform: (ctx, _) => GetMapInfo(ctx));

        // 2. Emit source
        context.RegisterSourceOutput(records, (spc, info) =>
        {
            var source = GenerateMapper(info);
            spc.AddSource($"{info.TypeName}.Mapper.g.cs", source);
        });
    }
}
```

### Testing source generators

```csharp
[Fact]
public async Task Generator_EmitsMapperForAutoMapRecord()
{
    var source = """
        using MyApp;

        [AutoMap]
        public record UserDto(string Name, string Email);
        """;

    var result = await new CSharpSourceGeneratorTest<DtoMapperGenerator>
    {
        TestCode = source,
    }.RunAsync();

    Assert.Empty(result.Diagnostics);
    // Verify generated source matches snapshot
}
```

## Nullable Reference Types

### Project configuration

```xml
<PropertyGroup>
    <Nullable>enable</Nullable>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
</PropertyGroup>
```

### Flow analysis attributes

```csharp
public bool TryGetOrder(string id, [NotNullWhen(true)] out Order? order)
{
    order = _cache.Get(id);
    return order is not null;
}

// After the call, compiler knows order is non-null if TryGetOrder returned true
if (TryGetOrder("123", out var order))
{
    Console.WriteLine(order.Total); // no warning — order is proven non-null
}
```

### Null-forgiving operator rules

Use `!` only at verified boundaries:
```csharp
// OK — DI guarantees non-null at runtime
var service = serviceProvider.GetRequiredService<IOrderService>();

// OK — deserialization validated by middleware
var dto = JsonSerializer.Deserialize<OrderDto>(body)!;

// BAD — lazy suppression
string name = possiblyNull!; // hides real bug
```
