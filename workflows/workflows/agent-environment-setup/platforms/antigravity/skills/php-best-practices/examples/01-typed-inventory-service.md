# Example: Typed Product Inventory Service

## Scenario

Build a PHP 8.4 product inventory service for an e-commerce platform. Uses readonly value objects, backed enums for status, property hooks for computed properties, and interface-based repository contracts. Demonstrates strict typing and proper exception hierarchies.

## Directory Structure

```
src/
├── Domain/
│   ├── ValueObject/
│   │   ├── ProductId.php
│   │   ├── Money.php
│   │   └── Quantity.php
│   ├── Enum/
│   │   └── ProductStatus.php
│   ├── Entity/
│   │   └── Product.php
│   ├── Exception/
│   │   ├── DomainException.php
│   │   ├── ProductNotFoundException.php
│   │   └── InsufficientStockException.php
│   └── Repository/
│       └── ProductRepositoryInterface.php
├── Application/
│   └── InventoryService.php
└── Infrastructure/
    └── Persistence/
        └── PdoProductRepository.php
```

## Value Objects

```php
<?php declare(strict_types=1);

namespace App\Domain\ValueObject;

readonly class ProductId
{
    public function __construct(
        public string $value,
    ) {
        if (trim($value) === '') {
            throw new \InvalidArgumentException('ProductId cannot be empty');
        }
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
```

```php
<?php declare(strict_types=1);

namespace App\Domain\ValueObject;

readonly class Money
{
    public function __construct(
        public int $amount,        // stored in minor units (cents)
        public string $currency,
    ) {
        if ($amount < 0) {
            throw new \InvalidArgumentException('Money amount cannot be negative');
        }
        if (strlen($currency) !== 3) {
            throw new \InvalidArgumentException('Currency must be a 3-letter ISO code');
        }
    }

    public function add(self $other): self
    {
        $this->assertSameCurrency($other);
        return new self($this->amount + $other->amount, $this->currency);
    }

    public function multiply(int $factor): self
    {
        return new self($this->amount * $factor, $this->currency);
    }

    public function formatted(): string
    {
        return number_format($this->amount / 100, 2) . ' ' . $this->currency;
    }

    private function assertSameCurrency(self $other): void
    {
        if ($this->currency !== $other->currency) {
            throw new \InvalidArgumentException(
                "Cannot combine {$this->currency} with {$other->currency}"
            );
        }
    }
}
```

```php
<?php declare(strict_types=1);

namespace App\Domain\ValueObject;

readonly class Quantity
{
    public function __construct(
        public int $value,
    ) {
        if ($value < 0) {
            throw new \InvalidArgumentException('Quantity cannot be negative');
        }
    }

    public function subtract(self $other): self
    {
        $result = $this->value - $other->value;
        if ($result < 0) {
            throw new \InvalidArgumentException(
                "Cannot subtract {$other->value} from {$this->value}"
            );
        }
        return new self($result);
    }

    public function add(self $other): self
    {
        return new self($this->value + $other->value);
    }

    public function isZero(): bool
    {
        return $this->value === 0;
    }
}
```

## Backed Enum

```php
<?php declare(strict_types=1);

namespace App\Domain\Enum;

enum ProductStatus: string
{
    case Active = 'active';
    case OutOfStock = 'out_of_stock';
    case Discontinued = 'discontinued';
    case Draft = 'draft';

    public function canBePurchased(): bool
    {
        return match ($this) {
            self::Active => true,
            self::OutOfStock, self::Discontinued, self::Draft => false,
        };
    }

    public function canBeRestocked(): bool
    {
        return match ($this) {
            self::Active, self::OutOfStock => true,
            self::Discontinued, self::Draft => false,
        };
    }
}
```

## Entity with Property Hooks

```php
<?php declare(strict_types=1);

namespace App\Domain\Entity;

use App\Domain\Enum\ProductStatus;
use App\Domain\ValueObject\Money;
use App\Domain\ValueObject\ProductId;
use App\Domain\ValueObject\Quantity;

class Product
{
    // PHP 8.4 property hook: computed formatted price
    public string $formattedPrice {
        get => $this->price->formatted();
    }

    // PHP 8.4 property hook: auto-derive status from stock level
    public ProductStatus $status {
        get => $this->deriveStatus();
    }

    // PHP 8.4 asymmetric visibility: readable externally, writable only internally
    public private(set) \DateTimeImmutable $updatedAt;

    public function __construct(
        public readonly ProductId $id,
        public readonly string $name,
        public readonly string $sku,
        private Money $price,
        private Quantity $stockLevel,
        private ProductStatus $baseStatus = ProductStatus::Active,
    ) {
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getPrice(): Money
    {
        return $this->price;
    }

    public function getStockLevel(): Quantity
    {
        return $this->stockLevel;
    }

    public function restock(Quantity $amount): void
    {
        if (!$this->baseStatus->canBeRestocked()) {
            throw new \LogicException(
                "Cannot restock product {$this->id} with status {$this->baseStatus->value}"
            );
        }

        $this->stockLevel = $this->stockLevel->add($amount);
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function withdraw(Quantity $amount): void
    {
        $this->stockLevel = $this->stockLevel->subtract($amount);
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function updatePrice(Money $newPrice): void
    {
        $this->price = $newPrice;
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function discontinue(): void
    {
        $this->baseStatus = ProductStatus::Discontinued;
        $this->updatedAt = new \DateTimeImmutable();
    }

    private function deriveStatus(): ProductStatus
    {
        if ($this->baseStatus === ProductStatus::Discontinued) {
            return ProductStatus::Discontinued;
        }
        if ($this->baseStatus === ProductStatus::Draft) {
            return ProductStatus::Draft;
        }
        return $this->stockLevel->isZero()
            ? ProductStatus::OutOfStock
            : ProductStatus::Active;
    }
}
```

## Exception Hierarchy

```php
<?php declare(strict_types=1);

namespace App\Domain\Exception;

abstract class DomainException extends \RuntimeException
{
    abstract public function errorCode(): string;
}

class ProductNotFoundException extends DomainException
{
    public function __construct(
        public readonly string $productId,
    ) {
        parent::__construct("Product not found: {$productId}");
    }

    public function errorCode(): string
    {
        return 'PRODUCT_NOT_FOUND';
    }
}

class InsufficientStockException extends DomainException
{
    public function __construct(
        public readonly string $productId,
        public readonly int $requested,
        public readonly int $available,
    ) {
        parent::__construct(
            "Insufficient stock for {$productId}: requested {$requested}, available {$available}"
        );
    }

    public function errorCode(): string
    {
        return 'INSUFFICIENT_STOCK';
    }
}
```

## Repository Interface

```php
<?php declare(strict_types=1);

namespace App\Domain\Repository;

use App\Domain\Entity\Product;
use App\Domain\ValueObject\ProductId;

interface ProductRepositoryInterface
{
    public function findById(ProductId $id): ?Product;
    public function save(Product $product): void;
    /** @return list<Product> */
    public function findByStatus(\App\Domain\Enum\ProductStatus $status): array;
}
```

## Application Service

```php
<?php declare(strict_types=1);

namespace App\Application;

use App\Domain\Entity\Product;
use App\Domain\Exception\InsufficientStockException;
use App\Domain\Exception\ProductNotFoundException;
use App\Domain\Repository\ProductRepositoryInterface;
use App\Domain\ValueObject\ProductId;
use App\Domain\ValueObject\Quantity;
use Psr\Log\LoggerInterface;

final readonly class InventoryService
{
    public function __construct(
        private ProductRepositoryInterface $repository,
        private LoggerInterface $logger,
    ) {}

    public function withdrawStock(string $productId, int $amount): Product
    {
        $id = new ProductId($productId);
        $product = $this->repository->findById($id)
            ?? throw new ProductNotFoundException($productId);

        if (!$product->status->canBePurchased()) {
            throw new InsufficientStockException(
                $productId, $amount, 0
            );
        }

        $quantity = new Quantity($amount);

        if ($product->getStockLevel()->value < $amount) {
            throw new InsufficientStockException(
                $productId, $amount, $product->getStockLevel()->value
            );
        }

        $product->withdraw($quantity);
        $this->repository->save($product);

        $this->logger->info('Stock withdrawn', [
            'product_id' => $productId,
            'quantity' => $amount,
            'remaining' => $product->getStockLevel()->value,
        ]);

        return $product;
    }

    public function restockProduct(string $productId, int $amount): Product
    {
        $id = new ProductId($productId);
        $product = $this->repository->findById($id)
            ?? throw new ProductNotFoundException($productId);

        $product->restock(new Quantity($amount));
        $this->repository->save($product);

        $this->logger->info('Product restocked', [
            'product_id' => $productId,
            'quantity' => $amount,
            'new_level' => $product->getStockLevel()->value,
        ]);

        return $product;
    }
}
```

## Key Decisions

- **Readonly value objects** — `Money`, `Quantity`, `ProductId` are immutable. Operations return new instances.
- **Backed enum** — `ProductStatus` encodes business rules (`canBePurchased()`, `canBeRestocked()`) directly on the enum, keeping logic co-located with the value set.
- **Property hooks** — `$formattedPrice` and `$status` are computed via hooks, eliminating getter boilerplate while keeping the property-access syntax.
- **Asymmetric visibility** — `$updatedAt` is publicly readable but only writable by the Product itself.
- **Interface-based repository** — The service depends on `ProductRepositoryInterface`, not a concrete PDO implementation, enabling in-memory test doubles.
