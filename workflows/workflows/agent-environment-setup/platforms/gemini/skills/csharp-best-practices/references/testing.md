# Testing Reference

## xUnit Patterns

### Basic test structure

```csharp
public class OrderServiceTests
{
    private readonly Mock<IOrderRepository> _repository = new();
    private readonly Mock<ILogger<OrderService>> _logger = new();
    private readonly OrderService _sut;

    public OrderServiceTests()
    {
        _sut = new OrderService(
            _repository.Object,
            _logger.Object,
            TimeProvider.System);
    }

    [Fact]
    public async Task CreateOrder_WithValidRequest_ReturnsOrderWithId()
    {
        // Arrange
        var request = new CreateOrderRequest("customer-1", [
            new("product-1", "Widget", 2, 9.99m)
        ]);

        // Act
        var order = await _sut.CreateOrderAsync(request, CancellationToken.None);

        // Assert
        Assert.NotNull(order);
        Assert.NotEmpty(order.Id);
        Assert.Equal("customer-1", order.CustomerId);
        Assert.Single(order.Lines);
    }

    [Fact]
    public async Task CancelOrder_WhenShipped_ThrowsOrderStateException()
    {
        // Arrange
        var order = TestData.CreateOrder(status: OrderStatus.Shipped);
        _repository.Setup(r => r.FindByIdAsync(order.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);

        // Act & Assert
        await Assert.ThrowsAsync<OrderStateException>(
            () => _sut.CancelOrderAsync(order.Id, CancellationToken.None));
    }
}
```

### Theory tests with data

```csharp
public class PricingCalculatorTests
{
    [Theory]
    [InlineData(100, CustomerTier.Standard, 0)]
    [InlineData(100, CustomerTier.Premium, 10)]
    [InlineData(1000, CustomerTier.Standard, 50)]
    [InlineData(1000, CustomerTier.Premium, 150)]
    public void CalculateDiscount_ReturnsExpectedAmount(
        decimal orderTotal, CustomerTier tier, decimal expectedDiscount)
    {
        var calculator = new PricingCalculator();
        var discount = calculator.CalculateDiscount(orderTotal, tier);
        Assert.Equal(expectedDiscount, discount);
    }

    [Theory]
    [MemberData(nameof(EdgeCaseOrders))]
    public void CalculateDiscount_EdgeCases(Order order, decimal expected)
    {
        var calculator = new PricingCalculator();
        Assert.Equal(expected, calculator.CalculateDiscount(order));
    }

    public static TheoryData<Order, decimal> EdgeCaseOrders => new()
    {
        { TestData.CreateOrder(total: 0m), 0m },
        { TestData.CreateOrder(total: decimal.MaxValue), decimal.MaxValue * 0.15m },
        { TestData.CreateOrder(lines: []), 0m },
    };
}
```

## WebApplicationFactory Integration Tests

### Setup

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
                // Replace real repository with in-memory for testing
                services.RemoveAll<IOrderRepository>();
                services.AddScoped<IOrderRepository, InMemoryOrderRepository>();
            });
        }).CreateClient();
    }

    [Fact]
    public async Task CreateOrder_ReturnsCreated()
    {
        var request = new CreateOrderRequest("cust-1", [
            new("prod-1", "Widget", 1, 19.99m)
        ]);

        var response = await _client.PostAsJsonAsync("/api/orders", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var order = await response.Content.ReadFromJsonAsync<OrderResponse>();
        Assert.NotNull(order);
        Assert.Equal("cust-1", order.CustomerId);
    }

    [Fact]
    public async Task GetOrder_NotFound_Returns404()
    {
        var response = await _client.GetAsync("/api/orders/nonexistent");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
```

## Testcontainers for Database Tests

```csharp
public class PostgresOrderRepositoryTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .Build();

    private NpgsqlDataSource _dataSource = null!;

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();

        _dataSource = NpgsqlDataSource.Create(_postgres.GetConnectionString());

        // Run migrations
        await using var connection = await _dataSource.OpenConnectionAsync();
        await RunMigrations(connection);
    }

    public async Task DisposeAsync()
    {
        _dataSource.Dispose();
        await _postgres.DisposeAsync();
    }

    [Fact]
    public async Task SaveAndRetrieve_RoundTrip()
    {
        var repository = new PostgresOrderRepository(_dataSource);
        var order = TestData.CreateOrder();

        await repository.SaveAsync(order, CancellationToken.None);
        var retrieved = await repository.FindByIdAsync(order.Id, CancellationToken.None);

        Assert.NotNull(retrieved);
        Assert.Equal(order.Id, retrieved.Id);
        Assert.Equal(order.Total, retrieved.Total);
    }
}
```

## Snapshot Testing with Verify

```csharp
public class OrderResponseSerializationTests
{
    [Fact]
    public async Task OrderResponse_SerializesToExpectedJson()
    {
        var response = new OrderResponse(
            "order-1",
            "cust-1",
            [new("prod-1", "Widget", 2, 9.99m, 19.98m)],
            19.98m,
            "Pending",
            new DateTimeOffset(2025, 1, 15, 10, 30, 0, TimeSpan.Zero));

        await Verify(response);
        // First run: creates OrderResponseSerializationTests.OrderResponse_SerializesToExpectedJson.verified.json
        // Subsequent runs: compares against snapshot
    }
}
```

## Mocking Patterns

### NSubstitute

```csharp
var repository = Substitute.For<IOrderRepository>();

// Setup return value
repository.FindByIdAsync("order-1", Arg.Any<CancellationToken>())
    .Returns(TestData.CreateOrder(id: "order-1"));

// Verify call was made
await repository.Received(1).SaveAsync(
    Arg.Is<Order>(o => o.Status == OrderStatus.Pending),
    Arg.Any<CancellationToken>());
```

### Moq

```csharp
var repository = new Mock<IOrderRepository>();

repository.Setup(r => r.FindByIdAsync("order-1", It.IsAny<CancellationToken>()))
    .ReturnsAsync(TestData.CreateOrder(id: "order-1"));

repository.Verify(r => r.SaveAsync(
    It.Is<Order>(o => o.Status == OrderStatus.Pending),
    It.IsAny<CancellationToken>()), Times.Once);
```

## Test Data Builders

```csharp
public static class TestData
{
    public static Order CreateOrder(
        string? id = null,
        string? customerId = null,
        OrderStatus status = OrderStatus.Pending,
        decimal total = 99.99m,
        IReadOnlyList<OrderLine>? lines = null)
    {
        return new Order
        {
            Id = id ?? Ulid.NewUlid().ToString(),
            CustomerId = customerId ?? "test-customer",
            Status = status,
            Lines = lines ?? [new OrderLine("prod-1", "Test Product", 1, total)],
            CreatedAt = DateTimeOffset.UtcNow
        };
    }
}
```

## CI Configuration

```yaml
# .github/workflows/test.yml
- name: Test
  run: dotnet test --configuration Release --logger trx --collect:"XPlat Code Coverage"

- name: Publish Coverage
  uses: codecov/codecov-action@v4
  with:
    files: "**/coverage.cobertura.xml"
```

## Test Organization

```
tests/
├── UnitTests/
│   ├── Services/
│   │   └── OrderServiceTests.cs
│   ├── Models/
│   │   └── MoneyTests.cs
│   └── Helpers/
│       └── TestData.cs
├── IntegrationTests/
│   ├── Api/
│   │   └── OrderApiTests.cs
│   └── Repositories/
│       └── PostgresOrderRepositoryTests.cs
└── ArchitectureTests/
    └── DependencyTests.cs  # Verify layer boundaries with NetArchTest
```
