# PHP Type System Reference

## Strict Types Enforcement

### declare(strict_types=1)

Without strict types, PHP silently coerces arguments:

```php
<?php
// Without strict_types — silent coercion
function addInts(int $a, int $b): int { return $a + $b; }
echo addInts("3", "4"); // 7 — string silently converted to int
echo addInts("3.9", "4"); // 7 — decimal part silently truncated!

// With strict_types — TypeError thrown
<?php declare(strict_types=1);
echo addInts("3", "4"); // TypeError: must be int, string given
```

Strict types applies to the **calling file**, not the declaring file. Every file must have the declaration.

### Automation

```json
// PHP CS Fixer configuration
{
    "rules": {
        "declare_strict_types": true
    }
}
```

## Type Declaration Reference

### Scalar types

| Type | Description | Example |
| --- | --- | --- |
| `int` | Integer | `function count(): int` |
| `float` | Floating point | `function average(): float` |
| `string` | String | `function name(): string` |
| `bool` | Boolean | `function isActive(): bool` |

### Special types

| Type | Description | Use when |
| --- | --- | --- |
| `void` | No return value | Side-effect methods |
| `never` | Never returns (throws/exits) | Error handlers, redirects |
| `null` | Null value | Standalone: `function reset(): null` |
| `mixed` | Any type | Avoid — defeats analysis |
| `self` | Current class | Return type in fluent interfaces |
| `static` | Late static bound | Factory methods in inheritance |
| `parent` | Parent class | Overridden method delegation |

### Compound types

```php
<?php declare(strict_types=1);

// Union type — either type
function parseId(string|int $id): string { /* ... */ }

// Intersection type — must satisfy both
function processCollection(Countable&Iterator $items): void { /* ... */ }

// Nullable — shorthand for Type|null
function findUser(string $id): ?User { /* ... */ }

// DNF type (PHP 8.2+)
function handle((Stringable&Countable)|string $input): string { /* ... */ }
```

## Readonly Properties and Classes

### Readonly properties

```php
<?php declare(strict_types=1);

class UserId
{
    public readonly string $value;

    public function __construct(string $value)
    {
        if (trim($value) === '') {
            throw new \InvalidArgumentException('UserId cannot be empty');
        }
        $this->value = $value;
        // After construction, $this->value cannot be reassigned
    }
}
```

### Constructor promotion with readonly

```php
<?php declare(strict_types=1);

readonly class Coordinate
{
    public function __construct(
        public float $latitude,
        public float $longitude,
    ) {
        if ($latitude < -90 || $latitude > 90) {
            throw new \RangeException("Invalid latitude: {$latitude}");
        }
        if ($longitude < -180 || $longitude > 180) {
            throw new \RangeException("Invalid longitude: {$longitude}");
        }
    }

    public function distanceTo(self $other): float
    {
        // Haversine formula
        $dlat = deg2rad($other->latitude - $this->latitude);
        $dlon = deg2rad($other->longitude - $this->longitude);
        $a = sin($dlat / 2) ** 2 +
             cos(deg2rad($this->latitude)) * cos(deg2rad($other->latitude)) *
             sin($dlon / 2) ** 2;
        return 6371 * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}
```

### Readonly class rules

- All properties are implicitly readonly.
- Cannot have untyped properties (all must have type declarations).
- Cannot use `static` properties.
- Dynamic properties are forbidden.

## PHPStan Generics

PHP's native type system lacks generics. PHPStan fills the gap with annotations.

### Generic classes

```php
<?php declare(strict_types=1);

/**
 * @template T
 */
final class TypedCollection
{
    /** @var list<T> */
    private array $items = [];

    /**
     * @param T $item
     */
    public function add(mixed $item): void
    {
        $this->items[] = $item;
    }

    /**
     * @return T
     * @throws \UnderflowException
     */
    public function first(): mixed
    {
        if ($this->items === []) {
            throw new \UnderflowException('Collection is empty');
        }
        return $this->items[0];
    }

    /**
     * @template U
     * @param callable(T): U $mapper
     * @return TypedCollection<U>
     */
    public function map(callable $mapper): self
    {
        $result = new self();
        foreach ($this->items as $item) {
            $result->add($mapper($item));
        }
        return $result;
    }
}

// Usage — PHPStan tracks the type parameter
/** @var TypedCollection<User> */
$users = new TypedCollection();
$users->add(new User('Alice')); // OK
$users->add(new Order());       // PHPStan error: Order is not User

$names = $users->map(fn(User $u) => $u->name); // TypedCollection<string>
```

### Generic interfaces

```php
<?php declare(strict_types=1);

/**
 * @template TEntity of object
 * @template TId
 */
interface RepositoryInterface
{
    /** @param TId $id */
    public function findById(mixed $id): ?object;

    /** @param TEntity $entity */
    public function save(object $entity): void;
}

/**
 * @implements RepositoryInterface<User, UserId>
 */
class UserRepository implements RepositoryInterface
{
    public function findById(mixed $id): ?User { /* ... */ }
    public function save(object $entity): void { /* ... */ }
}
```

## PHPStan Configuration

### Level descriptions

| Level | Checks |
| --- | --- |
| 0 | Basic checks, unknown classes, wrong arguments |
| 1 | Possibly undefined variables, unknown methods on `$this` |
| 2-3 | Unknown methods on all expressions, return types |
| 4-5 | Dead code, always-true/false conditions |
| 6 | Missing typehints |
| 7 | Union types resolved |
| 8 | Method calls on nullable types |
| 9 (max) | Mixed type restrictions |

### Recommended configuration

```neon
# phpstan.neon.dist
parameters:
    level: 9
    paths:
        - src
    excludePaths:
        - src/Legacy/*
    tmpDir: .phpstan-cache
    checkMissingIterableValueType: true
    checkGenericClassInNonGenericObjectType: true
    reportUnmatchedIgnoredErrors: true
```

### Baseline for legacy code

```bash
# Generate baseline of existing errors to fix incrementally
vendor/bin/phpstan analyse --generate-baseline phpstan-baseline.neon

# Include baseline in config
includes:
    - phpstan-baseline.neon
```

## Type Narrowing

### instanceof narrowing

```php
<?php declare(strict_types=1);

function processPayment(PaymentMethod $method): PaymentResult
{
    return match (true) {
        $method instanceof CreditCard => processCreditCard($method),
        $method instanceof BankTransfer => processBankTransfer($method),
        $method instanceof DigitalWallet => processDigitalWallet($method),
        default => throw new \UnexpectedValueException(
            'Unknown payment method: ' . $method::class
        ),
    };
}
```

### Assert functions for PHPStan

```php
<?php declare(strict_types=1);

/**
 * @phpstan-assert !null $value
 * @throws \RuntimeException
 */
function assertNotNull(mixed $value, string $message = ''): void
{
    if ($value === null) {
        throw new \RuntimeException($message ?: 'Unexpected null value');
    }
}

$user = $repository->findById($id);
assertNotNull($user, "User {$id} not found");
// PHPStan knows $user is non-null after this line
echo $user->name;
```
