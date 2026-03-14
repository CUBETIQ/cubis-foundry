# PHP Best Practices — Eval Assertions

## Eval 1: Typed Service Implementation

Tests whether the agent produces correct PHP 8.4 typed architecture with value objects and domain modeling.

### Assertions

1. **strict-types-and-readonly-classes** — Every PHP file begins with `declare(strict_types=1);`. Value objects like `Money`, `Quantity`, and `ProductId` are declared as `readonly class` with constructor property promotion (`public readonly string $currency`). No value object has mutable public properties. Reject classes that allow post-construction mutation of identity or value fields.

2. **enum-driven-domain-modeling** — Product status is a `backed enum` (e.g., `enum ProductStatus: string { case Active = 'active'; ... }`). The enum is used in method signatures, `match` expressions for business rules, and type hints on properties. Reject code using string constants (`const STATUS_ACTIVE = 'active'`), integer flags, or untyped status fields.

3. **property-hooks-usage** — At least one class demonstrates PHP 8.4 property hooks. Examples: a `get` hook on a `Product` class that computes `$formattedPrice` from `$price` and `$currency`, or a `set` hook on `Quantity` that validates the value is non-negative at assignment time. Reject code that uses traditional `getX()`/`setX()` methods where hooks would be cleaner. Accept the syntax `public int $quantity { set => $value >= 0 ? $value : throw new \InvalidArgumentException(...) }`.

4. **interface-based-contracts** — A `ProductRepositoryInterface` (or similar) defines `findById(ProductId $id): ?Product`, `save(Product $product): void`, etc. with full type hints. The `InventoryService` constructor accepts this interface, not a concrete class. Reject services that instantiate their own repositories with `new` or depend on concrete database classes.

5. **specific-exception-hierarchy** — Domain exceptions extend a base class (e.g., `abstract class DomainException extends \RuntimeException`). Specific exceptions like `ProductNotFoundException` include the `ProductId` that failed lookup. `InsufficientStockException` includes requested and available quantities. Reject generic `throw new \Exception('not found')` patterns.

---

## Eval 2: Composer Package Design

Tests whether the agent produces a properly structured, CI-ready PHP package with modern tooling.

### Assertions

1. **psr4-autoloading-config** — The `composer.json` includes `"autoload": { "psr-4": { "Vendor\\Validation\\": "src/" } }` and `"autoload-dev": { "psr-4": { "Vendor\\Validation\\Tests\\": "tests/" } }`. Dependencies include `phpunit/phpunit` and `phpstan/phpstan` as `require-dev`. No `require` or `include` statements appear in source files for class loading. Reject packages missing autoload configuration.

2. **typed-rule-interface** — An interface like `ValidationRuleInterface` defines `validate(mixed $value): ValidationResult` with full PHP type declarations. The `ValidationResult` is a typed object (readonly class or record-like structure) containing success/failure state, error details, and the validated value. Custom rules implement this interface. Reject loosely-typed contracts using arrays or untyped returns.

3. **enum-error-codes** — Error identification uses a backed enum (e.g., `enum ErrorCode: string { case Required = 'required'; case MinLength = 'min_length'; ... }`). Validation failures reference enum cases rather than raw strings. This enables consumers to match on error codes programmatically (`match ($error->code) { ... }`). Reject string-based error codes.

4. **phpstan-level-9-config** — A `phpstan.neon.dist` file exists with `level: 9` (or `level: max`) and `paths: [src]`. The configuration may include additional strict rules or PHPStan extensions. The existence of this config at level 9 implies the source code is designed with precise enough types to pass strict analysis. Reject configurations below level 8.

5. **phpunit-test-with-data-providers** — Test classes use `#[DataProvider('validInputProvider')]` (PHP 8 attribute syntax) or `@dataProvider` annotations for parameterized tests. Data providers return arrays of `[input, expectedResult]` tuples covering valid values, invalid values, boundary values, and type edge cases. A `phpunit.xml.dist` file configures test suites and coverage. Reject test files with duplicated test methods that differ only in input data.
