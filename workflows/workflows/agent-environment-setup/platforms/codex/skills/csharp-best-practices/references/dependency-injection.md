# Dependency Injection Reference

## Service Lifetimes

### Transient

A new instance is created every time the service is requested. Use for stateless, lightweight services.

```csharp
builder.Services.AddTransient<IValidator<CreateOrderRequest>, OrderValidator>();
```

### Scoped

One instance per scope (per HTTP request in ASP.NET). Use for per-request state like DbContext.

```csharp
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IOrderService, OrderService>();

// DbContext is Scoped by default
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));
```

### Singleton

One instance for the application lifetime. Use for thread-safe, shared services.

```csharp
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<IMemoryCache, MemoryCache>();
```

### Lifetime mismatch: captive dependency

**Never inject Scoped into Singleton.** The Singleton captures the Scoped instance forever, causing stale data, disposed DbContexts, and connection leaks.

```csharp
// BAD — CacheService is Singleton, OrderRepository is Scoped
// The repository (and its DbContext) lives forever inside the cache
builder.Services.AddSingleton<ICacheService, CacheService>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();

public class CacheService(IOrderRepository repository) // CAPTURED!
{
    // repository.DbContext was disposed after the first request
}

// FIX — use IServiceScopeFactory
public class CacheService(IServiceScopeFactory scopeFactory)
{
    public async Task RefreshCacheAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IOrderRepository>();
        // Fresh scoped instance with its own DbContext
        var orders = await repository.ListAsync(ct);
    }
}
```

### Lifetime validation

Enable scope validation in development to catch captive dependencies:

```csharp
builder.Host.UseDefaultServiceProvider(options =>
{
    options.ValidateScopes = builder.Environment.IsDevelopment();
    options.ValidateOnBuild = true; // Catches missing registrations at startup
});
```

## Keyed Services (.NET 8+)

Register multiple implementations of the same interface, distinguished by key.

```csharp
// Registration
builder.Services.AddKeyedSingleton<INotificationSender, EmailSender>("email");
builder.Services.AddKeyedSingleton<INotificationSender, SmsSender>("sms");
builder.Services.AddKeyedSingleton<INotificationSender, PushSender>("push");

// Resolution by key
public class NotificationService(
    [FromKeyedServices("email")] INotificationSender emailSender,
    [FromKeyedServices("sms")] INotificationSender smsSender)
{
    public async Task NotifyAsync(User user, Message message, CancellationToken ct)
    {
        if (user.PrefersSms)
            await smsSender.SendAsync(user, message, ct);
        else
            await emailSender.SendAsync(user, message, ct);
    }
}
```

### Strategy pattern with keyed services

```csharp
// Dynamic resolution
public class PaymentProcessor(IServiceProvider services)
{
    public async Task<PaymentResult> ProcessAsync(PaymentRequest request, CancellationToken ct)
    {
        var handler = services.GetRequiredKeyedService<IPaymentHandler>(request.Method.ToString());
        return await handler.ProcessAsync(request, ct);
    }
}
```

## IOptions Pattern

### Options types

```csharp
public class SmtpOptions
{
    public const string SectionName = "Smtp";

    public required string Host { get; init; }
    public int Port { get; init; } = 587;
    public required string Username { get; init; }
    public required string Password { get; init; }
    public bool UseTls { get; init; } = true;
}
```

### Registration with validation

```csharp
builder.Services
    .AddOptions<SmtpOptions>()
    .Bind(builder.Configuration.GetSection(SmtpOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart(); // Fail fast on misconfiguration
```

### Which IOptions to inject

| Interface | Lifetime | Reloads on change | Use when |
| --- | --- | --- | --- |
| `IOptions<T>` | Singleton | No | Static config, injected into Singleton services |
| `IOptionsSnapshot<T>` | Scoped | Yes (per request) | Config that changes between requests |
| `IOptionsMonitor<T>` | Singleton | Yes (callback) | Long-running services that need live updates |

```csharp
// Singleton service with reloading config
public class EmailService(IOptionsMonitor<SmtpOptions> optionsMonitor)
{
    public async Task SendAsync(Email email, CancellationToken ct)
    {
        var options = optionsMonitor.CurrentValue; // Always current
        using var client = new SmtpClient(options.Host, options.Port);
        // ...
    }
}
```

## Factory Pattern

### Typed HttpClient factory

```csharp
builder.Services.AddHttpClient<IGitHubClient, GitHubClient>(client =>
{
    client.BaseAddress = new Uri("https://api.github.com");
    client.DefaultRequestHeaders.Add("Accept", "application/vnd.github.v3+json");
})
.AddStandardResilienceHandler(); // Polly retry/circuit breaker (.NET 8+)
```

### Custom factory with IServiceScopeFactory

```csharp
public interface IWorkerFactory
{
    IWorker Create(string workerId);
}

public class WorkerFactory(IServiceScopeFactory scopeFactory) : IWorkerFactory
{
    public IWorker Create(string workerId)
    {
        var scope = scopeFactory.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IOrderRepository>();
        return new Worker(workerId, repository, scope);
    }
}
```

## Open Generic Registration

```csharp
// Register one implementation for all generic variants
builder.Services.AddScoped(typeof(IRepository<>), typeof(GenericRepository<>));

// IRepository<Order> resolves to GenericRepository<Order>
// IRepository<Customer> resolves to GenericRepository<Customer>
```

## Decorator Pattern

```csharp
// Using Scrutor or manual decoration
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.Decorate<IOrderRepository, CachingOrderRepositoryDecorator>();
builder.Services.Decorate<IOrderRepository, LoggingOrderRepositoryDecorator>();

// Resolution order: Logging -> Caching -> OrderRepository
```

## Testing with DI

```csharp
// Override services in WebApplicationFactory
factory.WithWebHostBuilder(builder =>
{
    builder.ConfigureServices(services =>
    {
        services.RemoveAll<IOrderRepository>();
        services.AddScoped<IOrderRepository, InMemoryOrderRepository>();

        services.RemoveAll<TimeProvider>();
        services.AddSingleton<TimeProvider>(new FakeTimeProvider(fixedTime));
    });
});
```
