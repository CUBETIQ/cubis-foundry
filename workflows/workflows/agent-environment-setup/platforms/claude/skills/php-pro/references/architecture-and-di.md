# Architecture and Dependency Injection

## Service Layer Pattern

```php
declare(strict_types=1);

// Controller — thin, delegates to service
final class OrderController
{
    public function __construct(
        private readonly OrderService $orderService,
    ) {}

    public function create(Request $request): JsonResponse
    {
        $dto = CreateOrderDto::fromRequest($request);
        $order = $this->orderService->create($dto);
        return new JsonResponse(OrderResource::from($order), 201);
    }
}

// Service — business logic, orchestrates domain objects
final class OrderService
{
    public function __construct(
        private readonly OrderRepository $orderRepository,
        private readonly PricingService $pricingService,
        private readonly EventDispatcher $events,
    ) {}

    public function create(CreateOrderDto $dto): Order
    {
        $price = $this->pricingService->calculate($dto->items);
        $order = Order::create(
            customerId: $dto->customerId,
            items: $dto->items,
            total: $price,
        );

        $this->orderRepository->save($order);
        $this->events->dispatch(new OrderCreated($order));

        return $order;
    }
}

// Repository interface — persistence contract
interface OrderRepository
{
    public function findById(int $id): ?Order;
    public function save(Order $order): void;
    /** @return list<Order> */
    public function findByCustomer(int $customerId): array;
}
```

## Value Objects

```php
// Type-safe wrappers with validation
readonly class Email
{
    public function __construct(
        public string $value,
    ) {
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException("Invalid email: $value");
        }
    }

    public function domain(): string
    {
        return substr($this->value, strpos($this->value, '@') + 1);
    }

    public function equals(self $other): bool
    {
        return strtolower($this->value) === strtolower($other->value);
    }
}

readonly class Money
{
    public function __construct(
        public int $amount,     // store in cents
        public string $currency,
    ) {
        if ($amount < 0) throw new \DomainException('Amount cannot be negative');
    }

    public function add(self $other): self
    {
        if ($this->currency !== $other->currency) {
            throw new \DomainException('Cannot add different currencies');
        }
        return new self($this->amount + $other->amount, $this->currency);
    }

    public function format(): string
    {
        return number_format($this->amount / 100, 2) . ' ' . $this->currency;
    }
}
```

## DI Container Patterns

```php
// Constructor injection (preferred)
final class NotificationService
{
    public function __construct(
        private readonly MailerInterface $mailer,
        private readonly LoggerInterface $logger,
        private readonly string $fromAddress, // primitive config via container
    ) {}
}

// Interface binding (Laravel example)
// AppServiceProvider
$this->app->bind(OrderRepository::class, EloquentOrderRepository::class);
$this->app->bind(MailerInterface::class, SmtpMailer::class);

// Singleton binding for shared instances
$this->app->singleton(CacheInterface::class, RedisCache::class);

// Factory binding for complex construction
$this->app->bind(PaymentGateway::class, function ($app) {
    return new StripeGateway(
        apiKey: config('services.stripe.secret'),
        logger: $app->make(LoggerInterface::class),
    );
});

// Symfony service configuration (services.yaml)
// services:
//     App\Service\OrderService:
//         arguments:
//             $fromAddress: '%env(MAIL_FROM)%'
//     App\Repository\OrderRepository: '@App\Infrastructure\EloquentOrderRepository'
```

## DTOs and Request Validation

```php
// DTO with factory method from request
readonly class CreateOrderDto
{
    /** @param list<OrderItemDto> $items */
    public function __construct(
        public int $customerId,
        public array $items,
        public ?string $notes = null,
    ) {}

    public static function fromRequest(Request $request): self
    {
        $validated = $request->validate([
            'customer_id' => 'required|integer|exists:customers,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:500',
        ]);

        return new self(
            customerId: $validated['customer_id'],
            items: array_map(
                fn (array $item) => new OrderItemDto(
                    productId: $item['product_id'],
                    quantity: $item['quantity'],
                ),
                $validated['items'],
            ),
            notes: $validated['notes'] ?? null,
        );
    }
}
```

## Result Objects for Expected Failures

```php
// Instead of exceptions for validation/not-found
readonly class Result
{
    private function __construct(
        public bool $success,
        public mixed $value = null,
        public ?string $error = null,
    ) {}

    public static function ok(mixed $value): self
    {
        return new self(success: true, value: $value);
    }

    public static function fail(string $error): self
    {
        return new self(success: false, error: $error);
    }
}

// Usage in service
public function transfer(int $fromId, int $toId, Money $amount): Result
{
    $from = $this->accountRepo->findById($fromId);
    if ($from === null) return Result::fail('Source account not found');

    if ($from->balance->amount < $amount->amount) {
        return Result::fail('Insufficient funds');
    }

    // ... perform transfer
    return Result::ok($transaction);
}
```

## Middleware Pattern

```php
// Middleware for cross-cutting concerns
final class RateLimitMiddleware
{
    public function __construct(
        private readonly RateLimiter $limiter,
    ) {}

    public function handle(Request $request, \Closure $next): Response
    {
        $key = $request->ip();
        if (!$this->limiter->attempt($key, maxAttempts: 60, decayMinutes: 1)) {
            return new JsonResponse(['error' => 'Too many requests'], 429);
        }
        return $next($request);
    }
}
```
