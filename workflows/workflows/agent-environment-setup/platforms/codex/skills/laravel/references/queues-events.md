# Queues and Events Reference

## Queue Architecture

### Queue Connections

Laravel supports multiple queue backends: Redis (recommended for production),
database, SQS, and Beanstalkd. Configure in `config/queue.php`.

```php
// .env
QUEUE_CONNECTION=redis
REDIS_QUEUE=default

// For separate priority queues
// Workers process high before default before low
// php artisan queue:work --queue=high,default,low
```

### Job Structure

```php
<?php

declare(strict_types=1);

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Queue\SerializesModels;

class SyncInventory implements ShouldQueue, ShouldBeUnique
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 60;
    public int $uniqueFor = 300; // 5 minutes

    public function __construct(
        public readonly int $productId,
    ) {}

    public function uniqueId(): string
    {
        return "sync-inventory-{$this->productId}";
    }

    public function middleware(): array
    {
        return [
            new WithoutOverlapping($this->productId),
        ];
    }

    public function handle(InventoryService $service): void
    {
        $service->syncProduct($this->productId);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('Inventory sync failed', [
            'product_id' => $this->productId,
            'error'      => $exception->getMessage(),
        ]);
    }
}
```

## Retry and Backoff Strategies

### Exponential Backoff

Return an array of seconds from the `backoff()` method. Laravel uses each value
for successive retries.

```php
public function backoff(): array
{
    return [10, 30, 90, 270]; // ~6 minutes total wait
}
```

### Rate-Limited Jobs

Throttle jobs that call rate-limited external APIs.

```php
public function middleware(): array
{
    return [
        new RateLimited('external-api'),
    ];
}

// In AppServiceProvider
RateLimiter::for('external-api', function ($job) {
    return Limit::perMinute(30);
});
```

### Circuit Breaker Pattern

Release the job back to the queue with a delay when the external service is down.

```php
public function handle(PaymentGateway $gateway): void
{
    if (! $gateway->isHealthy()) {
        $this->release(60); // Try again in 60 seconds
        return;
    }

    $gateway->charge($this->order);
}
```

## Job Batching

Process groups of jobs and react when the entire batch completes or fails.

```php
use Illuminate\Bus\Batch;
use Illuminate\Support\Facades\Bus;

$batch = Bus::batch([
    new ProcessPodcast($podcast1),
    new ProcessPodcast($podcast2),
    new ProcessPodcast($podcast3),
])
->then(function (Batch $batch) {
    Log::info('All podcasts processed');
})
->catch(function (Batch $batch, \Throwable $e) {
    Log::error('Batch failed', ['error' => $e->getMessage()]);
})
->finally(function (Batch $batch) {
    // Cleanup regardless of outcome
})
->allowFailures()
->dispatch();
```

## Events and Listeners

### Defining Events

```php
<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\Order;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderShipped
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Order $order,
    ) {}
}
```

### Defining Listeners

```php
<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\OrderShipped;
use App\Notifications\ShipmentNotification;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendShipmentNotification implements ShouldQueue
{
    public string $queue = 'notifications';

    public function handle(OrderShipped $event): void
    {
        $event->order->customer->notify(
            new ShipmentNotification($event->order)
        );
    }

    public function shouldQueue(OrderShipped $event): bool
    {
        return $event->order->customer->wants_notifications;
    }
}
```

### Auto-Discovery (Laravel 11)

Laravel 11 auto-discovers listeners by type-hinting the event in the `handle`
method. No manual registration needed.

### Dispatching Events

```php
// Using the global helper
event(new OrderShipped($order));

// Using the static method
OrderShipped::dispatch($order);

// Dispatching after database transaction commits
OrderShipped::dispatchAfterResponse($order);
```

## Horizon (Production Queue Monitoring)

### Configuration

```php
// config/horizon.php
'environments' => [
    'production' => [
        'supervisor-1' => [
            'connection' => 'redis',
            'queue'      => ['high', 'default', 'low'],
            'balance'    => 'auto',
            'minProcesses' => 1,
            'maxProcesses' => 10,
            'tries'      => 3,
            'timeout'    => 60,
        ],
    ],
],
```

### Monitoring

Access the Horizon dashboard at `/horizon`. Protect it with authorization.

```php
// AuthServiceProvider or HorizonServiceProvider
Horizon::auth(function (Request $request) {
    return $request->user()?->isAdmin();
});
```

## Scheduled Tasks

### Defining Schedules (Laravel 11)

```php
// routes/console.php
use Illuminate\Support\Facades\Schedule;

Schedule::command('orders:cleanup-stale')
    ->dailyAt('02:00')
    ->withoutOverlapping()
    ->onOneServer()
    ->emailOutputOnFailure('ops@example.com');

Schedule::job(new PruneExpiredTokens)
    ->hourly()
    ->onOneServer();
```
