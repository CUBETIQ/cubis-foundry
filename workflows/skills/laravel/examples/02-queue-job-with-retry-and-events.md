# Example: Queue Job with Retry Logic and Event Dispatch

## Scenario

Process a payment through a third-party API asynchronously. The job must retry with exponential backoff, notify an admin on permanent failure, and fire an event after successful payment so downstream listeners can handle side effects independently.

## Queued Job

```php
// app/Jobs/ProcessPayment.php
<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Events\PaymentCompleted;
use App\Models\Order;
use App\Notifications\PaymentFailedNotification;
use App\Services\PaymentGateway;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Throwable;

class ProcessPayment implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 5;

    public int $maxExceptions = 3;

    public int $timeout = 30;

    public function __construct(
        public readonly Order $order,
    ) {}

    /**
     * Exponential backoff: 10s, 30s, 90s, 270s, 810s.
     */
    public function backoff(): array
    {
        return [10, 30, 90, 270, 810];
    }

    public function handle(PaymentGateway $gateway): void
    {
        Log::info('Processing payment', ['order_id' => $this->order->id]);

        $result = $gateway->charge(
            amount: $this->order->total_cents,
            currency: 'usd',
            customerId: $this->order->customer->stripe_id,
        );

        $this->order->update([
            'status'             => 'paid',
            'payment_reference'  => $result->transactionId,
        ]);

        event(new PaymentCompleted($this->order));
    }

    public function failed(Throwable $exception): void
    {
        Log::error('Payment failed permanently', [
            'order_id'  => $this->order->id,
            'error'     => $exception->getMessage(),
        ]);

        $this->order->update(['status' => 'payment_failed']);

        Notification::route('mail', config('app.admin_email'))
            ->notify(new PaymentFailedNotification($this->order, $exception));
    }
}
```

## Event and Listener

```php
// app/Events/PaymentCompleted.php
<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\Order;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PaymentCompleted
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Order $order,
    ) {}
}
```

```php
// app/Listeners/SendPaymentReceipt.php
<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\PaymentCompleted;
use App\Notifications\PaymentReceiptNotification;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendPaymentReceipt implements ShouldQueue
{
    public function handle(PaymentCompleted $event): void
    {
        $event->order->customer->notify(
            new PaymentReceiptNotification($event->order)
        );
    }
}
```

## Controller Dispatch

```php
// app/Http/Controllers/Api/PaymentController.php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreatePaymentRequest;
use App\Jobs\ProcessPayment;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class PaymentController extends Controller
{
    public function store(CreatePaymentRequest $request, Order $order): JsonResponse
    {
        $this->authorize('pay', $order);

        $order->update(['status' => 'processing']);

        ProcessPayment::dispatch($order);

        return response()->json(
            ['message' => 'Payment is being processed.', 'order_id' => $order->id],
            Response::HTTP_ACCEPTED,
        );
    }
}
```

## Feature Test

```php
// tests/Feature/ProcessPaymentTest.php
<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Events\PaymentCompleted;
use App\Jobs\ProcessPayment;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class ProcessPaymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_payment_endpoint_dispatches_job(): void
    {
        Queue::fake();

        $order = Order::factory()->create(['status' => 'pending']);
        $user = $order->customer->user;

        $this->actingAs($user)
            ->postJson("/api/orders/{$order->id}/pay")
            ->assertStatus(202);

        Queue::assertPushed(ProcessPayment::class, function ($job) use ($order) {
            return $job->order->id === $order->id;
        });
    }

    public function test_successful_payment_fires_event(): void
    {
        Event::fake([PaymentCompleted::class]);

        $order = Order::factory()->create(['status' => 'processing']);

        // Simulate the job running synchronously in tests
        (new ProcessPayment($order))->handle(
            app(\App\Services\PaymentGateway::class)
        );

        Event::assertDispatched(PaymentCompleted::class, function ($event) use ($order) {
            return $event->order->id === $order->id;
        });
    }
}
```

## Key Decisions

- **Exponential backoff**: The stepped array `[10, 30, 90, 270, 810]` gives the third-party API increasing recovery time.
- **`maxExceptions = 3`**: Caps distinct exception types to avoid burning retries on the same unrecoverable error.
- **`failed()` notifies admin**: Permanent failures need human attention; logging alone is insufficient for payment processing.
- **Event decoupling**: `PaymentCompleted` lets receipt emails, inventory updates, and analytics run independently without bloating the job.
- **HTTP 202 Accepted**: The controller acknowledges the request without waiting for payment completion.
