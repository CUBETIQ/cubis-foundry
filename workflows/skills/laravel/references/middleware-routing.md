# Middleware and Routing Reference

## Route Definition

### API Routes (Laravel 11)

Laravel 11 uses `routes/api.php` loaded by `bootstrap/app.php`. The `/api` prefix
is applied automatically.

```php
// bootstrap/app.php
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__ . '/../routes/api.php',
        apiPrefix: 'api/v1',
    )
    ->create();
```

### Resource Routes

Use `apiResource` for API-only routes (excludes `create` and `edit` form routes).

```php
Route::apiResource('orders', OrderController::class);

// Restricting to specific actions
Route::apiResource('orders', OrderController::class)
    ->only(['index', 'show', 'store']);

// Nested resources
Route::apiResource('orders.items', OrderItemController::class)
    ->shallow();
```

### Route Groups

Group routes by shared middleware, prefix, or namespace.

```php
Route::prefix('admin')
    ->middleware(['auth:sanctum', 'role:admin'])
    ->group(function () {
        Route::apiResource('users', AdminUserController::class);
        Route::post('users/{user}/impersonate', ImpersonateController::class);
    });
```

## Middleware

### Built-in Middleware (Laravel 11)

Laravel 11 consolidates middleware configuration in `bootstrap/app.php`.

```php
return Application::configure(basePath: dirname(__DIR__))
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->api(prepend: [
            EnsureJsonResponse::class,
        ]);

        $middleware->alias([
            'role'     => EnsureUserHasRole::class,
            'throttle' => ThrottleRequests::class,
        ]);

        $middleware->throttleWithRedis();
    })
    ->create();
```

### Writing Custom Middleware

```php
<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantScope
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenantId = $request->header('X-Tenant-ID');

        if (! $tenantId) {
            return response()->json(
                ['error' => 'Missing X-Tenant-ID header'],
                Response::HTTP_BAD_REQUEST,
            );
        }

        // Bind tenant context for the request lifecycle
        app()->instance('tenant.id', (int) $tenantId);

        return $next($request);
    }
}
```

### Middleware Ordering

Middleware executes in the order registered. Place authentication before
authorization, and authorization before business-logic middleware.

```
1. ThrottleRequests       — reject floods before spending auth work
2. Authenticate           — verify identity
3. EnsureTenantScope      — resolve tenant from header
4. AuthorizeTenantAccess  — verify user belongs to tenant
5. Business middleware    — logging, feature flags, etc.
```

## Rate Limiting

### Defining Rate Limiters

```php
// bootstrap/app.php or AppServiceProvider
RateLimiter::for('api', function (Request $request) {
    return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
});

RateLimiter::for('uploads', function (Request $request) {
    return $request->user()?->isPremium()
        ? Limit::perMinute(30)
        : Limit::perMinute(5);
});
```

### Applying Rate Limiters

```php
Route::middleware('throttle:api')->group(function () {
    Route::apiResource('posts', PostController::class);
});

Route::middleware('throttle:uploads')->post('files', FileUploadController::class);
```

## Request Validation

### Form Request Classes

Always use Form Request classes instead of inline validation. They centralize
validation rules, authorization checks, and custom error messages.

```php
<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Order::class);
    }

    public function rules(): array
    {
        return [
            'customer_id'               => ['required', 'exists:customers,id'],
            'items'                     => ['required', 'array', 'min:1'],
            'items.*.product_id'        => ['required', 'exists:products,id'],
            'items.*.quantity'          => ['required', 'integer', 'min:1', 'max:1000'],
            'shipping_address'          => ['required', 'string', 'max:500'],
            'notes'                     => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.required'              => 'An order must contain at least one item.',
            'items.*.product_id.exists'   => 'One or more selected products do not exist.',
        ];
    }
}
```

### Using Form Requests in Controllers

```php
public function store(StoreOrderRequest $request): OrderResource
{
    // Validation and authorization already passed
    $validated = $request->validated();

    $order = DB::transaction(function () use ($validated) {
        $order = Order::create(Arr::except($validated, 'items'));

        foreach ($validated['items'] as $item) {
            $order->items()->create($item);
        }

        return $order;
    });

    return new OrderResource($order->load('items.product'));
}
```

## Response Patterns

### Consistent JSON Responses

Use API Resources for success responses and exception handlers for errors.

```php
// Successful creation
return new OrderResource($order);
// Returns 200 with resource shape

// Accepted (async processing)
return response()->json(['message' => 'Processing'], 202);

// No content (delete)
return response()->noContent();
```

### Exception Handling

Customize exception rendering in `bootstrap/app.php` (Laravel 11).

```php
->withExceptions(function (Exceptions $exceptions) {
    $exceptions->render(function (ModelNotFoundException $e, Request $request) {
        if ($request->expectsJson()) {
            return response()->json(['error' => 'Resource not found'], 404);
        }
    });
})
```
