# Testing and Analyzers

## Testing Stack

```xml
<!-- Common test project dependencies -->
<PackageReference Include="Microsoft.NET.Test.Sdk" />
<PackageReference Include="xunit" />
<PackageReference Include="xunit.runner.visualstudio" />
<PackageReference Include="FluentAssertions" />
<PackageReference Include="NSubstitute" />
<PackageReference Include="Testcontainers.PostgreSql" />
<PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" />
```

## Unit Test Patterns

```csharp
public class OrderServiceTests
{
    private readonly IOrderRepository _repo = Substitute.For<IOrderRepository>();
    private readonly ILogger<OrderService> _logger = Substitute.For<ILogger<OrderService>>();
    private readonly OrderService _sut;

    public OrderServiceTests()
    {
        _sut = new OrderService(_repo, _logger);
    }

    [Fact]
    public async Task GetAsync_ExistingOrder_ReturnsOrder()
    {
        // Arrange
        var expected = new Order { Id = 1, CustomerName = "Alice" };
        _repo.FindAsync(1, Arg.Any<CancellationToken>()).Returns(expected);

        // Act
        var result = await _sut.GetAsync(1, CancellationToken.None);

        // Assert
        result.Should().Be(expected);
        await _repo.Received(1).FindAsync(1, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetAsync_MissingOrder_ThrowsNotFound()
    {
        _repo.FindAsync(99, Arg.Any<CancellationToken>()).Returns((Order?)null);

        var act = () => _sut.GetAsync(99, CancellationToken.None);

        await act.Should().ThrowAsync<OrderNotFoundException>()
            .WithMessage("*99*");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task GetAsync_InvalidId_ThrowsArgument(int id)
    {
        var act = () => _sut.GetAsync(id, CancellationToken.None);
        await act.Should().ThrowAsync<ArgumentOutOfRangeException>();
    }
}
```

## Integration Testing with WebApplicationFactory

```csharp
public class OrderApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public OrderApiTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Replace real DB with in-memory or testcontainer
                services.RemoveAll<DbContextOptions<AppDbContext>>();
                services.AddDbContext<AppDbContext>(opt =>
                    opt.UseInMemoryDatabase("TestDb"));
            });
        }).CreateClient();
    }

    [Fact]
    public async Task CreateOrder_ValidPayload_Returns201()
    {
        var payload = new { CustomerName = "Alice", Items = new[] { new { Name = "Widget", Qty = 2 } } };
        var response = await _client.PostAsJsonAsync("/api/orders", payload);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var order = await response.Content.ReadFromJsonAsync<OrderDto>();
        order!.CustomerName.Should().Be("Alice");
    }
}
```

## Testcontainers for Real Dependencies

```csharp
public class PostgresOrderTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .Build();

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();
    }

    public async Task DisposeAsync()
    {
        await _postgres.DisposeAsync();
    }

    [Fact]
    public async Task Repository_SaveAndRetrieve_RoundTrips()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;

        await using var ctx = new AppDbContext(options);
        await ctx.Database.MigrateAsync();

        var repo = new EfOrderRepository(ctx);
        var order = new Order { CustomerName = "Alice" };
        await repo.SaveAsync(order, CancellationToken.None);

        var loaded = await repo.FindAsync(order.Id, CancellationToken.None);
        loaded.Should().NotBeNull();
        loaded!.CustomerName.Should().Be("Alice");
    }
}
```

## Roslyn Analyzer Configuration

```ini
# .editorconfig — enforce code quality rules

[*.cs]
# Nullable warnings as errors
dotnet_diagnostic.CS8600.severity = error  # Converting null literal
dotnet_diagnostic.CS8602.severity = error  # Dereference of a possibly null reference
dotnet_diagnostic.CS8603.severity = error  # Possible null reference return

# Async best practices
dotnet_diagnostic.CA2007.severity = warning  # ConfigureAwait
dotnet_diagnostic.CA2008.severity = error    # Do not create tasks without passing a TaskScheduler
dotnet_diagnostic.CA2012.severity = error    # Use ValueTasks correctly

# Reliability
dotnet_diagnostic.CA2000.severity = warning  # Dispose objects before losing scope
dotnet_diagnostic.CA2213.severity = warning  # Disposable fields should be disposed

# Security
dotnet_diagnostic.CA2100.severity = error    # Review SQL queries for security vulnerabilities
dotnet_diagnostic.CA3001.severity = error    # Review code for SQL injection vulnerabilities
dotnet_diagnostic.CA5351.severity = error    # Do not use broken cryptographic algorithms
```

## BenchmarkDotNet

```csharp
[MemoryDiagnoser]         // track allocations
[SimpleJob(RuntimeMoniker.Net90)]
public class SerializationBenchmarks
{
    private readonly Order _order = CreateSampleOrder();

    [Benchmark(Baseline = true)]
    public string SystemTextJson()
        => JsonSerializer.Serialize(_order);

    [Benchmark]
    public string NewtonsoftJson()
        => JsonConvert.SerializeObject(_order);

    [Benchmark]
    public byte[] MessagePack()
        => MessagePackSerializer.Serialize(_order);
}

// Run: dotnet run -c Release --project Benchmarks
```

## Test Organization

```
tests/
├── Unit/                      # Fast, isolated
│   ├── Domain/
│   │   └── OrderTests.cs
│   └── Services/
│       └── OrderServiceTests.cs
├── Integration/               # Real dependencies
│   ├── Repositories/
│   │   └── EfOrderRepoTests.cs
│   └── Api/
│       └── OrderApiTests.cs
└── Benchmarks/                # Performance
    └── SerializationBenchmarks.cs
```

| Layer       | Speed | Dependencies    | When to use                                |
| ----------- | ----- | --------------- | ------------------------------------------ |
| Unit        | <1ms  | Mocks only      | Business logic, validation, pure functions |
| Integration | <5s   | DB, HTTP, cache | Repository, API, cross-service             |
| Benchmark   | N/A   | Real workload   | Before/after optimization                  |
