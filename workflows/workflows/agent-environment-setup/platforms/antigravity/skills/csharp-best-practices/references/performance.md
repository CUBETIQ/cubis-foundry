# Performance Reference

## Span<T> and Memory<T>

### Zero-copy slicing

`Span<T>` is a stack-only ref struct that provides a view into contiguous memory without copying.

```csharp
// Parse a CSV line without allocating substrings
public static void ParseCsvLine(ReadOnlySpan<char> line, Span<Range> fields)
{
    int fieldIndex = 0;
    int start = 0;

    for (int i = 0; i < line.Length; i++)
    {
        if (line[i] == ',')
        {
            fields[fieldIndex++] = start..i;
            start = i + 1;
        }
    }
    fields[fieldIndex] = start..line.Length;
}

// Usage — no string allocations
var line = "Alice,42,Engineering".AsSpan();
Span<Range> fields = stackalloc Range[10];
ParseCsvLine(line, fields);
var name = line[fields[0]]; // ReadOnlySpan<char> "Alice" — no allocation
```

### When to use Span vs. Memory

| Type | Stack-only | Async | Use when |
| --- | --- | --- | --- |
| `Span<T>` | Yes | No | Synchronous hot paths, parsing, formatting |
| `ReadOnlySpan<T>` | Yes | No | Read-only view of data |
| `Memory<T>` | No | Yes | Async methods needing a slice |
| `ReadOnlyMemory<T>` | No | Yes | Async methods, read-only slice |

```csharp
// Span cannot be used in async methods
public async Task ProcessAsync(ReadOnlyMemory<byte> buffer, CancellationToken ct)
{
    // Convert to Span only for synchronous sections
    var header = buffer.Span[..4]; // OK — synchronous access
    await WriteAsync(buffer, ct);  // Memory works with async
}
```

## ArrayPool<T>

Rent arrays from a shared pool to avoid repeated allocations in loops.

```csharp
public byte[] CompressData(ReadOnlySpan<byte> input)
{
    var buffer = ArrayPool<byte>.Shared.Rent(input.Length);
    try
    {
        int written = Compress(input, buffer);
        return buffer[..written].ToArray(); // Copy only the used portion
    }
    finally
    {
        ArrayPool<byte>.Shared.Return(buffer, clearArray: true);
    }
}
```

### Pooled StringBuilder pattern

```csharp
// For building strings in hot paths
using var lease = MemoryPool<char>.Shared.Rent(1024);
var builder = new SpanWriter(lease.Memory.Span);
builder.Write("Hello, ");
builder.Write(name);
return builder.ToString();
```

## FrozenDictionary and FrozenSet (.NET 8+)

Optimized for read-heavy lookup tables created once and read many times.

```csharp
// Build once at startup
private static readonly FrozenDictionary<string, CountryInfo> Countries =
    LoadCountries().ToFrozenDictionary(c => c.Code);

private static readonly FrozenSet<string> BlockedIps =
    LoadBlockedIps().ToFrozenSet();

// Lookups are faster than Dictionary due to optimized hash computation
public CountryInfo? GetCountry(string code) => Countries.GetValueOrDefault(code);
public bool IsBlocked(string ip) => BlockedIps.Contains(ip);
```

### Performance comparison

| Collection | Insert | Lookup | Memory | Use when |
| --- | --- | --- | --- | --- |
| `Dictionary<K,V>` | O(1) amortized | O(1) | Moderate | Read-write throughout lifetime |
| `FrozenDictionary<K,V>` | N/A (immutable) | O(1) faster | Optimized | Build once, read many |
| `ImmutableDictionary<K,V>` | O(log n) | O(log n) | Higher | Functional style, snapshots |

## SearchValues<T> (.NET 8+)

Vectorized search for sets of characters or bytes.

```csharp
private static readonly SearchValues<char> SpecialChars =
    SearchValues.Create("!@#$%^&*()");

public static bool ContainsSpecialCharacter(ReadOnlySpan<char> input)
{
    return input.ContainsAny(SpecialChars); // SIMD-accelerated
}

// Much faster than: input.IndexOfAny("!@#$%^&*()".ToCharArray())
```

## BenchmarkDotNet

### Setup

```csharp
[MemoryDiagnoser]        // Track allocations
[SimpleJob(RuntimeMoniker.Net90)]
public class SerializationBenchmark
{
    private readonly Order _order = TestData.CreateLargeOrder();
    private readonly byte[] _serialized;

    public SerializationBenchmark()
    {
        _serialized = JsonSerializer.SerializeToUtf8Bytes(_order);
    }

    [Benchmark(Baseline = true)]
    public byte[] SystemTextJson()
    {
        return JsonSerializer.SerializeToUtf8Bytes(_order);
    }

    [Benchmark]
    public byte[] SystemTextJsonSourceGen()
    {
        return JsonSerializer.SerializeToUtf8Bytes(_order, OrderContext.Default.Order);
    }

    [Benchmark]
    public byte[] MessagePack()
    {
        return MessagePackSerializer.Serialize(_order);
    }
}
```

### Running benchmarks

```bash
dotnet run -c Release -- --filter "*Serialization*"
```

### Reading results

Focus on:
- **Mean** — average execution time per operation
- **Allocated** — bytes allocated per operation (from MemoryDiagnoser)
- **Gen0/Gen1/Gen2** — GC collections triggered per 1000 operations

## Allocation Profiling

### dotnet-trace

```bash
# Collect allocation trace
dotnet-trace collect --process-id <PID> --providers Microsoft-DotNETCore-SampleProfiler

# Convert to speedscope format for visualization
dotnet-trace convert trace.nettrace --format speedscope
```

### dotnet-counters for live monitoring

```bash
dotnet-counters monitor --process-id <PID> \
    --counters System.Runtime,Microsoft.AspNetCore.Hosting

# Key metrics:
# - gc-heap-size: total managed heap
# - alloc-rate: bytes/sec allocated
# - threadpool-queue-length: >0 means thread starvation
# - threadpool-thread-count: growing = contention
```

## String Performance

### String interpolation handlers (C# 10+)

```csharp
// Logger message templates — zero allocation when log level is disabled
logger.LogInformation("Order {OrderId} created with {LineCount} items",
    order.Id, order.Lines.Count);

// NOT this — allocates even when logging is disabled:
logger.LogInformation($"Order {order.Id} created with {order.Lines.Count} items");
```

### StringBuilder for loops

```csharp
// BAD — O(n^2) allocations
string result = "";
foreach (var item in items)
    result += item.Name + ", ";

// GOOD — O(n) single allocation
var sb = new StringBuilder(items.Count * 20); // estimate capacity
foreach (var item in items)
    sb.Append(item.Name).Append(", ");
return sb.ToString();
```

### String.Create for known-length strings

```csharp
// Zero intermediate allocations
public static string FormatHex(ReadOnlySpan<byte> bytes)
{
    return string.Create(bytes.Length * 2, bytes.ToArray(), (span, data) =>
    {
        for (int i = 0; i < data.Length; i++)
            data[i].TryFormat(span[(i * 2)..], out _, "X2");
    });
}
```

## Source-Generated JSON Serialization

```csharp
[JsonSerializable(typeof(Order))]
[JsonSerializable(typeof(List<Order>))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
internal partial class AppJsonContext : JsonSerializerContext { }

// Registration in minimal API
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.TypeInfoResolverChain.Insert(0, AppJsonContext.Default);
});

// Eliminates reflection-based serialization — faster startup and AOT compatible
```

## Checklist: Before Optimizing

1. Profile first with BenchmarkDotNet (micro) or dotnet-trace (macro).
2. Identify the top 3 allocation sources from the profiler.
3. Check if the hot path is synchronous (Span-eligible) or async (Memory-eligible).
4. Measure after each change — some "optimizations" are neutral or negative.
5. Document why the optimization exists with a comment linking to the benchmark.
