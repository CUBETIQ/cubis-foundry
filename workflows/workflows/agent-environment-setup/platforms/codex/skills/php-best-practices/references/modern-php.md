# Modern PHP Features Reference

## Property Hooks (PHP 8.4)

Property hooks replace magic `__get`/`__set` with type-safe, per-property logic that the engine optimizes.

### Get hooks for computed properties

```php
<?php declare(strict_types=1);

class Temperature
{
    public float $fahrenheit {
        get => $this->celsius * 9 / 5 + 32;
    }

    public function __construct(
        public float $celsius,
    ) {}
}

$t = new Temperature(100.0);
echo $t->fahrenheit; // 212.0
```

### Set hooks for validation

```php
<?php declare(strict_types=1);

class UserProfile
{
    public string $email {
        set {
            if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                throw new \InvalidArgumentException("Invalid email: {$value}");
            }
            $this->email = strtolower($value);
        }
    }

    public int $age {
        set {
            if ($value < 0 || $value > 150) {
                throw new \RangeException("Age must be 0-150, got: {$value}");
            }
            $this->age = $value;
        }
    }

    public function __construct(string $email, int $age)
    {
        $this->email = $email;
        $this->age = $age;
    }
}
```

### Get + set combined

```php
<?php declare(strict_types=1);

class Product
{
    private int $priceInCents;

    public float $price {
        get => $this->priceInCents / 100;
        set => $this->priceInCents = (int) round($value * 100);
    }
}
```

## Asymmetric Visibility (PHP 8.4)

Control read and write access independently.

```php
<?php declare(strict_types=1);

class Order
{
    // Readable by anyone, writable only by this class
    public private(set) OrderStatus $status;

    // Readable by anyone, writable by this class and subclasses
    public protected(set) \DateTimeImmutable $updatedAt;

    public function __construct(
        public readonly string $id,
        public readonly string $customerId,
    ) {
        $this->status = OrderStatus::Pending;
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function confirm(): void
    {
        $this->status = OrderStatus::Confirmed;
        $this->updatedAt = new \DateTimeImmutable();
    }
}

// External code:
$order->status;          // OK — public read
$order->status = 'x';   // ERROR — private set
$order->confirm();       // OK — mutates via method
```

## Enums

### Backed enums

```php
<?php declare(strict_types=1);

enum Currency: string
{
    case USD = 'USD';
    case EUR = 'EUR';
    case GBP = 'GBP';
    case THB = 'THB';

    public function symbol(): string
    {
        return match ($this) {
            self::USD => '$',
            self::EUR => '€',
            self::GBP => '£',
            self::THB => '฿',
        };
    }

    public function minorUnits(): int
    {
        return match ($this) {
            self::USD, self::EUR, self::GBP => 2,
            self::THB => 2,
        };
    }
}

// From string
$currency = Currency::from('USD');        // throws on invalid
$currency = Currency::tryFrom('INVALID'); // returns null
```

### Enums implementing interfaces

```php
<?php declare(strict_types=1);

interface HasLabel
{
    public function label(): string;
}

enum OrderStatus: string implements HasLabel
{
    case Pending = 'pending';
    case Processing = 'processing';
    case Shipped = 'shipped';
    case Delivered = 'delivered';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Awaiting Processing',
            self::Processing => 'Being Prepared',
            self::Shipped => 'In Transit',
            self::Delivered => 'Delivered',
        };
    }

    /** @return list<self> */
    public static function activeStatuses(): array
    {
        return [self::Pending, self::Processing, self::Shipped];
    }
}
```

### Enum in match expressions

```php
<?php declare(strict_types=1);

function calculateShippingDays(OrderStatus $status): ?int
{
    return match ($status) {
        OrderStatus::Pending => null,
        OrderStatus::Processing => 3,
        OrderStatus::Shipped => 1,
        OrderStatus::Delivered => 0,
    };
}
```

## Match Expression

`match` is strict-comparison (`===`), returns a value, and requires exhaustive handling.

```php
<?php declare(strict_types=1);

// Returns a value — no fall-through
$result = match (true) {
    $age < 13 => 'child',
    $age < 18 => 'teen',
    $age < 65 => 'adult',
    default => 'senior',
};

// Multi-condition arms
$icon = match ($fileType) {
    'jpg', 'jpeg', 'png', 'gif', 'webp' => 'image',
    'pdf' => 'document',
    'mp4', 'webm' => 'video',
    default => 'file',
};

// No match throws UnhandledMatchError — forces exhaustive handling
```

## Named Arguments

```php
<?php declare(strict_types=1);

// Clarify intent for multi-parameter calls
$user = new User(
    name: 'Alice',
    email: 'alice@example.com',
    role: Role::Admin,
    isActive: true,
);

// Skip optional parameters
function createNotification(
    string $message,
    string $channel = 'email',
    int $priority = 5,
    bool $immediate = false,
): Notification { /* ... */ }

createNotification(
    message: 'Order shipped',
    immediate: true,
    // $channel and $priority use defaults
);
```

## First-Class Callable Syntax

```php
<?php declare(strict_types=1);

// Create closures from existing functions
$trimmed = array_map(trim(...), $strings);

// Works with methods
$names = array_map($user->getName(...), $users);

// Works with static methods
$filtered = array_filter($items, Product::isActive(...));
```

## Readonly Classes

```php
<?php declare(strict_types=1);

// All properties are implicitly readonly
readonly class Address
{
    public function __construct(
        public string $street,
        public string $city,
        public string $state,
        public string $zip,
        public string $country,
    ) {}

    public function withCity(string $city): self
    {
        // Immutable — return new instance
        return new self(
            street: $this->street,
            city: $city,
            state: $this->state,
            zip: $this->zip,
            country: $this->country,
        );
    }
}
```

## Fibers

Fibers provide cooperative multitasking — suspend and resume execution at explicit points.

```php
<?php declare(strict_types=1);

// Low-level fiber usage (prefer libraries like Revolt/AMPHP)
$fiber = new Fiber(function (): void {
    $value = Fiber::suspend('first');
    echo "Resumed with: {$value}\n";
    Fiber::suspend('second');
});

$result1 = $fiber->start();     // 'first'
$result2 = $fiber->resume('hello'); // prints "Resumed with: hello", returns 'second'
```

### Practical use: async I/O with Revolt event loop

```php
<?php declare(strict_types=1);

use Revolt\EventLoop;

// Non-blocking HTTP fetch
function fetchAsync(string $url): string
{
    $suspension = EventLoop::getSuspension();

    $client = new HttpClient();
    $client->requestAsync($url, function (string $body) use ($suspension) {
        $suspension->resume($body);
    });

    return $suspension->suspend(); // Fiber suspends until response arrives
}

// Both fetches run concurrently on the event loop
EventLoop::queue(function () {
    $users = fetchAsync('https://api.example.com/users');
    $orders = fetchAsync('https://api.example.com/orders');
    processData($users, $orders);
});

EventLoop::run();
```

## DNF Types (Disjunctive Normal Form)

Combine union and intersection types:

```php
<?php declare(strict_types=1);

// (A&B)|C — type must be (both A and B) or C
function process((Countable&Iterator)|array $input): int
{
    if (is_array($input)) {
        return count($input);
    }
    return $input->count();
}
```
