# PHP 8.4 Strict Typing Checklist

## Strict types enforcement

### File header

Every PHP file must start with:

```php
<?php

declare(strict_types=1);
```

- Without this declaration, PHP silently coerces types (e.g., `"123abc"` becomes `123`).
- With strict types, type mismatches throw `TypeError` immediately.

### Method signatures

```php
public function createUser(
    string $name,
    string $email,
    ?int $teamId = null,
): User {
    // ...
}
```

- Type every parameter, return value, and property. No untyped public APIs.
- Use `?Type` for nullable parameters. Use `mixed` only when genuinely any type is accepted.
- Use `void` return type when the function returns nothing.

## PHP 8.4 type features

### Enums

```php
enum Status: string {
    case Active = 'active';
    case Inactive = 'inactive';
    case Suspended = 'suspended';
}

// Usage
function setStatus(Status $status): void { /* ... */ }
setStatus(Status::Active);
```

- Use backed enums (`string` or `int`) for values stored in databases or APIs.
- Use pure enums when the enum is only used for type discrimination.
- Enums can implement interfaces and use traits (without properties).

### Readonly properties and classes

```php
readonly class UserDTO {
    public function __construct(
        public string $name,
        public string $email,
        public int $age,
    ) {}
}
```

- Use `readonly` for immutable data transfer objects and value objects.
- Readonly properties can only be initialized once (in constructor or declaration).
- Readonly classes make all properties implicitly readonly.

### Union and intersection types

```php
function process(string|Stringable $input): int|float { /* ... */ }

function handle(Countable&Iterator $collection): void { /* ... */ }
```

- Union types (`A|B`): value can be any of the listed types.
- Intersection types (`A&B`): value must satisfy all listed types. Useful for requiring multiple interfaces.
- DNF types (PHP 8.2+): combine union and intersection: `(A&B)|C`.

## PHPStan configuration

### Recommended `phpstan.neon`

```neon
parameters:
    level: 8
    paths:
        - src
        - tests
    excludePaths:
        - src/legacy/*
    checkGenericClassInNonGenericObjectType: true
    treatPhpDocTypesAsCertain: false
    reportUnmatchedIgnoredErrors: true
```

- Start at level 5 for legacy codebases, target level 8+ for new code.
- Use baseline file (`phpstan-baseline.neon`) to track pre-existing errors without blocking CI.
- Run `phpstan analyze` in CI on every PR. Block merge on new errors.

### PHPStan generics

```php
/**
 * @template T
 * @param class-string<T> $className
 * @return T
 */
function create(string $className): object { /* ... */ }
```

- Use `@template` annotations for generic types until PHP has native generics.
- Annotate collections: `@var array<string, User>` instead of `@var array`.

## Composer security audit

### CI pipeline

```yaml
steps:
  - run: composer install --no-dev --prefer-dist
  - run: composer audit --format=json
  - run: composer outdated --direct --format=json
```

- `composer audit` checks installed packages against known vulnerabilities (Packagist advisory database).
- Run on every CI build. Block deploys on critical/high severity findings.
- `composer outdated --direct` shows only direct dependency updates needed.

### Lock file hygiene

- Always commit `composer.lock` for applications. Never commit it for libraries.
- Run `composer validate --strict` in CI to catch manifest issues.
- Update dependencies in small batches with test verification between updates.
- Pin PHP version requirement in `composer.json`: `"php": ">=8.4 <8.5"`.

## Error pattern: typed results

```php
readonly class Result {
    private function __construct(
        public readonly bool $ok,
        public readonly mixed $value = null,
        public readonly ?string $error = null,
    ) {}

    public static function success(mixed $value): self {
        return new self(ok: true, value: $value);
    }

    public static function failure(string $error): self {
        return new self(ok: false, error: $error);
    }
}
```

- Use result objects for expected failures (validation, not-found) instead of exceptions.
- Exceptions remain for truly exceptional conditions (database down, file system errors).
- This pattern works well with PHPStan generics: `Result<User>`.
