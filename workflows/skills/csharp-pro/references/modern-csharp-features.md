# Modern C# Features

## Records and Immutability

```csharp
// Record class — reference type with value semantics
public record OrderDto(int Id, string CustomerName, decimal Total);

// Mutation via with-expression (creates a copy)
var updated = original with { Total = 99.99m };

// record struct — value type, no heap allocation
public readonly record struct Coordinate(double Lat, double Lng);

// Record with validation
public record Email
{
    public string Value { get; }

    public Email(string value)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value);
        if (!value.Contains('@'))
            throw new ArgumentException("Invalid email format", nameof(value));
        Value = value.ToLowerInvariant();
    }
}
```

## Primary Constructors (C# 12)

```csharp
// Classes and structs can have primary constructor parameters
public class OrderService(
    IOrderRepository repository,
    ILogger<OrderService> logger)
{
    public async Task<Order> GetAsync(int id, CancellationToken ct)
    {
        logger.LogInformation("Fetching order {Id}", id);
        return await repository.FindAsync(id, ct)
            ?? throw new OrderNotFoundException(id);
    }
}

// Caution: primary constructor params are captured fields, not properties
// They are mutable and accessible from any method — don't reassign them
```

## Pattern Matching

```csharp
// Switch expressions with patterns
public decimal CalculateDiscount(Customer customer) => customer switch
{
    { Tier: "gold", Years: > 5 } => 0.20m,
    { Tier: "gold" }             => 0.15m,
    { Tier: "silver" }           => 0.10m,
    { Orders.Count: > 100 }     => 0.05m,
    _                            => 0m,
};

// List patterns (C# 11)
public string DescribeRoute(string[] segments) => segments switch
{
    ["api", "v1", var resource] => $"API v1 resource: {resource}",
    ["api", "v2", ..]          => "API v2 route",
    [var single]               => $"Root route: {single}",
    []                         => "Empty route",
    _                          => "Complex route",
};

// Type patterns with when guards
public string Classify(object obj) => obj switch
{
    int n when n < 0  => "negative",
    int n when n == 0 => "zero",
    int n             => "positive",
    string { Length: 0 } => "empty string",
    string s          => $"string: {s}",
    null              => "null",
    _                 => obj.GetType().Name,
};
```

## Collection Expressions (C# 12)

```csharp
// Unified collection initialization syntax
int[] numbers = [1, 2, 3, 4, 5];
List<string> names = ["Alice", "Bob"];
ImmutableArray<int> immutable = [10, 20, 30];

// Spread operator
int[] first = [1, 2, 3];
int[] second = [4, 5, 6];
int[] combined = [..first, ..second]; // [1, 2, 3, 4, 5, 6]

// Works with spans
ReadOnlySpan<byte> header = [0x48, 0x54, 0x54, 0x50];
```

## Raw String Literals and String Interpolation

```csharp
// Raw string literals — no escaping needed
var json = """
    {
        "name": "Alice",
        "age": 30,
        "tags": ["admin", "user"]
    }
    """;

// Raw interpolated strings — $$ means {{ }} for interpolation holes
var query = $$"""
    SELECT * FROM users
    WHERE name = '{{name}}'
    AND created > '{{date:yyyy-MM-dd}}'
    """;
```

## Required and Init Properties

```csharp
// required — must be set at construction
public class CreateOrderRequest
{
    public required string CustomerName { get; init; }
    public required List<LineItem> Items { get; init; }
    public string? Notes { get; init; } // optional
}

// Compiler error if required properties are missing
var request = new CreateOrderRequest
{
    CustomerName = "Alice",
    Items = [new LineItem("Widget", 2)],
    // Notes is optional — no error
};
```

## Generic Math and Static Abstract Members

```csharp
// Static abstract interface members (C# 11)
public interface ISummable<T> where T : ISummable<T>
{
    static abstract T Zero { get; }
    static abstract T operator +(T left, T right);
}

// Generic math with INumber<T>
public static T Sum<T>(ReadOnlySpan<T> values) where T : INumber<T>
{
    T result = T.Zero;
    foreach (var value in values)
        result += value;
    return result;
}

// Works with int, double, decimal, etc.
var ints = new[] { 1, 2, 3, 4, 5 };
var sum = Sum<int>(ints); // 15
```

## File-Scoped Types

```csharp
// file keyword — type visible only within the file (C# 11)
file class InternalHelper
{
    public static string Process(string input) => input.Trim().ToLower();
}

// Useful for source generators and test helpers
```
