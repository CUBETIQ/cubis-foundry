# Eloquent ORM Reference

## Model Definition Patterns

### Fillable vs Guarded

Always declare `$fillable` explicitly. Never rely on an empty `$guarded = []` in production
because it opens every column to mass assignment.

```php
// Correct: explicit allow-list
protected $fillable = ['name', 'email', 'role'];

// Dangerous: allows mass assignment of any column including is_admin
protected $guarded = [];
```

### Casts and Accessors

Use `$casts` for type coercion. Use Attribute accessors (Laravel 11 syntax) for
computed values that do not map to a database column.

```php
protected function casts(): array
{
    return [
        'email_verified_at' => 'datetime',
        'settings'          => 'array',
        'amount_cents'      => 'integer',
        'is_active'         => 'boolean',
    ];
}

protected function fullName(): Attribute
{
    return Attribute::make(
        get: fn () => "{$this->first_name} {$this->last_name}",
    );
}
```

## Relationships

### Defining Relationships

Always type-hint return types on relationship methods. Eloquent uses the method
return type for IDE support and static analysis.

```php
public function posts(): HasMany
{
    return $this->hasMany(Post::class);
}

public function profile(): HasOne
{
    return $this->hasOne(Profile::class);
}

public function roles(): BelongsToMany
{
    return $this->belongsToMany(Role::class)
        ->withPivot('assigned_at')
        ->withTimestamps();
}
```

### Polymorphic Relationships

Use morphTo/morphMany for tagging, commenting, and media attachment patterns.

```php
// On the Comment model
public function commentable(): MorphTo
{
    return $this->morphTo();
}

// On the Post model
public function comments(): MorphMany
{
    return $this->morphMany(Comment::class, 'commentable');
}
```

## Eager Loading

### Preventing N+1 Queries

Use `with()` at query time. Use `load()` on an existing model instance.

```php
// At query time (preferred)
$orders = Order::with(['customer', 'items.product'])->get();

// On an existing instance (e.g., route-model binding)
$order->load(['customer', 'items.product']);
```

### Constraining Eager Loads

Filter related models without affecting the parent query.

```php
$users = User::with(['posts' => function (Builder $query) {
    $query->where('published', true)->latest()->limit(5);
}])->get();
```

### Preventing Lazy Loading in Development

Add this to `AppServiceProvider::boot()` to catch N+1 queries during development.

```php
Model::preventLazyLoading(! app()->isProduction());
```

## Query Scopes

### Local Scopes

Encapsulate reusable query constraints.

```php
public function scopeActive(Builder $query): Builder
{
    return $query->where('is_active', true);
}

public function scopeCreatedAfter(Builder $query, Carbon $date): Builder
{
    return $query->where('created_at', '>=', $date);
}

// Usage
$users = User::active()->createdAfter(now()->subMonth())->get();
```

### Global Scopes

Apply constraints automatically to every query on a model. Use sparingly
because they affect all queries including relationships.

```php
protected static function booted(): void
{
    static::addGlobalScope('active', function (Builder $builder) {
        $builder->where('is_active', true);
    });
}
```

## Factories and Seeders

### Factory Definition (Laravel 11)

```php
class OrderFactory extends Factory
{
    public function definition(): array
    {
        return [
            'customer_id' => Customer::factory(),
            'status'       => fake()->randomElement(['pending', 'paid', 'shipped']),
            'total_cents'  => fake()->numberBetween(1000, 500000),
        ];
    }

    public function paid(): static
    {
        return $this->state(['status' => 'paid']);
    }

    public function withItems(int $count = 3): static
    {
        return $this->has(OrderItem::factory()->count($count));
    }
}

// Usage in tests
$order = Order::factory()->paid()->withItems(5)->create();
```

## Performance Patterns

- Use `select()` to limit columns when you do not need the full model.
- Use `chunk()` or `lazy()` for processing large datasets to control memory.
- Use `toBase()` when you need raw stdClass objects without model hydration.
- Index foreign keys and columns used in `where`, `orderBy`, and `groupBy`.
- Use `explain()` to inspect query plans during development.

```php
// Memory-efficient processing
Order::where('status', 'pending')
    ->chunkById(500, function (Collection $orders) {
        foreach ($orders as $order) {
            ProcessOrder::dispatch($order);
        }
    });
```
