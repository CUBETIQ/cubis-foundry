# Security Reference

## Authentication

### Sanctum (API Token Authentication)

Sanctum is the default Laravel API authentication package. Use it for SPA
authentication (cookie-based) and mobile API tokens.

```php
// Install and configure
// bootstrap/app.php already includes Sanctum in Laravel 11

// Protecting routes
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('orders', OrderController::class);
});

// Issuing tokens
$token = $user->createToken('api-access', ['orders:read', 'orders:write']);
return ['token' => $token->plainTextToken];

// Checking abilities
if ($user->tokenCan('orders:write')) {
    // proceed
}

// Revoking tokens
$user->currentAccessToken()->delete();   // Current token
$user->tokens()->delete();               // All tokens
```

### Rate Limiting Authentication Endpoints

Always rate limit login and registration to prevent credential stuffing.

```php
RateLimiter::for('login', function (Request $request) {
    $key = Str::lower($request->input('email')) . '|' . $request->ip();
    return Limit::perMinute(5)->by($key);
});

Route::post('login', LoginController::class)
    ->middleware('throttle:login');
```

## Authorization

### Policies

Define one Policy per model. Register policies via auto-discovery (Laravel 11
auto-discovers policies in `app/Policies` matching model names).

```php
<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function viewAny(User $user): bool
    {
        return true; // Authenticated users can list their orders
    }

    public function view(User $user, Order $order): bool
    {
        return $user->id === $order->customer->user_id;
    }

    public function create(User $user): bool
    {
        return $user->hasVerifiedEmail();
    }

    public function update(User $user, Order $order): bool
    {
        return $user->id === $order->customer->user_id
            && $order->status === 'pending';
    }

    public function delete(User $user, Order $order): bool
    {
        return $user->id === $order->customer->user_id
            && $order->status === 'pending';
    }
}
```

### Using Policies in Controllers

```php
public function show(Order $order): OrderResource
{
    $this->authorize('view', $order);
    return new OrderResource($order->load('items.product'));
}

// Or in Form Requests
public function authorize(): bool
{
    $order = $this->route('order');
    return $this->user()->can('update', $order);
}
```

## Input Sanitization

### Mass Assignment Protection

Always use `$fillable` (allow-list) instead of `$guarded` (deny-list).

```php
// GOOD: explicit allow-list
protected $fillable = ['name', 'email', 'phone'];

// BAD: easy to forget new sensitive columns
protected $guarded = ['id', 'is_admin'];
```

### Validation Rules for Security

```php
public function rules(): array
{
    return [
        'email'    => ['required', 'email:rfc,dns', 'max:255'],
        'password' => ['required', Password::min(12)->mixedCase()->numbers()->symbols()],
        'url'      => ['required', 'url:https'],         // HTTPS only
        'file'     => ['required', 'file', 'mimes:pdf,docx', 'max:10240'],
        'html'     => ['required', 'string', new NoScriptTags],  // Custom rule
    ];
}
```

## CSRF Protection

CSRF protection is enabled by default for web routes. For API routes using
token authentication (Sanctum tokens, not cookies), CSRF is not needed.

For SPA authentication with Sanctum cookies, CSRF is required:

```php
// Frontend must fetch the CSRF cookie first
// GET /sanctum/csrf-cookie

// Then include the X-XSRF-TOKEN header on subsequent requests
```

## Encryption

### Encrypting Data at Rest

```php
// Using the Crypt facade
use Illuminate\Support\Facades\Crypt;

$encrypted = Crypt::encryptString($ssn);
$decrypted = Crypt::decryptString($encrypted);

// Using cast on Eloquent models
protected function casts(): array
{
    return [
        'ssn'     => 'encrypted',
        'api_key' => 'encrypted',
    ];
}
```

### Hashing Passwords

Laravel hashes passwords automatically with `bcrypt` by default. Use `argon2id`
for higher security when hardware supports it.

```php
// config/hashing.php
'driver' => 'argon2id',

// Manual hashing
use Illuminate\Support\Facades\Hash;

$hashed = Hash::make($password);
$valid = Hash::check($password, $hashed);
```

## Security Headers

Apply security headers via middleware.

```php
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-XSS-Protection', '0');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=()');
        $response->headers->set(
            'Strict-Transport-Security',
            'max-age=63072000; includeSubDomains; preload'
        );

        return $response;
    }
}
```

## Environment and Secrets

- Store secrets in `.env` and never commit `.env` to version control.
- Use `config()` helper to access env values. Never call `env()` outside config files.
- Use Laravel's encrypted environment files for production secrets.
- Rotate `APP_KEY` periodically and re-encrypt stored data.

```bash
# Encrypt .env for production
php artisan env:encrypt --env=production

# Decrypt at deploy time
php artisan env:decrypt --env=production --key=base64:...
```

## SQL Injection Prevention

Always use Eloquent or the query builder with parameter binding. Never
concatenate user input into raw SQL.

```php
// SAFE: parameter binding
DB::select('SELECT * FROM users WHERE email = ?', [$email]);
User::where('email', $email)->first();

// DANGEROUS: string concatenation
DB::select("SELECT * FROM users WHERE email = '$email'"); // NEVER
```
