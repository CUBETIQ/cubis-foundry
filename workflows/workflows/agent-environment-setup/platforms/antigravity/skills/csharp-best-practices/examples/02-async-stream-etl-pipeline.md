# Example: Async Stream ETL Pipeline

## Scenario

Build an ETL pipeline that reads change events from a database, enriches them with data from an external API, batches the results, and writes to an analytics sink. The entire pipeline uses IAsyncEnumerable for streaming, supports cancellation, and each stage is independently testable.

## Pipeline Architecture

```
DatabaseSource → Filter → Enrich → Batch → WriteSink
  (IAsyncEnumerable<ChangeEvent>)
       → (IAsyncEnumerable<ChangeEvent>)        // filtered
           → (IAsyncEnumerable<EnrichedEvent>)   // enriched
               → (IAsyncEnumerable<Batch>)       // batched
                   → Task                         // terminal write
```

## Core Types

```csharp
public record ChangeEvent(
    string EntityId,
    string EntityType,
    string Operation,
    JsonElement Payload,
    DateTimeOffset Timestamp);

public record EnrichedEvent(
    ChangeEvent Source,
    string? CustomerName,
    string? Region,
    decimal? LifetimeValue);

public record Batch<T>(
    IReadOnlyList<T> Items,
    int BatchNumber,
    DateTimeOffset CreatedAt);
```

## Database Source

```csharp
public static class DatabaseSource
{
    public static async IAsyncEnumerable<ChangeEvent> ReadChangesAsync(
        IDbConnection connection,
        DateTimeOffset since,
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        const string sql = """
            SELECT entity_id, entity_type, operation, payload, timestamp
            FROM change_log
            WHERE timestamp > @since
            ORDER BY timestamp
            """;

        using var reader = await connection.ExecuteReaderAsync(
            sql, new { since }, ct);

        while (await reader.ReadAsync(ct))
        {
            yield return new ChangeEvent(
                reader.GetString("entity_id"),
                reader.GetString("entity_type"),
                reader.GetString("operation"),
                JsonSerializer.Deserialize<JsonElement>(reader.GetString("payload")),
                reader.GetDateTimeOffset("timestamp"));
        }
    }
}
```

## Pipeline Stages as Extension Methods

```csharp
public static class PipelineStages
{
    /// <summary>Filters events by entity type and operation.</summary>
    public static async IAsyncEnumerable<ChangeEvent> WhereRelevant(
        this IAsyncEnumerable<ChangeEvent> source,
        HashSet<string> entityTypes,
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        await foreach (var evt in source.WithCancellation(ct))
        {
            if (entityTypes.Contains(evt.EntityType) && evt.Operation != "NOOP")
            {
                yield return evt;
            }
        }
    }

    /// <summary>Enriches events with customer data from an external API.</summary>
    public static async IAsyncEnumerable<EnrichedEvent> Enrich(
        this IAsyncEnumerable<ChangeEvent> source,
        ICustomerApiClient customerApi,
        ILogger logger,
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        await foreach (var evt in source.WithCancellation(ct))
        {
            EnrichedEvent enriched;
            try
            {
                var customer = await customerApi.GetCustomerAsync(
                    evt.EntityId, ct);

                enriched = new EnrichedEvent(
                    evt,
                    customer?.Name,
                    customer?.Region,
                    customer?.LifetimeValue);
            }
            catch (HttpRequestException ex)
            {
                // Log and continue with partial data — don't crash the pipeline
                logger.LogWarning(ex,
                    "Failed to enrich event {EntityId}, continuing with partial data",
                    evt.EntityId);

                enriched = new EnrichedEvent(evt, null, null, null);
            }

            yield return enriched;
        }
    }

    /// <summary>Collects items into fixed-size batches.</summary>
    public static async IAsyncEnumerable<Batch<T>> BatchBy<T>(
        this IAsyncEnumerable<T> source,
        int batchSize,
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(batchSize, 1);

        var buffer = new List<T>(batchSize);
        var batchNumber = 0;

        await foreach (var item in source.WithCancellation(ct))
        {
            buffer.Add(item);

            if (buffer.Count >= batchSize)
            {
                yield return new Batch<T>(
                    buffer.ToList(),
                    ++batchNumber,
                    DateTimeOffset.UtcNow);

                buffer.Clear();
            }
        }

        // Flush remaining items
        if (buffer.Count > 0)
        {
            yield return new Batch<T>(
                buffer.ToList(),
                ++batchNumber,
                DateTimeOffset.UtcNow);
        }
    }
}
```

## Sink (Terminal Operation)

```csharp
public static class AnalyticsSink
{
    public static async Task WriteAllAsync<T>(
        this IAsyncEnumerable<Batch<T>> source,
        IAnalyticsWriter writer,
        ILogger logger,
        CancellationToken ct = default)
    {
        await foreach (var batch in source.WithCancellation(ct))
        {
            try
            {
                await writer.WriteBatchAsync(batch.Items, ct);
                logger.LogInformation(
                    "Wrote batch {BatchNumber} with {Count} items",
                    batch.BatchNumber, batch.Items.Count);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex,
                    "Failed to write batch {BatchNumber}, {Count} items lost",
                    batch.BatchNumber, batch.Items.Count);
                // Continue to next batch — don't stop the pipeline
            }
        }
    }
}
```

## Composing the Pipeline

```csharp
public sealed class ChangeEventPipeline(
    IDbConnection connection,
    ICustomerApiClient customerApi,
    IAnalyticsWriter analyticsWriter,
    ILogger<ChangeEventPipeline> logger)
{
    private static readonly HashSet<string> RelevantTypes = ["Order", "Customer", "Product"];

    public async Task RunAsync(DateTimeOffset since, CancellationToken ct)
    {
        await DatabaseSource
            .ReadChangesAsync(connection, since, ct)
            .WhereRelevant(RelevantTypes, ct)
            .Enrich(customerApi, logger, ct)
            .BatchBy(100, ct)
            .WriteAllAsync(analyticsWriter, logger, ct);
    }
}
```

## Unit Tests

```csharp
public class PipelineStagesTests
{
    [Fact]
    public async Task WhereRelevant_FiltersByEntityType()
    {
        var events = ToAsyncEnumerable(
            new ChangeEvent("1", "Order", "INSERT", default, DateTimeOffset.UtcNow),
            new ChangeEvent("2", "AuditLog", "INSERT", default, DateTimeOffset.UtcNow),
            new ChangeEvent("3", "Order", "UPDATE", default, DateTimeOffset.UtcNow));

        var result = await events
            .WhereRelevant(["Order"])
            .ToListAsync();

        Assert.Equal(2, result.Count);
        Assert.All(result, e => Assert.Equal("Order", e.EntityType));
    }

    [Fact]
    public async Task BatchBy_ProducesCorrectBatchSizes()
    {
        var items = ToAsyncEnumerable(Enumerable.Range(1, 10).ToArray());

        var batches = await items.BatchBy(3).ToListAsync();

        Assert.Equal(4, batches.Count);
        Assert.Equal(3, batches[0].Items.Count);
        Assert.Equal(3, batches[1].Items.Count);
        Assert.Equal(3, batches[2].Items.Count);
        Assert.Equal(1, batches[3].Items.Count); // remainder
    }

    [Fact]
    public async Task BatchBy_EmptySource_ProducesNoBatches()
    {
        var empty = ToAsyncEnumerable<int>();
        var batches = await empty.BatchBy(10).ToListAsync();
        Assert.Empty(batches);
    }

    [Fact]
    public async Task Enrich_ContinuesOnApiFailure()
    {
        var mockApi = Substitute.For<ICustomerApiClient>();
        mockApi.GetCustomerAsync("fail", Arg.Any<CancellationToken>())
            .ThrowsAsync(new HttpRequestException("timeout"));
        mockApi.GetCustomerAsync("ok", Arg.Any<CancellationToken>())
            .Returns(new CustomerInfo("Alice", "US", 1000m));

        var events = ToAsyncEnumerable(
            new ChangeEvent("fail", "Order", "INSERT", default, DateTimeOffset.UtcNow),
            new ChangeEvent("ok", "Order", "INSERT", default, DateTimeOffset.UtcNow));

        var results = await events
            .Enrich(mockApi, NullLogger.Instance)
            .ToListAsync();

        Assert.Equal(2, results.Count);
        Assert.Null(results[0].CustomerName);      // failed enrichment
        Assert.Equal("Alice", results[1].CustomerName); // successful enrichment
    }

    private static async IAsyncEnumerable<T> ToAsyncEnumerable<T>(params T[] items)
    {
        foreach (var item in items) yield return item;
        await Task.CompletedTask;
    }
}
```

## Key Decisions

- **IAsyncEnumerable throughout** — each stage is a pure transformation from one async stream to another, enabling lazy evaluation and natural backpressure.
- **[EnumeratorCancellation]** — every generator accepts and propagates CancellationToken for graceful shutdown.
- **Error isolation** — enrichment failures and write failures are logged but do not crash the pipeline. Only cancellation stops processing.
- **Testable stages** — each stage is tested independently with in-memory async enumerables. No database or network needed.
- **Extension method composition** — the pipeline reads like a LINQ query: `.ReadChanges().WhereRelevant().Enrich().BatchBy(100).WriteAll()`.
