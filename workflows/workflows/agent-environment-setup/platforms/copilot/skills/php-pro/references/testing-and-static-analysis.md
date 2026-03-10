# Testing and Static Analysis

## PHPUnit Setup

```php
// tests/Unit/Service/OrderServiceTest.php
declare(strict_types=1);

namespace Tests\Unit\Service;

use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\DataProvider;

final class OrderServiceTest extends TestCase
{
    private OrderService $sut;
    private OrderRepository&MockObject $repo;

    protected function setUp(): void
    {
        $this->repo = $this->createMock(OrderRepository::class);
        $this->sut = new OrderService($this->repo);
    }

    #[Test]
    public function getOrder_existing_returns_order(): void
    {
        $expected = new Order(id: 1, product: 'Widget');
        $this->repo
            ->expects($this->once())
            ->method('findById')
            ->with(1)
            ->willReturn($expected);

        $result = $this->sut->getOrder(1);

        $this->assertSame($expected, $result);
    }

    #[Test]
    public function getOrder_missing_throws_not_found(): void
    {
        $this->repo->method('findById')->willReturn(null);

        $this->expectException(OrderNotFoundException::class);
        $this->sut->getOrder(999);
    }
}
```

## Data Providers

```php
#[DataProvider('discountData')]
#[Test]
public function calculates_discount(string $tier, int $years, float $expected): void
{
    $customer = new Customer(tier: $tier, years: $years);
    $this->assertSame($expected, $this->sut->calculateDiscount($customer));
}

public static function discountData(): array
{
    return [
        'gold 5+ years'  => ['gold', 6, 0.20],
        'gold under 5'   => ['gold', 3, 0.15],
        'silver'         => ['silver', 1, 0.10],
        'standard'       => ['standard', 0, 0.0],
    ];
}
```

## Pest (Alternative Syntax)

```php
// tests/Feature/OrderApiTest.php
use function Pest\Laravel\postJson;
use function Pest\Laravel\assertDatabaseHas;

it('creates an order with valid data', function () {
    $response = postJson('/api/orders', [
        'product' => 'Widget',
        'quantity' => 3,
    ]);

    $response->assertCreated();
    assertDatabaseHas('orders', ['product' => 'Widget']);
});

it('rejects orders with missing product', function () {
    postJson('/api/orders', ['quantity' => 3])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['product']);
});

it('applies discount for bulk orders')
    ->with([
        [10, 0.05],
        [50, 0.10],
        [100, 0.15],
    ])
    ->expect(fn (int $qty, float $discount) =>
        $this->service->calculateDiscount($qty)
    )->toBe(fn (int $qty, float $discount) => $discount);
```

## Mocking External Dependencies

```php
// Mock HTTP client
#[Test]
public function fetches_weather_data(): void
{
    $httpClient = $this->createMock(HttpClientInterface::class);
    $httpClient->method('request')
        ->with('GET', 'https://api.weather.com/current')
        ->willReturn(new MockResponse(json_encode(['temp' => 22.5])));

    $service = new WeatherService($httpClient);
    $weather = $service->getCurrent();

    $this->assertSame(22.5, $weather->temperature);
}

// Prophecy-style mocking (alternative)
public function prophecy_example(): void
{
    $repo = $this->prophesize(UserRepository::class);
    $repo->findById(1)->willReturn(new User(id: 1, name: 'Alice'));
    $repo->findById(1)->shouldBeCalledOnce();

    $service = new UserService($repo->reveal());
    $result = $service->getUser(1);

    $this->assertSame('Alice', $result->name);
}
```

## PHPStan Configuration

```neon
# phpstan.neon
parameters:
    level: 9  # maximum strictness
    paths:
        - src
        - tests
    excludePaths:
        - src/Generated
    treatPhpDocTypesAsCertain: false
    reportUnmatchedIgnoredErrors: true

    # Custom rules
    ignoreErrors:
        - '#Call to an undefined method Mockery#'  # test mocking

includes:
    - vendor/phpstan/phpstan-phpunit/extension.neon
    - vendor/phpstan/phpstan-deprecation-rules/rules.neon
    - vendor/phpstan/phpstan-strict-rules/rules.neon
```

## Psalm Configuration

```xml
<!-- psalm.xml -->
<?xml version="1.0"?>
<psalm
    errorLevel="1"
    resolveFromConfigFile="true"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns="https://getpsalm.org/schema/config"
>
    <projectFiles>
        <directory name="src" />
        <ignoreFiles>
            <directory name="vendor" />
        </ignoreFiles>
    </projectFiles>

    <plugins>
        <pluginClass class="Psalm\PhpUnitPlugin\Plugin" />
    </plugins>
</psalm>
```

## CI Pipeline Test Commands

```bash
# Full test suite
vendor/bin/phpunit --testdox

# With coverage
XDEBUG_MODE=coverage vendor/bin/phpunit --coverage-clover coverage.xml

# Static analysis
vendor/bin/phpstan analyse --memory-limit=512M
vendor/bin/psalm --no-cache

# Code style
vendor/bin/php-cs-fixer fix --dry-run --diff
vendor/bin/phpcs --standard=PSR12 src/

# Security audit
composer audit

# Typical CI order:
# 1. composer install --no-dev=false
# 2. php-cs-fixer (format check)
# 3. phpstan/psalm (static analysis)
# 4. phpunit (tests + coverage)
# 5. composer audit (security)
```

## Test Organization

```
tests/
├── Unit/                    # Fast, isolated, mocked dependencies
│   ├── Service/
│   │   └── OrderServiceTest.php
│   ├── Domain/
│   │   └── MoneyTest.php
│   └── Validator/
│       └── EmailValidatorTest.php
├── Integration/             # Real database, real HTTP
│   ├── Repository/
│   │   └── OrderRepositoryTest.php
│   └── Api/
│       └── OrderApiTest.php
├── Fixtures/                # Shared test data
│   └── orders.json
└── phpunit.xml
```
