# Example: Composer Validation Package

## Scenario

Create a reusable Composer package for input validation with PHP 8.4. Features typed rule interfaces, enum-based error codes, readonly result objects, and a CI-ready test setup with PHPUnit data providers and PHPStan level 9.

## Package Structure

```
cubis/validation/
├── composer.json
├── phpstan.neon.dist
├── phpunit.xml.dist
├── src/
│   ├── ErrorCode.php
│   ├── ValidationError.php
│   ├── ValidationResult.php
│   ├── ValidatorInterface.php
│   ├── Validator.php
│   └── Rules/
│       ├── ValidationRuleInterface.php
│       ├── RequiredRule.php
│       ├── MinLengthRule.php
│       ├── EmailRule.php
│       ├── RangeRule.php
│       └── RegexRule.php
└── tests/
    ├── ValidatorTest.php
    └── Rules/
        ├── RequiredRuleTest.php
        ├── MinLengthRuleTest.php
        └── EmailRuleTest.php
```

## composer.json

```json
{
    "name": "cubis/validation",
    "description": "Typed validation library for PHP 8.4+ with enum error codes and composable rules",
    "type": "library",
    "license": "MIT",
    "require": {
        "php": ">=8.4"
    },
    "require-dev": {
        "phpunit/phpunit": "^11.0",
        "phpstan/phpstan": "^2.0",
        "phpstan/phpstan-strict-rules": "^2.0"
    },
    "autoload": {
        "psr-4": {
            "Cubis\\Validation\\": "src/"
        }
    },
    "autoload-dev": {
        "psr-4": {
            "Cubis\\Validation\\Tests\\": "tests/"
        }
    },
    "scripts": {
        "test": "phpunit",
        "analyse": "phpstan analyse",
        "check": ["@analyse", "@test"]
    }
}
```

## PHPStan Configuration

```neon
# phpstan.neon.dist
includes:
    - vendor/phpstan/phpstan-strict-rules/rules.neon

parameters:
    level: 9
    paths:
        - src
    tmpDir: .phpstan-cache
```

## PHPUnit Configuration

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- phpunit.xml.dist -->
<phpunit
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
    bootstrap="vendor/autoload.php"
    colors="true"
    cacheDirectory=".phpunit.cache"
>
    <testsuites>
        <testsuite name="default">
            <directory>tests</directory>
        </testsuite>
    </testsuites>
    <source>
        <include>
            <directory>src</directory>
        </include>
    </source>
</phpunit>
```

## Error Code Enum

```php
<?php declare(strict_types=1);

namespace Cubis\Validation;

enum ErrorCode: string
{
    case Required = 'required';
    case MinLength = 'min_length';
    case MaxLength = 'max_length';
    case InvalidEmail = 'invalid_email';
    case OutOfRange = 'out_of_range';
    case InvalidFormat = 'invalid_format';
    case TypeMismatch = 'type_mismatch';

    public function defaultMessage(): string
    {
        return match ($this) {
            self::Required => 'This field is required.',
            self::MinLength => 'Value is too short.',
            self::MaxLength => 'Value is too long.',
            self::InvalidEmail => 'Invalid email address.',
            self::OutOfRange => 'Value is out of allowed range.',
            self::InvalidFormat => 'Value does not match the required format.',
            self::TypeMismatch => 'Value has an incorrect type.',
        };
    }
}
```

## Validation Result and Error

```php
<?php declare(strict_types=1);

namespace Cubis\Validation;

readonly class ValidationError
{
    public function __construct(
        public ErrorCode $code,
        public string $field,
        public string $message,
        /** @var array<string, mixed> */
        public array $context = [],
    ) {}
}

readonly class ValidationResult
{
    /** @param list<ValidationError> $errors */
    public function __construct(
        public array $errors = [],
    ) {}

    public bool $isValid {
        get => $this->errors === [];
    }

    public function merge(self $other): self
    {
        return new self([...$this->errors, ...$other->errors]);
    }

    public function errorsForField(string $field): array
    {
        return array_values(
            array_filter($this->errors, fn(ValidationError $e) => $e->field === $field)
        );
    }
}
```

## Rule Interface and Implementations

```php
<?php declare(strict_types=1);

namespace Cubis\Validation\Rules;

use Cubis\Validation\ValidationResult;

interface ValidationRuleInterface
{
    public function validate(string $field, mixed $value): ValidationResult;
}
```

```php
<?php declare(strict_types=1);

namespace Cubis\Validation\Rules;

use Cubis\Validation\ErrorCode;
use Cubis\Validation\ValidationError;
use Cubis\Validation\ValidationResult;

readonly class RequiredRule implements ValidationRuleInterface
{
    public function validate(string $field, mixed $value): ValidationResult
    {
        if ($value === null || $value === '' || $value === []) {
            return new ValidationResult([
                new ValidationError(
                    ErrorCode::Required,
                    $field,
                    ErrorCode::Required->defaultMessage(),
                ),
            ]);
        }

        return new ValidationResult();
    }
}
```

```php
<?php declare(strict_types=1);

namespace Cubis\Validation\Rules;

use Cubis\Validation\ErrorCode;
use Cubis\Validation\ValidationError;
use Cubis\Validation\ValidationResult;

readonly class MinLengthRule implements ValidationRuleInterface
{
    public function __construct(
        private int $minLength,
    ) {
        if ($minLength < 0) {
            throw new \InvalidArgumentException('Minimum length cannot be negative');
        }
    }

    public function validate(string $field, mixed $value): ValidationResult
    {
        if (!is_string($value)) {
            return new ValidationResult([
                new ValidationError(
                    ErrorCode::TypeMismatch,
                    $field,
                    'Expected a string value.',
                    ['expected' => 'string', 'actual' => get_debug_type($value)],
                ),
            ]);
        }

        if (mb_strlen($value) < $this->minLength) {
            return new ValidationResult([
                new ValidationError(
                    ErrorCode::MinLength,
                    $field,
                    "Must be at least {$this->minLength} characters.",
                    ['min' => $this->minLength, 'actual' => mb_strlen($value)],
                ),
            ]);
        }

        return new ValidationResult();
    }
}
```

```php
<?php declare(strict_types=1);

namespace Cubis\Validation\Rules;

use Cubis\Validation\ErrorCode;
use Cubis\Validation\ValidationError;
use Cubis\Validation\ValidationResult;

readonly class EmailRule implements ValidationRuleInterface
{
    public function validate(string $field, mixed $value): ValidationResult
    {
        if (!is_string($value)) {
            return new ValidationResult([
                new ValidationError(
                    ErrorCode::TypeMismatch,
                    $field,
                    'Expected a string value.',
                ),
            ]);
        }

        if (filter_var($value, FILTER_VALIDATE_EMAIL) === false) {
            return new ValidationResult([
                new ValidationError(
                    ErrorCode::InvalidEmail,
                    $field,
                    ErrorCode::InvalidEmail->defaultMessage(),
                    ['value' => $value],
                ),
            ]);
        }

        return new ValidationResult();
    }
}
```

## Validator (Composing Rules)

```php
<?php declare(strict_types=1);

namespace Cubis\Validation;

use Cubis\Validation\Rules\ValidationRuleInterface;

final class Validator implements ValidatorInterface
{
    /** @var array<string, list<ValidationRuleInterface>> */
    private array $fieldRules = [];

    public function addRule(string $field, ValidationRuleInterface $rule): self
    {
        $this->fieldRules[$field][] = $rule;
        return $this;
    }

    /** @param array<string, mixed> $data */
    public function validate(array $data): ValidationResult
    {
        $result = new ValidationResult();

        foreach ($this->fieldRules as $field => $rules) {
            $value = $data[$field] ?? null;

            foreach ($rules as $rule) {
                $fieldResult = $rule->validate($field, $value);
                $result = $result->merge($fieldResult);

                // Stop validating this field on first error (fail-fast)
                if (!$fieldResult->isValid) {
                    break;
                }
            }
        }

        return $result;
    }
}
```

## Tests with Data Providers

```php
<?php declare(strict_types=1);

namespace Cubis\Validation\Tests\Rules;

use Cubis\Validation\ErrorCode;
use Cubis\Validation\Rules\RequiredRule;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class RequiredRuleTest extends TestCase
{
    #[Test]
    #[DataProvider('invalidValues')]
    public function it_rejects_empty_values(mixed $value): void
    {
        $rule = new RequiredRule();
        $result = $rule->validate('name', $value);

        self::assertFalse($result->isValid);
        self::assertCount(1, $result->errors);
        self::assertSame(ErrorCode::Required, $result->errors[0]->code);
        self::assertSame('name', $result->errors[0]->field);
    }

    #[Test]
    #[DataProvider('validValues')]
    public function it_accepts_non_empty_values(mixed $value): void
    {
        $rule = new RequiredRule();
        $result = $rule->validate('name', $value);

        self::assertTrue($result->isValid);
        self::assertCount(0, $result->errors);
    }

    /** @return iterable<string, array{mixed}> */
    public static function invalidValues(): iterable
    {
        yield 'null' => [null];
        yield 'empty string' => [''];
        yield 'empty array' => [[]];
    }

    /** @return iterable<string, array{mixed}> */
    public static function validValues(): iterable
    {
        yield 'non-empty string' => ['hello'];
        yield 'zero' => [0];
        yield 'false' => [false];
        yield 'non-empty array' => [[1]];
    }
}
```

```php
<?php declare(strict_types=1);

namespace Cubis\Validation\Tests\Rules;

use Cubis\Validation\ErrorCode;
use Cubis\Validation\Rules\MinLengthRule;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class MinLengthRuleTest extends TestCase
{
    #[Test]
    #[DataProvider('tooShortValues')]
    public function it_rejects_short_strings(string $value, int $minLength): void
    {
        $rule = new MinLengthRule($minLength);
        $result = $rule->validate('username', $value);

        self::assertFalse($result->isValid);
        self::assertSame(ErrorCode::MinLength, $result->errors[0]->code);
        self::assertSame($minLength, $result->errors[0]->context['min']);
    }

    #[Test]
    #[DataProvider('validLengthValues')]
    public function it_accepts_strings_meeting_minimum(string $value, int $minLength): void
    {
        $rule = new MinLengthRule($minLength);
        $result = $rule->validate('username', $value);

        self::assertTrue($result->isValid);
    }

    #[Test]
    public function it_rejects_non_string_values(): void
    {
        $rule = new MinLengthRule(3);
        $result = $rule->validate('count', 42);

        self::assertFalse($result->isValid);
        self::assertSame(ErrorCode::TypeMismatch, $result->errors[0]->code);
    }

    /** @return iterable<string, array{string, int}> */
    public static function tooShortValues(): iterable
    {
        yield 'empty with min 1' => ['', 1];
        yield 'two chars with min 3' => ['ab', 3];
        yield 'unicode two chars with min 3' => ['ab', 3];
    }

    /** @return iterable<string, array{string, int}> */
    public static function validLengthValues(): iterable
    {
        yield 'exact minimum' => ['abc', 3];
        yield 'above minimum' => ['abcdef', 3];
        yield 'zero minimum always passes' => ['', 0];
    }
}
```

## Key Decisions

- **PSR-4 autoloading** — `Cubis\Validation\` maps to `src/`, no manual `require` statements anywhere.
- **Enum error codes** — `ErrorCode` is a backed enum, enabling programmatic `match` on error types by consumers rather than string comparison.
- **Property hook** — `ValidationResult::$isValid` uses a get hook, eliminating a method call while keeping the computed nature explicit.
- **Data providers** — Every test uses `#[DataProvider]` with named yields for descriptive failure output and zero code duplication.
- **PHPStan level 9** — The codebase is designed with precise enough types to pass strict analysis without baseline exclusions.
