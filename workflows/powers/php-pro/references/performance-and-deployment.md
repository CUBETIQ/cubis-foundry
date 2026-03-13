# Performance and Deployment

## OPcache Configuration

```ini
; php.ini — production OPcache settings
opcache.enable=1
opcache.memory_consumption=256          ; MB, adjust per app size
opcache.max_accelerated_files=20000     ; must be prime, covers most projects
opcache.validate_timestamps=0           ; NEVER check file changes in production
opcache.revalidate_freq=0               ; irrelevant when validate_timestamps=0

; JIT compilation (PHP 8.0+)
opcache.jit_buffer_size=128M
opcache.jit=1255                        ; tracing JIT — best for long-running
; Use 1205 for function-level JIT if tracing JIT causes issues

; File cache for faster restarts
opcache.file_cache='/tmp/opcache'
opcache.file_cache_consistency_checks=0 ; skip in production
```

## Preloading (PHP 7.4+)

```php
// preload.php — loaded once at server startup, shared across all requests
// Set in php.ini: opcache.preload=/app/preload.php
// opcache.preload_user=www-data

$files = [
    // Framework core classes
    __DIR__ . '/vendor/autoload.php',
    // Heavily used domain classes
    __DIR__ . '/src/Domain/Order.php',
    __DIR__ . '/src/Domain/User.php',
    __DIR__ . '/src/Service/OrderService.php',
];

foreach ($files as $file) {
    if (file_exists($file)) {
        opcache_compile_file($file);
    }
}

// Composer autoload preloading (Laravel example)
// require __DIR__ . '/vendor/autoload.php';
// (new Illuminate\Foundation\PackageManifest(...))->preload();
```

## Profiling with Xdebug

```ini
; php.ini — profiling mode
xdebug.mode=profile
xdebug.output_dir=/tmp/xdebug-profiles
xdebug.profiler_output_name=cachegrind.out.%R.%t

; Trigger-based profiling (don't profile every request)
xdebug.start_with_request=trigger
; Add ?XDEBUG_PROFILE=1 to URL or set cookie
```

```bash
# Analyze with KCachegrind/QCachegrind
kcachegrind /tmp/xdebug-profiles/cachegrind.out.*.1234567890

# Or use webgrind for browser-based analysis
```

## Profiling with Blackfire

```bash
# Install Blackfire probe + agent
# Profile a specific request
blackfire run php artisan my:command
blackfire curl https://myapp.test/api/orders

# Compare two profiles
blackfire diff profile-1-uuid profile-2-uuid

# Assertions in CI
blackfire-player run scenarios.bkf --endpoint=https://staging.myapp.com
```

## Database Query Optimization

```php
// Avoid N+1 queries — eager load relations
// BAD — N+1 queries
$orders = Order::all();
foreach ($orders as $order) {
    echo $order->customer->name; // 1 query per order
}

// GOOD — eager loading
$orders = Order::with('customer')->get(); // 2 queries total

// Use query scope for reusable filters
class Order extends Model
{
    public function scopeRecent(Builder $query): Builder
    {
        return $query->where('created_at', '>', now()->subDays(30));
    }

    public function scopeForCustomer(Builder $query, int $customerId): Builder
    {
        return $query->where('customer_id', $customerId);
    }
}

// Usage: Order::recent()->forCustomer(42)->get();
```

## Caching Patterns

```php
// Cache-aside pattern
public function getProduct(int $id): Product
{
    $cacheKey = "product:{$id}";

    return Cache::remember($cacheKey, ttl: 3600, callback: function () use ($id) {
        return $this->repository->findById($id)
            ?? throw new ProductNotFoundException($id);
    });
}

// Cache invalidation on write
public function updateProduct(int $id, UpdateProductDto $dto): Product
{
    $product = $this->repository->update($id, $dto);
    Cache::forget("product:{$id}");
    Cache::tags(['products'])->flush(); // tag-based invalidation
    return $product;
}
```

## FrankenPHP / Swoole / RoadRunner

```php
// FrankenPHP worker mode — keep application in memory
// frankenphp.yaml
worker:
    cmd: ["frankenphp", "php-server", "--worker", "public/index.php"]
    watch:
        - src/**/*.php

// Swoole HTTP server (Laravel Octane)
// Long-running process — beware of:
// 1. Static/global state leaking between requests
// 2. Memory leaks from uncollected references
// 3. Database connections staying open

// Reset state between requests
protected function resetState(): void
{
    // Clear request-scoped caches
    // Reset singleton instances that hold request state
    // Flush buffered output
}
```

## Deployment Checklist

```bash
# 1. Install production dependencies
composer install --no-dev --optimize-autoloader --classmap-authoritative

# 2. Clear and warm caches
php artisan config:cache      # Laravel
php artisan route:cache
php artisan view:cache
php artisan event:cache

# 3. Run migrations
php artisan migrate --force

# 4. OPcache reset (after deploying new code)
# Via SIGUSR2 to PHP-FPM, or cachetool:
cachetool opcache:reset

# 5. Verify
php artisan about              # check config
php artisan queue:monitor      # check workers
```

## Common Performance Anti-Patterns

| Anti-pattern                 | Impact                      | Fix                                 |
| ---------------------------- | --------------------------- | ----------------------------------- |
| N+1 queries                  | O(n) DB calls per list      | Eager loading, joins                |
| No OPcache                   | Parses PHP on every request | Enable with `validate_timestamps=0` |
| Synchronous email sending    | Blocks request for 1-5s     | Queue with jobs/workers             |
| `file_get_contents` for HTTP | No timeout, no retry        | Use Guzzle/Symfony HttpClient       |
| Storing sessions in files    | Lock contention under load  | Redis/database sessions             |
| Loading entire table         | Memory exhaustion           | Cursor/chunk processing             |
