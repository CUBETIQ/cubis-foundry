# Async/Await Patterns

## CancellationToken Propagation

```csharp
// Every public async method takes CancellationToken as last parameter
public async Task<Order> GetOrderAsync(int id, CancellationToken ct = default)
{
    var order = await _db.Orders
        .Include(o => o.Items)
        .FirstOrDefaultAsync(o => o.Id == id, ct);

    if (order is null) throw new OrderNotFoundException(id);
    return order;
}

// Create linked tokens for operation-specific timeouts
public async Task<Response> CallExternalApiAsync(Request req, CancellationToken ct)
{
    using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
    cts.CancelAfter(TimeSpan.FromSeconds(5)); // 5s timeout on top of caller's token

    return await _httpClient.PostAsJsonAsync("/api/process", req, cts.Token);
}
```

## ValueTask vs Task

```csharp
// Use ValueTask when the synchronous path is common (cache hits, buffered reads)
public ValueTask<User?> GetCachedUserAsync(int id, CancellationToken ct)
{
    if (_cache.TryGetValue(id, out var user))
        return ValueTask.FromResult(user); // no allocation

    return LoadFromDbAsync(id, ct); // async fallback
}

private async ValueTask<User?> LoadFromDbAsync(int id, CancellationToken ct)
{
    var user = await _db.Users.FindAsync(new object[] { id }, ct);
    if (user is not null) _cache[id] = user;
    return user;
}

// Rules for ValueTask:
// 1. Never await a ValueTask more than once
// 2. Never use .Result or .GetAwaiter().GetResult() on an incomplete ValueTask
// 3. Never use WhenAll/WhenAny with ValueTask — convert with AsTask() first
```

## Parallel Async Operations

```csharp
// Task.WhenAll for independent concurrent operations
public async Task<DashboardData> GetDashboardAsync(int userId, CancellationToken ct)
{
    var ordersTask = _orderService.GetRecentAsync(userId, ct);
    var statsTask = _statsService.GetSummaryAsync(userId, ct);
    var notificationsTask = _notificationService.GetUnreadAsync(userId, ct);

    await Task.WhenAll(ordersTask, statsTask, notificationsTask);

    return new DashboardData(
        Orders: ordersTask.Result,
        Stats: statsTask.Result,
        Notifications: notificationsTask.Result
    );
}

// Bounded parallelism with SemaphoreSlim
public async Task ProcessBatchAsync(IReadOnlyList<Item> items, CancellationToken ct)
{
    using var semaphore = new SemaphoreSlim(10); // max 10 concurrent

    var tasks = items.Select(async item =>
    {
        await semaphore.WaitAsync(ct);
        try { await ProcessItemAsync(item, ct); }
        finally { semaphore.Release(); }
    });

    await Task.WhenAll(tasks);
}
```

## IAsyncEnumerable Streaming

```csharp
// Stream results instead of buffering entire collections
public async IAsyncEnumerable<LogEntry> StreamLogsAsync(
    DateTime since,
    [EnumeratorCancellation] CancellationToken ct = default)
{
    await foreach (var batch in _logStore.ReadBatchesAsync(since, ct))
    {
        foreach (var entry in batch)
        {
            yield return entry;
        }
    }
}

// Consume in controller — streams response
[HttpGet("logs")]
public IAsyncEnumerable<LogEntry> GetLogs(
    [FromQuery] DateTime since, CancellationToken ct)
{
    return _logService.StreamLogsAsync(since, ct);
}
```

## Async Disposal

```csharp
// Use await using for IAsyncDisposable resources
public async Task ProcessMessageAsync(Message msg, CancellationToken ct)
{
    await using var connection = await _connectionFactory.CreateAsync(ct);
    await using var transaction = await connection.BeginTransactionAsync(ct);

    await _repository.SaveAsync(msg, transaction, ct);
    await transaction.CommitAsync(ct);
}

// Implement IAsyncDisposable for resource-holding types
public sealed class EventProcessor : IAsyncDisposable
{
    private readonly Channel<Event> _channel = Channel.CreateBounded<Event>(1000);
    private readonly Task _processingTask;

    public EventProcessor()
    {
        _processingTask = ProcessEventsAsync();
    }

    public async ValueTask DisposeAsync()
    {
        _channel.Writer.Complete();
        await _processingTask; // wait for in-flight work
    }
}
```

## Common Async Anti-Patterns

| Anti-pattern                    | Why it's bad                                   | Fix                                                           |
| ------------------------------- | ---------------------------------------------- | ------------------------------------------------------------- |
| `.Result` / `.Wait()`           | Deadlocks in sync contexts, starves threadpool | Use `await` throughout                                        |
| `async void`                    | Unobserved exceptions crash the process        | Use `async Task` — only exception: event handlers             |
| Fire-and-forget without logging | Lost exceptions, untracked work                | Use `_ = Task.Run(...)` with try/catch, or background service |
| `Task.Factory.StartNew`         | Wrong scheduler, no unwrapping                 | Use `Task.Run` for CPU work                                   |
| No CancellationToken            | Unresponsive to shutdown                       | Propagate tokens through the chain                            |
| Blocking thread in async method | Wastes threadpool thread                       | Use `await` for I/O, keep computation async                   |
