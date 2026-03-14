# PHP Testing Reference

## PHPUnit Setup

### Installation and configuration

```json
{
    "require-dev": {
        "phpunit/phpunit": "^11.0"
    }
}
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- phpunit.xml.dist -->
<phpunit
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
    bootstrap="vendor/autoload.php"
    colors="true"
    cacheDirectory=".phpunit.cache"
    executionOrder="depends,defects"
    failOnWarning="true"
    failOnRisky="true"
    beStrictAboutOutputDuringTests="true"
>
    <testsuites>
        <testsuite name="Unit">
            <directory>tests/Unit</directory>
        </testsuite>
        <testsuite name="Integration">
            <directory>tests/Integration</directory>
        </testsuite>
    </testsuites>
    <source>
        <include>
            <directory>src</directory>
        </include>
    </source>
</phpunit>
```

### Basic test structure

```php
<?php declare(strict_types=1);

namespace App\Tests\Unit\Domain;

use App\Domain\ValueObject\Money;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class MoneyTest extends TestCase
{
    #[Test]
    public function it_adds_same_currency(): void
    {
        $a = new Money(1000, 'USD');
        $b = new Money(2500, 'USD');

        $result = $a->add($b);

        self::assertSame(3500, $result->amount);
        self::assertSame('USD', $result->currency);
    }

    #[Test]
    public function it_rejects_different_currencies(): void
    {
        $a = new Money(1000, 'USD');
        $b = new Money(1000, 'EUR');

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Cannot combine USD with EUR');

        $a->add($b);
    }
}
```

## Data Providers

### Attribute-based data providers (PHP 8+)

```php
<?php declare(strict_types=1);

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;

final class EmailValidatorTest extends TestCase
{
    #[Test]
    #[DataProvider('validEmails')]
    public function it_accepts_valid_emails(string $email): void
    {
        $validator = new EmailValidator();
        self::assertTrue($validator->isValid($email));
    }

    #[Test]
    #[DataProvider('invalidEmails')]
    public function it_rejects_invalid_emails(string $email, string $reason): void
    {
        $validator = new EmailValidator();
        self::assertFalse($validator->isValid($email), $reason);
    }

    /** @return iterable<string, array{string}> */
    public static function validEmails(): iterable
    {
        yield 'standard' => ['user@example.com'];
        yield 'subdomain' => ['user@sub.example.com'];
        yield 'plus addressing' => ['user+tag@example.com'];
        yield 'dotted local' => ['first.last@example.com'];
    }

    /** @return iterable<string, array{string, string}> */
    public static function invalidEmails(): iterable
    {
        yield 'no at sign' => ['userexample.com', 'Missing @ symbol'];
        yield 'no domain' => ['user@', 'Missing domain'];
        yield 'no local part' => ['@example.com', 'Missing local part'];
        yield 'spaces' => ['user @example.com', 'Contains spaces'];
        yield 'empty string' => ['', 'Empty string'];
    }
}
```

### Complex data providers with objects

```php
<?php declare(strict_types=1);

/** @return iterable<string, array{Order, Discount}> */
public static function discountScenarios(): iterable
{
    yield 'premium customer over threshold' => [
        new Order(total: 15000, customerTier: CustomerTier::Premium),
        new Discount(percentage: 15, reason: 'Premium loyalty discount'),
    ];

    yield 'standard customer no discount' => [
        new Order(total: 5000, customerTier: CustomerTier::Standard),
        new Discount(percentage: 0, reason: 'No applicable discount'),
    ];
}
```

## Mocking

### PHPUnit built-in mocks

```php
<?php declare(strict_types=1);

#[Test]
public function it_saves_order_on_checkout(): void
{
    $repository = $this->createMock(OrderRepositoryInterface::class);
    $repository->expects($this->once())
        ->method('save')
        ->with($this->callback(fn(Order $order) =>
            $order->status === OrderStatus::Pending
            && $order->total->amount === 2999
        ));

    $service = new CheckoutService($repository);
    $service->checkout($this->createCart());
}
```

### Mockery (more expressive)

```php
<?php declare(strict_types=1);

use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;

final class NotificationServiceTest extends TestCase
{
    use MockeryPHPUnitIntegration;

    #[Test]
    public function it_sends_email_for_high_priority_orders(): void
    {
        $mailer = Mockery::mock(MailerInterface::class);
        $mailer->shouldReceive('send')
            ->once()
            ->with(Mockery::on(fn(Email $e) =>
                str_contains($e->subject, 'High Priority')
            ));

        $service = new NotificationService($mailer);
        $service->notify(new OrderEvent(priority: Priority::High));
    }
}
```

### Spy pattern

```php
<?php declare(strict_types=1);

#[Test]
public function it_logs_failed_payment_attempts(): void
{
    $logger = Mockery::spy(LoggerInterface::class);
    $gateway = Mockery::mock(PaymentGateway::class);
    $gateway->shouldReceive('charge')->andThrow(new PaymentFailedException());

    $service = new PaymentService($gateway, $logger);

    try {
        $service->processPayment($this->createPayment());
    } catch (PaymentFailedException) {
        // expected
    }

    $logger->shouldHaveReceived('error')
        ->with(Mockery::pattern('/payment failed/i'), Mockery::type('array'));
}
```

## Pest Framework

Pest provides a more expressive, functional syntax built on top of PHPUnit.

### Basic Pest tests

```php
<?php declare(strict_types=1);

it('creates a user with default role', function () {
    $user = new User(name: 'Alice', email: 'alice@example.com');

    expect($user->role)->toBe(Role::Member);
    expect($user->isActive)->toBeTrue();
});

it('rejects invalid email addresses', function (string $email) {
    expect(fn() => new User(name: 'Test', email: $email))
        ->toThrow(\InvalidArgumentException::class);
})->with([
    'empty' => [''],
    'no at' => ['invalid'],
    'no domain' => ['user@'],
]);
```

### Pest datasets

```php
<?php declare(strict_types=1);

dataset('currencies', [
    'USD' => [Currency::USD, '$'],
    'EUR' => [Currency::EUR, '€'],
    'GBP' => [Currency::GBP, '£'],
]);

it('formats currency with correct symbol', function (Currency $currency, string $symbol) {
    expect($currency->symbol())->toBe($symbol);
})->with('currencies');
```

## Test Architecture

### Directory structure

```
tests/
├── Unit/
│   ├── Domain/
│   │   ├── ValueObject/
│   │   │   ├── MoneyTest.php
│   │   │   └── ProductIdTest.php
│   │   └── Entity/
│   │       └── ProductTest.php
│   ├── Application/
│   │   └── InventoryServiceTest.php
│   └── Helpers/
│       └── TestDataFactory.php
├── Integration/
│   ├── Repository/
│   │   └── PdoProductRepositoryTest.php
│   └── Api/
│       └── ProductApiTest.php
└── Pest.php  (or bootstrap.php)
```

### Test data factories

```php
<?php declare(strict_types=1);

final class TestDataFactory
{
    public static function createProduct(
        ?string $id = null,
        ?string $name = null,
        int $priceInCents = 9999,
        int $stockLevel = 100,
        ProductStatus $status = ProductStatus::Active,
    ): Product {
        return new Product(
            id: new ProductId($id ?? self::uuid()),
            name: $name ?? 'Test Product',
            sku: 'TEST-' . random_int(1000, 9999),
            price: new Money($priceInCents, 'USD'),
            stockLevel: new Quantity($stockLevel),
            baseStatus: $status,
        );
    }

    private static function uuid(): string
    {
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            random_int(0, 0xffff), random_int(0, 0xffff),
            random_int(0, 0xffff), random_int(0, 0x0fff) | 0x4000,
            random_int(0, 0x3fff) | 0x8000,
            random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff));
    }
}
```

## CI Configuration

```yaml
# .github/workflows/test.yml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        php: ['8.4']

    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: ${{ matrix.php }}
          coverage: xdebug

      - run: composer install --no-progress
      - run: vendor/bin/phpstan analyse
      - run: vendor/bin/phpunit --coverage-clover coverage.xml

      - uses: codecov/codecov-action@v4
        with:
          files: coverage.xml
```

## Testing Anti-patterns

| Anti-pattern | Fix |
| --- | --- |
| Testing private methods directly | Test through public API |
| Mocking the class under test | Mock only dependencies |
| Testing framework internals | Test your behavior, not Laravel/Symfony |
| Copy-paste test methods | Use data providers |
| Relying on execution order | Each test is independent |
| Testing trivial getters/setters | Test behavior, not structure |
