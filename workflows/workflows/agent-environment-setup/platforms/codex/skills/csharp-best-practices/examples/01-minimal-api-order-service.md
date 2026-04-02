# Example: Minimal API Order Service with Records and TypedResults

## Scenario

Build a .NET 9 minimal API for an order management service. The API supports creating orders, fetching by ID, listing with pagination, and cancelling orders. Uses records for DTOs, TypedResults for compile-time contracts, and proper DI lifetimes.

## Project Structure

```
OrderService/
├── Program.cs
├── Models/
│   ├── Order.cs
│   ├── OrderLine.cs
│   └── OrderStatus.cs
├── Contracts/
│   ├── CreateOrderRequest.cs
│   ├── OrderResponse.cs
│   └── PagedResponse.cs
├── Services/
│   ├── IOrderService.cs
│   └── OrderService.cs
├── Repositories/
│   ├── IOrderRepository.cs
│   └── OrderRepository.cs
└── Endpoints/
    └── OrderEndpoints.cs
```

## Domain Records

```csharp
// Models/OrderStatus.cs
public enum OrderStatus
{
    Pending,
    Confirmed,
    Shipped,
    Delivered,
    Cancelled
}

// Models/OrderLine.cs
public readonly record struct OrderLine(
    string ProductId,
    string ProductName,
    int Quantity,
    decimal UnitPrice)
{
    public decimal Total => Quantity * UnitPrice;
}

// Models/Order.cs
public record Order
{
    public required string Id { get; init; }
    public required string CustomerId { get; init; }
    public required IReadOnlyList<OrderLine> Lines { get; init; }
    public required OrderStatus Status { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public DateTimeOffset? CancelledAt { get; init; }

    public decimal Total => Lines.Sum(l => l.Total);
}
```

## Request/Response Contracts

```csharp
// Contracts/CreateOrderRequest.cs
public record CreateOrderRequest(
    string CustomerId,
    IReadOnlyList<CreateOrderLineRequest> Lines);

public record CreateOrderLineRequest(
    string ProductId,
    string ProductName,
    int Quantity,
    decimal UnitPrice);

// Contracts/OrderResponse.cs
public record OrderResponse(
    string Id,
    string CustomerId,
    IReadOnlyList<OrderLineResponse> Lines,
    decimal Total,
    string Status,
    DateTimeOffset CreatedAt);

public record OrderLineResponse(
    string ProductId,
    string ProductName,
    int Quantity,
    decimal UnitPrice,
    decimal LineTotal);

// Contracts/PagedResponse.cs
public record PagedResponse<T>(
    IReadOnlyList<T> Items,
    int TotalCount,
    int Page,
    int PageSize,
    bool HasNextPage);
```

## Service Layer

```csharp
// Services/IOrderService.cs
public interface IOrderService
{
    Task<Order> CreateOrderAsync(CreateOrderRequest request, CancellationToken ct);
    Task<Order?> GetOrderAsync(string id, CancellationToken ct);
    Task<PagedResponse<Order>> ListOrdersAsync(string customerId, int page, int pageSize, CancellationToken ct);
    Task<Order> CancelOrderAsync(string id, CancellationToken ct);
}

// Services/OrderService.cs
public sealed class OrderService(
    IOrderRepository repository,
    TimeProvider timeProvider,
    ILogger<OrderService> logger) : IOrderService
{
    public async Task<Order> CreateOrderAsync(CreateOrderRequest request, CancellationToken ct)
    {
        var order = new Order
        {
            Id = Ulid.NewUlid().ToString(),
            CustomerId = request.CustomerId,
            Lines = request.Lines.Select(l => new OrderLine(
                l.ProductId, l.ProductName, l.Quantity, l.UnitPrice)).ToList(),
            Status = OrderStatus.Pending,
            CreatedAt = timeProvider.GetUtcNow()
        };

        await repository.SaveAsync(order, ct);
        logger.LogInformation("Order {OrderId} created for customer {CustomerId}",
            order.Id, order.CustomerId);

        return order;
    }

    public async Task<Order?> GetOrderAsync(string id, CancellationToken ct)
        => await repository.FindByIdAsync(id, ct);

    public async Task<PagedResponse<Order>> ListOrdersAsync(
        string customerId, int page, int pageSize, CancellationToken ct)
    {
        var (items, totalCount) = await repository.ListByCustomerAsync(
            customerId, page, pageSize, ct);

        return new PagedResponse<Order>(
            items, totalCount, page, pageSize,
            HasNextPage: (page * pageSize) < totalCount);
    }

    public async Task<Order> CancelOrderAsync(string id, CancellationToken ct)
    {
        var order = await repository.FindByIdAsync(id, ct)
            ?? throw new OrderNotFoundException(id);

        if (order.Status is OrderStatus.Shipped or OrderStatus.Delivered)
            throw new OrderStateException(id, order.Status, "Cannot cancel shipped/delivered orders");

        var cancelled = order with
        {
            Status = OrderStatus.Cancelled,
            CancelledAt = timeProvider.GetUtcNow()
        };

        await repository.SaveAsync(cancelled, ct);
        logger.LogInformation("Order {OrderId} cancelled", id);
        return cancelled;
    }
}
```

## Endpoint Registration with TypedResults

```csharp
// Endpoints/OrderEndpoints.cs
public static class OrderEndpoints
{
    public static void MapOrderEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/orders")
            .WithTags("Orders")
            .WithOpenApi();

        group.MapPost("/", CreateOrder);
        group.MapGet("/{id}", GetOrder);
        group.MapGet("/", ListOrders);
        group.MapPost("/{id}/cancel", CancelOrder);
    }

    static async Task<Results<Created<OrderResponse>, ValidationProblem>> CreateOrder(
        CreateOrderRequest request,
        IOrderService orderService,
        CancellationToken ct)
    {
        if (request.Lines.Count == 0)
            return TypedResults.ValidationProblem(
                new Dictionary<string, string[]>
                {
                    ["Lines"] = ["At least one order line is required"]
                });

        var order = await orderService.CreateOrderAsync(request, ct);
        var response = MapToResponse(order);
        return TypedResults.Created($"/api/orders/{order.Id}", response);
    }

    static async Task<Results<Ok<OrderResponse>, NotFound>> GetOrder(
        string id,
        IOrderService orderService,
        CancellationToken ct)
    {
        var order = await orderService.GetOrderAsync(id, ct);
        return order is not null
            ? TypedResults.Ok(MapToResponse(order))
            : TypedResults.NotFound();
    }

    static async Task<Ok<PagedResponse<OrderResponse>>> ListOrders(
        [AsParameters] ListOrdersQuery query,
        IOrderService orderService,
        CancellationToken ct)
    {
        var paged = await orderService.ListOrdersAsync(
            query.CustomerId, query.Page, query.PageSize, ct);

        var response = new PagedResponse<OrderResponse>(
            paged.Items.Select(MapToResponse).ToList(),
            paged.TotalCount, paged.Page, paged.PageSize, paged.HasNextPage);

        return TypedResults.Ok(response);
    }

    static async Task<Results<Ok<OrderResponse>, NotFound, Conflict>> CancelOrder(
        string id,
        IOrderService orderService,
        CancellationToken ct)
    {
        try
        {
            var order = await orderService.CancelOrderAsync(id, ct);
            return TypedResults.Ok(MapToResponse(order));
        }
        catch (OrderNotFoundException)
        {
            return TypedResults.NotFound();
        }
        catch (OrderStateException)
        {
            return TypedResults.Conflict();
        }
    }

    private static OrderResponse MapToResponse(Order order) => new(
        order.Id,
        order.CustomerId,
        order.Lines.Select(l => new OrderLineResponse(
            l.ProductId, l.ProductName, l.Quantity, l.UnitPrice, l.Total)).ToList(),
        order.Total,
        order.Status.ToString(),
        order.CreatedAt);
}

public record ListOrdersQuery(
    string CustomerId,
    int Page = 1,
    int PageSize = 20);
```

## DI Registration

```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddSingleton(TimeProvider.System);

var app = builder.Build();
app.MapOrderEndpoints();
app.Run();
```

## Key Decisions

- **Records everywhere** — DTOs use records for value equality and `with` expressions. `OrderLine` uses `record struct` because it is small and stack-allocatable.
- **TypedResults** — Each endpoint declares its exact return types, enabling OpenAPI generation without attributes and compile-time path verification.
- **CancellationToken propagation** — Every async method accepts and forwards the token from the HTTP request.
- **Scoped DI** — Repository and service are Scoped (per-request), matching EF Core DbContext lifetime. TimeProvider is Singleton (stateless, thread-safe).
- **Primary constructors** — `OrderService(IOrderRepository repository, ...)` uses C# 12 primary constructors for concise DI.
