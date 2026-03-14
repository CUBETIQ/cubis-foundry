# Example: API Resource with Eloquent Relationships

## Scenario

Build a JSON API endpoint that returns orders with nested customer and line-item data. The response must avoid N+1 queries and hide internal database columns from the public contract.

## Models

```php
// app/Models/Order.php
<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;

    protected $fillable = ['customer_id', 'status', 'total_cents'];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
```

```php
// app/Models/OrderItem.php
<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = ['order_id', 'product_id', 'quantity', 'unit_price_cents'];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
```

## API Resources

```php
// app/Http/Resources/OrderItemResource.php
<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'product_name'    => $this->product->name,
            'quantity'        => $this->quantity,
            'unit_price'      => $this->unit_price_cents / 100,
            'line_total'      => ($this->unit_price_cents * $this->quantity) / 100,
        ];
    }
}
```

```php
// app/Http/Resources/OrderResource.php
<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'status'        => $this->status,
            'total'         => $this->total_cents / 100,
            'customer'      => [
                'id'   => $this->customer->id,
                'name' => $this->customer->name,
            ],
            'items'         => OrderItemResource::collection($this->items),
            'created_at'    => $this->created_at->toIso8601String(),
        ];
    }
}
```

## Controller

```php
// app/Http/Controllers/Api/OrderController.php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrderController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $orders = Order::with(['customer', 'items.product'])
            ->latest()
            ->paginate(25);

        return OrderResource::collection($orders);
    }

    public function show(Order $order): OrderResource
    {
        $order->load(['customer', 'items.product']);

        return new OrderResource($order);
    }
}
```

## Route Registration

```php
// routes/api.php
use App\Http\Controllers\Api\OrderController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('orders', OrderController::class)->only(['index', 'show']);
});
```

## Key Decisions

- **Eager loading**: `with(['customer', 'items.product'])` eliminates N+1 queries across three relationship levels.
- **Resource isolation**: `OrderResource` and `OrderItemResource` control exactly which fields reach the client, decoupling the API contract from the database schema.
- **Pagination**: `paginate(25)` prevents unbounded result sets. The resource collection automatically includes pagination metadata.
- **Sanctum middleware**: Protects the endpoint. Replace with `auth:api` if using Passport.
