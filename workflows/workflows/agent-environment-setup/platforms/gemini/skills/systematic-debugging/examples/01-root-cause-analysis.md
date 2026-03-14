# Example: Root Cause Analysis for Intermittent Data Corruption

## Context

An order processing service occasionally produces orders with a total of $0.00 despite having line items with positive prices. The bug occurs approximately 2% of the time and only in production.

## User Prompt

> About 2% of orders in production have a total of $0.00 even though the line items show correct prices. It doesn't happen in staging. We've checked the database and the totals are actually stored as zero. Help me systematically find the root cause.

## Skill Response

### Phase 1: Establish Reliable Reproduction

**Evidence Collection:**

```bash
# Find affected orders and their timestamps
SELECT id, total, created_at, line_item_count
FROM orders
WHERE total = 0 AND line_item_count > 0
ORDER BY created_at DESC
LIMIT 50;

# Check if there's a time pattern
SELECT DATE_TRUNC('hour', created_at) AS hour, COUNT(*)
FROM orders
WHERE total = 0 AND line_item_count > 0
GROUP BY hour
ORDER BY hour DESC;
```

**Finding:** Affected orders cluster around the top of each hour, specifically between :00 and :02.

**Reproduction Attempt:**
- Staging does not have the scheduled job that runs at the top of each hour in production.
- Hypothesis formation point: the hourly job may be interfering with order processing.

### Phase 2: Form a Falsifiable Hypothesis

**Hypothesis 1:** The hourly price-sync job (`PriceSyncScheduler`) updates product prices to a temporary state, and orders created during the sync read a stale or zero price.

**Test:** Check if the price-sync job writes intermediate values:

```bash
# Check the price-sync job's SQL
grep -r "UPDATE products" src/jobs/PriceSyncScheduler.ts
```

**Finding:** The sync job runs:
```sql
UPDATE products SET price = 0 WHERE id = $1;  -- Clear old price
UPDATE products SET price = $2 WHERE id = $1;  -- Set new price
```

This is a two-step update without a transaction. Orders that read between the two statements see `price = 0`.

### Phase 3: Five Whys Root Cause Analysis

| # | Question | Answer |
|---|----------|--------|
| 1 | **Why** are order totals $0.00? | Because the order calculation reads product prices that are zero at the time of calculation. |
| 2 | **Why** are product prices zero? | Because the `PriceSyncScheduler` sets prices to zero before setting the new price. |
| 3 | **Why** does the sync job set prices to zero first? | Because the original developer used a two-step update (clear then set) instead of a single atomic update. |
| 4 | **Why** wasn't this caught in testing? | Because staging does not run the `PriceSyncScheduler` cron job, so the race condition never manifests. |
| 5 | **Why** don't order calculations use a consistent snapshot? | Because order processing reads prices with default isolation (READ COMMITTED) without explicitly locking the relevant product rows. |

**Root Cause:** The `PriceSyncScheduler` uses a non-atomic two-step price update. Combined with READ COMMITTED isolation on the order calculation path, this creates a race window where orders see intermediate zero prices.

### Phase 4: Fix and Verify

**Fix 1: Atomic update in PriceSyncScheduler**

```typescript
// BEFORE (buggy):
await db.query('UPDATE products SET price = 0 WHERE id = $1', [id]);
await db.query('UPDATE products SET price = $1 WHERE id = $2', [newPrice, id]);

// AFTER (fixed):
await db.query('UPDATE products SET price = $1 WHERE id = $2', [newPrice, id]);
```

**Fix 2: Defensive read in OrderCalculator**

```typescript
// Add a sanity check that catches zero prices before committing
const lineTotal = item.quantity * item.price;
if (item.price <= 0 && item.expectedPrice > 0) {
  throw new PriceInconsistencyError(
    `Product ${item.productId} has zero price during order calculation`
  );
}
```

**Regression Test:**

```typescript
describe('Order calculation during price sync', () => {
  test('should not produce zero-total orders during concurrent price update', async () => {
    // Arrange: create a product with price $10
    const product = await createProduct({ price: 10.00 });

    // Act: simulate concurrent price sync and order creation
    const results = await Promise.all([
      // Simulate price sync
      syncProductPrice(product.id, 12.00),
      // Simultaneously create an order
      createOrder({ productId: product.id, quantity: 2 }),
    ]);

    // Assert: order total must never be zero
    const order = results[1];
    expect(order.total).toBeGreaterThan(0);
    expect(order.total).toBeOneOf([20.00, 24.00]); // old or new price, never zero
  });
});
```

### Phase 5: Search for Similar Patterns

```bash
# Find other two-step updates that could have the same race condition
grep -rn "SET .* = 0" src/jobs/ --include="*.ts"
grep -rn "SET .* = null" src/jobs/ --include="*.ts"
```

**Finding:** `InventorySyncScheduler` has the same pattern for `stock_count`. Filed as a separate issue.

### Post-Mortem Summary

| Field | Detail |
|-------|--------|
| **Impact** | ~2% of orders (approximately 340 orders over 3 months) had $0.00 totals requiring manual correction |
| **Detection** | Customer complaint escalated through support |
| **Root Cause** | Non-atomic two-step price update in scheduled job |
| **Fix** | Atomic single-statement update + defensive price validation |
| **Prevention** | Added linting rule to flag two-step updates without transactions; added price-sync job to staging environment |
| **Resolution Time** | 4 hours from investigation start to deployed fix |

### Lessons Learned

1. Scheduled jobs that modify shared data must use atomic operations or transactions.
2. Staging environments must mirror production's scheduled jobs to catch race conditions.
3. Defensive validation (price > 0 check) catches data integrity issues even when root cause is unknown.
