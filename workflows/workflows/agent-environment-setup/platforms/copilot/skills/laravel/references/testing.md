# Testing Reference

## Test Organization

### Directory Structure

```
tests/
  Feature/
    Api/
      OrderControllerTest.php
      PaymentControllerTest.php
    Jobs/
      ProcessPaymentTest.php
  Unit/
    Models/
      OrderTest.php
    Services/
      PricingServiceTest.php
```

Feature tests hit real routes through the HTTP kernel with middleware active.
Unit tests isolate a single class with mocked dependencies.

## Feature Tests

### Basic API Test

```php
<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_returns_paginated_orders(): void
    {
        $user = User::factory()->create();
        Order::factory()->count(30)->for($user->customer)->create();

        $response = $this->actingAs($user)
            ->getJson('/api/v1/orders');

        $response
            ->assertOk()
            ->assertJsonCount(25, 'data')  // default pagination
            ->assertJsonStructure([
                'data' => [['id', 'status', 'total', 'customer', 'items']],
                'links',
                'meta',
            ]);
    }

    public function test_show_returns_single_order_with_relations(): void
    {
        $order = Order::factory()->withItems(3)->create();
        $user = $order->customer->user;

        $response = $this->actingAs($user)
            ->getJson("/api/v1/orders/{$order->id}");

        $response
            ->assertOk()
            ->assertJsonPath('data.id', $order->id)
            ->assertJsonCount(3, 'data.items');
    }

    public function test_unauthenticated_user_gets_401(): void
    {
        $this->getJson('/api/v1/orders')
            ->assertUnauthorized();
    }

    public function test_user_cannot_see_other_users_orders(): void
    {
        $order = Order::factory()->create();
        $otherUser = User::factory()->create();

        $this->actingAs($otherUser)
            ->getJson("/api/v1/orders/{$order->id}")
            ->assertForbidden();
    }
}
```

### Testing JSON Structure

Use `assertJsonStructure` for shape, `assertJsonPath` for specific values,
and `assertJsonFragment` for partial matches.

```php
$response->assertJsonStructure([
    'data' => [
        'id',
        'customer' => ['id', 'name'],
        'items' => [
            '*' => ['id', 'product_name', 'quantity'],
        ],
    ],
]);

$response->assertJsonPath('data.customer.name', 'Alice');
```

## Testing Queue Jobs

### Faking the Queue

```php
use Illuminate\Support\Facades\Queue;

public function test_store_dispatches_payment_job(): void
{
    Queue::fake();

    $order = Order::factory()->create();
    $user = $order->customer->user;

    $this->actingAs($user)
        ->postJson("/api/v1/orders/{$order->id}/pay")
        ->assertAccepted();

    Queue::assertPushed(ProcessPayment::class, function ($job) use ($order) {
        return $job->order->id === $order->id;
    });

    Queue::assertPushedOn('payments', ProcessPayment::class);
}
```

### Testing Job Execution

Test the job's `handle` method directly, mocking external dependencies.

```php
public function test_process_payment_charges_customer(): void
{
    $order = Order::factory()->create(['status' => 'processing']);

    $gateway = $this->mock(PaymentGateway::class);
    $gateway->shouldReceive('charge')
        ->once()
        ->with(
            Mockery::on(fn ($args) => $args['amount'] === $order->total_cents),
        )
        ->andReturn(new PaymentResult(transactionId: 'txn_123'));

    (new ProcessPayment($order))->handle($gateway);

    $order->refresh();
    $this->assertEquals('paid', $order->status);
    $this->assertEquals('txn_123', $order->payment_reference);
}
```

## Testing Events

```php
use Illuminate\Support\Facades\Event;

public function test_payment_fires_completed_event(): void
{
    Event::fake([PaymentCompleted::class]);

    // ... trigger payment ...

    Event::assertDispatched(PaymentCompleted::class, function ($event) use ($order) {
        return $event->order->id === $order->id;
    });
}

public function test_listener_sends_receipt(): void
{
    Notification::fake();

    $event = new PaymentCompleted(Order::factory()->paid()->create());
    (new SendPaymentReceipt())->handle($event);

    Notification::assertSentTo(
        $event->order->customer,
        PaymentReceiptNotification::class,
    );
}
```

## Factories

### Relationship Factories

```php
// Create an order with a specific customer
$customer = Customer::factory()->create(['name' => 'Alice']);
$order = Order::factory()->for($customer)->create();

// Create with nested relationships
$order = Order::factory()
    ->has(OrderItem::factory()->count(3), 'items')
    ->create();

// Shorthand using magic methods
$order = Order::factory()
    ->hasItems(3)
    ->create();
```

### State Methods

```php
class OrderFactory extends Factory
{
    public function paid(): static
    {
        return $this->state([
            'status' => 'paid',
            'paid_at' => now(),
        ]);
    }

    public function cancelled(): static
    {
        return $this->state([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);
    }
}
```

## Mocking External Services

### Using Mock Facades

```php
Http::fake([
    'api.stripe.com/*' => Http::response(['id' => 'ch_123'], 200),
    '*' => Http::response('Not Found', 404),
]);
```

### Using Dependency Injection

Prefer binding a mock in the container for services injected via constructor.

```php
$mock = $this->mock(PaymentGateway::class);
$mock->shouldReceive('charge')->once()->andReturn($result);

// The controller/job will receive the mock automatically
```

## Database Testing Strategies

- **`RefreshDatabase`**: Wraps each test in a transaction and rolls back. Fast.
- **`DatabaseMigrations`**: Runs full migrate/rollback cycle. Slow but accurate.
- **`LazilyRefreshDatabase`**: Only migrates if the database is dirty. Good for
  parallel test suites.

### Asserting Database State

```php
$this->assertDatabaseHas('orders', [
    'id'     => $order->id,
    'status' => 'paid',
]);

$this->assertDatabaseMissing('orders', [
    'status' => 'pending',
]);

$this->assertDatabaseCount('order_items', 3);

$this->assertSoftDeleted('orders', ['id' => $order->id]);
```

## Pest Integration

Laravel supports Pest as an alternative to PHPUnit.

```php
// tests/Feature/Api/OrderTest.php
use App\Models\Order;
use App\Models\User;

test('index returns paginated orders', function () {
    $user = User::factory()->create();
    Order::factory()->count(30)->for($user->customer)->create();

    $this->actingAs($user)
        ->getJson('/api/v1/orders')
        ->assertOk()
        ->assertJsonCount(25, 'data');
});
```
