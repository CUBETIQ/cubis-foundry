# Modern PHP Features

## Enums (PHP 8.1+)

```php
// Pure enum — no backing value
enum Status {
    case Active;
    case Inactive;
    case Suspended;

    public function label(): string {
        return match($this) {
            self::Active => 'Active',
            self::Inactive => 'Inactive',
            self::Suspended => 'Suspended',
        };
    }
}

// Backed enum — string or int backing type
enum Role: string {
    case Admin = 'admin';
    case Editor = 'editor';
    case Viewer = 'viewer';

    // Create from string (throws ValueError if invalid)
    // Role::from('admin') → Role::Admin
    // Role::tryFrom('unknown') → null
}

// Enum implementing interface
interface HasPermissions {
    public function permissions(): array;
}

enum Role: string implements HasPermissions {
    case Admin = 'admin';
    case Editor = 'editor';

    public function permissions(): array {
        return match($this) {
            self::Admin => ['read', 'write', 'delete', 'manage'],
            self::Editor => ['read', 'write'],
        };
    }
}
```

## Readonly Properties and Classes (PHP 8.2+)

```php
// Readonly properties — set once, never modified
class User {
    public function __construct(
        public readonly int $id,
        public readonly string $name,
        public readonly Email $email,
        public readonly \DateTimeImmutable $createdAt = new \DateTimeImmutable(),
    ) {}
}

// Readonly class — all properties are implicitly readonly
readonly class Money {
    public function __construct(
        public int $amount,
        public string $currency,
    ) {}

    public function add(Money $other): self {
        if ($this->currency !== $other->currency) {
            throw new \DomainException('Cannot add different currencies');
        }
        return new self($this->amount + $other->amount, $this->currency);
    }
}
```

## Match Expression (PHP 8.0+)

```php
// match is strict (===), returns a value, no fall-through
$result = match($status) {
    200, 201 => 'success',
    301, 302 => 'redirect',
    404      => 'not found',
    500      => 'server error',
    default  => 'unknown',
};

// match with no subject — replaces if/elseif chains
$tier = match(true) {
    $points >= 1000 => 'gold',
    $points >= 500  => 'silver',
    $points >= 100  => 'bronze',
    default         => 'standard',
};
```

## Named Arguments (PHP 8.0+)

```php
// Skip optional parameters, improve readability
$response = new JsonResponse(
    data: $payload,
    status: 201,
    headers: ['X-Request-Id' => $requestId],
);

// Useful with functions that have many options
str_contains(haystack: $input, needle: 'search');

// Named arguments work with arrays using spread
$args = ['data' => $payload, 'status' => 200];
$response = new JsonResponse(...$args);
```

## Fibers (PHP 8.1+)

```php
// Fibers provide cooperative multitasking — used by frameworks, not typically by userland
$fiber = new Fiber(function (): void {
    $value = Fiber::suspend('first');
    echo "Resumed with: $value\n";
    Fiber::suspend('second');
});

$result1 = $fiber->start();     // 'first'
$result2 = $fiber->resume('hello'); // prints "Resumed with: hello", returns 'second'

// Real-world: async frameworks (ReactPHP, Amp, Revolt) use fibers internally
// You typically use the framework's async API, not raw fibers
```

## First-Class Callable Syntax (PHP 8.1+)

```php
// Create closures from existing functions/methods
$users = array_filter($users, strlen(...)); // passes strlen as callable
$names = array_map($user->getName(...), $users);

// Method references
$validator = $this->validate(...);
$formatter = NumberFormatter::format(...);
```

## Intersection and Union Types

```php
// Union types (PHP 8.0) — value is one of the types
function process(string|int $value): string|false {
    // ...
}

// Intersection types (PHP 8.1) — value satisfies all types
function countAndIterate(Countable&Iterator $items): void {
    echo count($items);
    foreach ($items as $item) { /* ... */ }
}

// Disjunctive Normal Form types (PHP 8.2)
function handle((Countable&Iterator)|null $items): void {
    // nullable intersection type
}
```

## Property Hooks (PHP 8.4)

```php
// Virtual properties with get/set hooks
class Temperature {
    public float $celsius {
        get => ($this->fahrenheit - 32) * 5 / 9;
        set => $this->fahrenheit = $value * 9 / 5 + 32;
    }

    public function __construct(
        public float $fahrenheit,
    ) {}
}

// Asymmetric visibility (PHP 8.4)
class User {
    public function __construct(
        public private(set) string $name, // readable publicly, writable only internally
        public protected(set) int $age,
    ) {}
}
```
