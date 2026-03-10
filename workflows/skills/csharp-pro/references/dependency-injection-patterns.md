# Dependency Injection Patterns

## Lifetime Rules

```csharp
// Transient: new instance every time — stateless services, factories
services.AddTransient<IEmailSender, SmtpEmailSender>();

// Scoped: one instance per scope (per HTTP request in ASP.NET)
services.AddScoped<IOrderRepository, EfOrderRepository>();

// Singleton: one instance for app lifetime — caches, config, connection pools
services.AddSingleton<IConnectionPool, RedisConnectionPool>();
```

### Captive Dependency Problem

```csharp
// WRONG — Scoped injected into Singleton captures stale DbContext
services.AddSingleton<ICacheWarmer, CacheWarmer>();  // Singleton
services.AddScoped<AppDbContext>();                    // Scoped

public class CacheWarmer(AppDbContext db) // BUG: db is captured from first scope
{
    // db will use a disposed/stale connection after first request ends
}

// FIX — use IServiceScopeFactory to create scopes on demand
public class CacheWarmer(IServiceScopeFactory scopeFactory)
{
    public async Task WarmAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        // db is fresh, properly scoped
    }
}
```

## Options Pattern

```csharp
// appsettings.json
// { "Email": { "SmtpHost": "smtp.example.com", "Port": 587 } }

public class EmailOptions
{
    public const string SectionName = "Email";
    public required string SmtpHost { get; init; }
    public int Port { get; init; } = 587;
}

// Registration
services.Configure<EmailOptions>(config.GetSection(EmailOptions.SectionName));

// IOptions<T> — singleton, read once at startup
public class EmailService(IOptions<EmailOptions> options)
{
    private readonly EmailOptions _opts = options.Value;
}

// IOptionsSnapshot<T> — scoped, re-reads on each request
public class EmailService(IOptionsSnapshot<EmailOptions> options)
{
    // options.Value reflects latest config per request
}

// IOptionsMonitor<T> — singleton with change notification
public class EmailService(IOptionsMonitor<EmailOptions> options)
{
    public EmailService(IOptionsMonitor<EmailOptions> options)
    {
        options.OnChange(newOpts => UpdateSmtpClient(newOpts));
    }
}

// Validation with DataAnnotations
services.AddOptionsWithValidateOnStart<EmailOptions>()
    .Bind(config.GetSection(EmailOptions.SectionName))
    .ValidateDataAnnotations();
```

## Keyed Services (C# 12 / .NET 8)

```csharp
// Register multiple implementations with keys
services.AddKeyedSingleton<INotifier, EmailNotifier>("email");
services.AddKeyedSingleton<INotifier, SmsNotifier>("sms");
services.AddKeyedSingleton<INotifier, SlackNotifier>("slack");

// Inject specific implementation
public class OrderProcessor(
    [FromKeyedServices("email")] INotifier emailNotifier,
    [FromKeyedServices("slack")] INotifier slackNotifier)
{
    // ...
}

// Resolve from service provider
var smsNotifier = provider.GetRequiredKeyedService<INotifier>("sms");
```

## Factory and Decorator Patterns

```csharp
// Factory registration for complex construction
services.AddTransient<IReportGenerator>(sp =>
{
    var config = sp.GetRequiredService<IOptions<ReportOptions>>().Value;
    var logger = sp.GetRequiredService<ILogger<PdfReportGenerator>>();
    return config.Format switch
    {
        "pdf" => new PdfReportGenerator(logger),
        "csv" => new CsvReportGenerator(logger),
        _ => throw new InvalidOperationException($"Unknown format: {config.Format}")
    };
});

// Decorator pattern with Scrutor or manual registration
services.AddScoped<IOrderRepository, EfOrderRepository>();
services.Decorate<IOrderRepository, CachingOrderRepository>();
// CachingOrderRepository receives EfOrderRepository via constructor
```

## Hosted Services and Background Work

```csharp
// BackgroundService for long-running work
public class QueueProcessor(
    IServiceScopeFactory scopeFactory,
    ILogger<QueueProcessor> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            using var scope = scopeFactory.CreateScope();
            var queue = scope.ServiceProvider.GetRequiredService<IMessageQueue>();

            var message = await queue.DequeueAsync(ct);
            if (message is not null)
            {
                var handler = scope.ServiceProvider.GetRequiredService<IMessageHandler>();
                await handler.HandleAsync(message, ct);
            }
        }
    }
}

// Register
services.AddHostedService<QueueProcessor>();
```

## Anti-Patterns

| Anti-pattern                                      | Problem                                | Fix                          |
| ------------------------------------------------- | -------------------------------------- | ---------------------------- |
| Service Locator (`sp.GetService<T>()` everywhere) | Hides dependencies, breaks testability | Constructor injection        |
| Scoped in Singleton                               | Captive dependency, stale state        | `IServiceScopeFactory`       |
| Registering everything as Singleton               | Memory growth, stale data              | Use narrowest valid lifetime |
| Constructor with 10+ parameters                   | God class, poor cohesion               | Split into focused services  |
| `new`-ing services instead of injecting           | Untestable, lifetime mismatch          | Register and inject via DI   |
