# Async Patterns Reference

## Async/Await Fundamentals

### CancellationToken propagation

Every public async method takes `CancellationToken` as its last parameter. This enables graceful shutdown, request abort, and timeout enforcement.

```csharp
public interface IOrderRepository
{
    Task<Order?> FindByIdAsync(string id, CancellationToken ct);
    Task SaveAsync(Order order, CancellationToken ct);
    Task<IReadOnlyList<Order>> ListAsync(OrderFilter filter, CancellationToken ct);
}

public sealed class OrderService(IOrderRepository repository)
{
    public async Task<Order?> GetOrderAsync(string id, CancellationToken ct)
    {
        // Token flows through the entire call chain
        return await repository.FindByIdAsync(id, ct);
    }
}
```

### ConfigureAwait in library code

```csharp
// Library/shared code — avoid capturing sync context
public async Task<Data> FetchAsync(string url, CancellationToken ct)
{
    var response = await _client.GetAsync(url, ct).ConfigureAwait(false);
    var content = await response.Content.ReadAsByteArrayAsync(ct).ConfigureAwait(false);
    return new Data(content);
}

// Application code (ASP.NET, console) — ConfigureAwait(false) is optional
// ASP.NET Core has no SynchronizationContext, so it's a no-op
```

### Timeout with CancellationToken

```csharp
public async Task<Result> ProcessWithTimeoutAsync(Request request, CancellationToken ct)
{
    using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
    timeoutCts.CancelAfter(TimeSpan.FromSeconds(30));

    try
    {
        return await _processor.ProcessAsync(request, timeoutCts.Token);
    }
    catch (OperationCanceledException) when (!ct.IsCancellationRequested)
    {
        // Timeout (not caller cancellation)
        throw new TimeoutException("Processing exceeded 30 second limit");
    }
}
```

## ValueTask vs. Task

### When to use ValueTask

Use `ValueTask<T>` when the common path completes synchronously (cache hit, buffered data).

```csharp
private readonly ConcurrentDictionary<string, Profile> _cache = new();

// Hot path returns synchronously from cache — no Task allocation
public ValueTask<Profile> GetProfileAsync(string userId, CancellationToken ct)
{
    if (_cache.TryGetValue(userId, out var cached))
    {
        return ValueTask.FromResult(cached); // no allocation
    }

    return new ValueTask<Profile>(LoadAndCacheAsync(userId, ct));
}

private async Task<Profile> LoadAndCacheAsync(string userId, CancellationToken ct)
{
    var profile = await _repository.FindByIdAsync(userId, ct);
    _cache.TryAdd(userId, profile);
    return profile;
}
```

### ValueTask rules

1. Never await a `ValueTask` more than once.
2. Never use `.Result` or `.GetAwaiter().GetResult()` on a `ValueTask` before it completes.
3. Never store a `ValueTask` and await it later — consume it immediately.
4. If you need to store or multi-await, convert: `valueTask.AsTask()`.

## IAsyncEnumerable Patterns

### Basic producer

```csharp
public async IAsyncEnumerable<LogEntry> TailLogsAsync(
    string path,
    [EnumeratorCancellation] CancellationToken ct = default)
{
    using var reader = new StreamReader(path);

    // Seek to end of file
    reader.BaseStream.Seek(0, SeekOrigin.End);

    while (!ct.IsCancellationRequested)
    {
        var line = await reader.ReadLineAsync(ct);
        if (line is not null)
        {
            yield return ParseLogEntry(line);
        }
        else
        {
            await Task.Delay(TimeSpan.FromMilliseconds(100), ct);
        }
    }
}
```

### Composing async streams

```csharp
public static class AsyncEnumerableExtensions
{
    public static async IAsyncEnumerable<TResult> SelectAsync<TSource, TResult>(
        this IAsyncEnumerable<TSource> source,
        Func<TSource, CancellationToken, ValueTask<TResult>> selector,
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        await foreach (var item in source.WithCancellation(ct))
        {
            yield return await selector(item, ct);
        }
    }

    public static async IAsyncEnumerable<TSource> WhereAsync<TSource>(
        this IAsyncEnumerable<TSource> source,
        Func<TSource, bool> predicate,
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        await foreach (var item in source.WithCancellation(ct))
        {
            if (predicate(item))
                yield return item;
        }
    }

    public static async Task<List<T>> ToListAsync<T>(
        this IAsyncEnumerable<T> source,
        CancellationToken ct = default)
    {
        var list = new List<T>();
        await foreach (var item in source.WithCancellation(ct))
        {
            list.Add(item);
        }
        return list;
    }
}
```

### Async stream in minimal API endpoint

```csharp
app.MapGet("/api/events/stream", (
    IEventRepository repository,
    CancellationToken ct) =>
{
    // Returns Server-Sent Events or NDJSON stream
    return Results.Ok(repository.StreamEventsAsync(ct));
});
```

## Parallel Async Patterns

### Task.WhenAll for independent operations

```csharp
public async Task<DashboardData> LoadDashboardAsync(string userId, CancellationToken ct)
{
    var ordersTask = _orderService.GetRecentAsync(userId, ct);
    var profileTask = _profileService.GetAsync(userId, ct);
    var statsTask = _analyticsService.GetStatsAsync(userId, ct);

    // All three run concurrently
    await Task.WhenAll(ordersTask, profileTask, statsTask);

    return new DashboardData(
        Orders: await ordersTask,
        Profile: await profileTask,
        Stats: await statsTask);
}
```

### Semaphore-based concurrency limiting

```csharp
public async Task ProcessBatchAsync(IEnumerable<Item> items, CancellationToken ct)
{
    using var semaphore = new SemaphoreSlim(10); // max 10 concurrent

    var tasks = items.Select(async item =>
    {
        await semaphore.WaitAsync(ct);
        try
        {
            await ProcessItemAsync(item, ct);
        }
        finally
        {
            semaphore.Release();
        }
    });

    await Task.WhenAll(tasks);
}
```

## Blocking Pitfalls

### What NOT to do

```csharp
// BAD — blocks thread pool thread, causes deadlock under load
var result = GetDataAsync().Result;
var result = GetDataAsync().GetAwaiter().GetResult();
GetDataAsync().Wait();

// BAD — sync over async in constructors
public MyService()
{
    _data = LoadDataAsync().Result; // DEADLOCK if SyncContext exists
}

// GOOD — use async factory pattern
public static async Task<MyService> CreateAsync(CancellationToken ct)
{
    var data = await LoadDataAsync(ct);
    return new MyService(data);
}
```

### Thread pool starvation

Each `.Result` or `.Wait()` call blocks a thread pool thread. Under load (many concurrent requests), all threads block waiting for async operations that need a thread to complete — deadlock.

Detection: `dotnet-counters monitor --counters System.Runtime` — watch `ThreadPool Queue Length` and `ThreadPool Thread Count`. Growing queue with max threads = starvation.

## Channel for producer-consumer

```csharp
public class EventProcessor
{
    private readonly Channel<Event> _channel = Channel.CreateBounded<Event>(
        new BoundedChannelOptions(1000)
        {
            FullMode = BoundedChannelFullMode.Wait,
            SingleWriter = false,
            SingleReader = true
        });

    // Producers write events
    public async ValueTask PublishAsync(Event evt, CancellationToken ct)
    {
        await _channel.Writer.WriteAsync(evt, ct);
    }

    // Single consumer processes events
    public async Task ProcessAsync(CancellationToken ct)
    {
        await foreach (var evt in _channel.Reader.ReadAllAsync(ct))
        {
            await HandleEventAsync(evt, ct);
        }
    }
}
```
