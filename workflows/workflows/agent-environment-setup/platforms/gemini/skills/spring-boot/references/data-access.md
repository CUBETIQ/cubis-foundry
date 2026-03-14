# Data Access

## Spring Data JPA Repository Hierarchy

```
Repository (marker)
  └── CrudRepository<T, ID> (basic CRUD)
      └── ListCrudRepository<T, ID> (returns List instead of Iterable)
          └── JpaRepository<T, ID> (JPA-specific: flush, batch, example queries)
```

Use `JpaRepository` for most cases. Use `CrudRepository` when you want minimal methods.

## Derived Query Methods

Spring Data derives SQL from method names. Errors are caught at startup.

```java
public interface ProductRepository extends JpaRepository<Product, Long> {

    // WHERE name = ?
    Optional<Product> findByName(String name);

    // WHERE price BETWEEN ? AND ? ORDER BY name ASC
    List<Product> findByPriceBetweenOrderByNameAsc(BigDecimal min, BigDecimal max);

    // WHERE name LIKE '%?%' AND active = true
    List<Product> findByNameContainingIgnoreCaseAndActiveTrue(String name);

    // WHERE category IN (?) ORDER BY created_at DESC
    Page<Product> findByCategoryInOrderByCreatedAtDesc(List<String> categories, Pageable pageable);

    // EXISTS WHERE sku = ?
    boolean existsBySku(String sku);

    // COUNT WHERE category = ?
    long countByCategory(String category);

    // DELETE WHERE id = ? AND owner_id = ?
    void deleteByIdAndOwnerId(Long id, String ownerId);
}
```

### Query Derivation Keywords

| Keyword | SQL | Example |
|---------|-----|---------|
| `findBy` | SELECT ... WHERE | `findByEmail(String email)` |
| `countBy` | SELECT COUNT(*) WHERE | `countByStatus(String status)` |
| `existsBy` | SELECT EXISTS WHERE | `existsByEmail(String email)` |
| `deleteBy` | DELETE WHERE | `deleteByExpiredBefore(Instant date)` |
| `Between` | BETWEEN ? AND ? | `findByPriceBetween(min, max)` |
| `LessThan` / `GreaterThan` | < / > | `findByPriceLessThan(max)` |
| `Like` / `Containing` | LIKE | `findByNameContaining(str)` |
| `In` | IN (?) | `findByStatusIn(List<String>)` |
| `OrderBy` | ORDER BY | `findAllOrderByNameAsc()` |
| `Top` / `First` | LIMIT | `findTop5ByOrderByPriceDesc()` |

## @Query for Complex Queries

```java
public interface OrderRepository extends JpaRepository<Order, Long> {

    @Query("SELECT o FROM Order o JOIN FETCH o.items WHERE o.customerId = :customerId")
    List<Order> findByCustomerIdWithItems(@Param("customerId") String customerId);

    @Query(value = """
        SELECT o.* FROM orders o
        WHERE o.status = :status
        AND o.created_at > :since
        ORDER BY o.total DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Order> findRecentByStatus(
        @Param("status") String status,
        @Param("since") Instant since,
        @Param("limit") int limit
    );

    @Modifying
    @Query("UPDATE Order o SET o.status = :status WHERE o.id = :id")
    int updateStatus(@Param("id") Long id, @Param("status") String status);
}
```

`@Modifying` is required for UPDATE/DELETE queries. Combine with `@Transactional` on the service method.

## Projections

### Interface Projection

```java
public interface ProductSummary {
    String getName();
    BigDecimal getPrice();
    String getCategory();
}

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<ProductSummary> findByCategory(String category);
}
```

Only the projected columns are selected from the database.

### Record Projection with @Query

```java
public record OrderStats(String status, long count, BigDecimal totalRevenue) {}

@Query("""
    SELECT new com.example.dto.OrderStats(o.status, COUNT(o), SUM(o.total))
    FROM Order o
    WHERE o.createdAt > :since
    GROUP BY o.status
    """)
List<OrderStats> getOrderStats(@Param("since") Instant since);
```

## Pagination

```java
// Controller
@GetMapping
public Page<ProductResponse> listProducts(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "name,asc") String sort) {

    Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "name"));
    return productService.findAll(pageable);
}

// Repository
Page<Product> findByCategory(String category, Pageable pageable);
Slice<Product> findByActiveTrue(Pageable pageable);  // No COUNT query
```

`Page` includes total count (extra query). `Slice` only knows if there is a next page (more efficient for infinite scroll).

## Entity Design

```java
@Entity
@Table(name = "products", indexes = {
    @Index(name = "idx_products_sku", columnList = "sku", unique = true),
    @Index(name = "idx_products_category", columnList = "category")
})
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, unique = true, length = 50)
    private String sku;

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    @ManyToOne(fetch = FetchType.LAZY)  // CRITICAL: override EAGER default
    @JoinColumn(name = "category_id")
    private Category category;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Review> reviews = new ArrayList<>();

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
```

### N+1 Prevention

| Problem | Solution |
|---------|----------|
| `@ManyToOne` default is EAGER | Set `fetch = FetchType.LAZY` on every `@ManyToOne` |
| Lazy load in loop | Use `JOIN FETCH` in @Query or `@EntityGraph` |
| Collection load in list endpoint | Use `@EntityGraph(attributePaths = {"reviews"})` |

```java
@EntityGraph(attributePaths = {"category", "reviews"})
List<Product> findByActiveTrue();
```

## Specifications for Dynamic Queries

```java
public class ProductSpecifications {

    public static Specification<Product> hasName(String name) {
        return (root, query, cb) ->
            name == null ? null : cb.like(cb.lower(root.get("name")), "%" + name.toLowerCase() + "%");
    }

    public static Specification<Product> hasPriceBetween(BigDecimal min, BigDecimal max) {
        return (root, query, cb) -> {
            if (min == null && max == null) return null;
            if (min != null && max != null) return cb.between(root.get("price"), min, max);
            if (min != null) return cb.greaterThanOrEqualTo(root.get("price"), min);
            return cb.lessThanOrEqualTo(root.get("price"), max);
        };
    }
}

// Repository extends JpaSpecificationExecutor
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {}

// Service usage
var spec = Specification.where(hasName(filter.name()))
    .and(hasPriceBetween(filter.minPrice(), filter.maxPrice()));
return productRepository.findAll(spec, pageable);
```

## Auditing

```java
@EntityListeners(AuditingEntityListener.class)
@MappedSuperclass
public abstract class Auditable {

    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    @CreatedBy
    @Column(updatable = false)
    private String createdBy;

    @LastModifiedBy
    private String updatedBy;
}
```

Enable with `@EnableJpaAuditing` and provide an `AuditorAware<String>` bean that returns the current user from SecurityContext.
