# Example: Multi-Step Checkout Flow with Network Mocking

This example demonstrates testing a 3-step checkout flow with the test-author agent handling functional tests, the visual-reviewer capturing screenshots at each step, and the accessibility-auditor scanning each form state.

## Scenario

An e-commerce checkout with three steps:
1. Shipping address form with client-side validation
2. Payment method selection (credit card, PayPal)
3. Order confirmation with summary and "Place Order" button

The form calls `POST /api/orders` on submit and `GET /api/shipping-rates` when the address is complete.

## Page Object

```typescript
// pages/checkout.page.ts
import { Page, Locator } from '@playwright/test';

export class CheckoutPage {
  readonly streetInput: Locator;
  readonly cityInput: Locator;
  readonly zipInput: Locator;
  readonly nextButton: Locator;
  readonly placeOrderButton: Locator;
  readonly confirmationMessage: Locator;

  constructor(private page: Page) {
    this.streetInput = page.getByLabel('Street Address');
    this.cityInput = page.getByLabel('City');
    this.zipInput = page.getByLabel('ZIP Code');
    this.nextButton = page.getByRole('button', { name: 'Next' });
    this.placeOrderButton = page.getByRole('button', { name: 'Place Order' });
    this.confirmationMessage = page.getByRole('heading', { name: /order confirmed/i });
  }

  async fillShippingAddress(street: string, city: string, zip: string) {
    await this.streetInput.fill(street);
    await this.cityInput.fill(city);
    await this.zipInput.fill(zip);
  }

  async selectPaymentMethod(method: 'credit-card' | 'paypal') {
    await this.page.getByRole('radio', { name: new RegExp(method, 'i') }).check();
  }

  async submitOrder() {
    await this.placeOrderButton.click();
    await this.confirmationMessage.waitFor();
  }
}
```

## Test File

```typescript
// tests/checkout.spec.ts
import { test, expect } from '@playwright/test';
import { CheckoutPage } from '../pages/checkout.page';

test.describe('Checkout Flow', () => {
  let checkout: CheckoutPage;

  test.beforeEach(async ({ page }) => {
    // Mock API endpoints
    await page.route('**/api/shipping-rates', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ rates: [{ method: 'standard', price: 5.99 }] }),
      })
    );

    await page.route('**/api/orders', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ orderId: 'ORD-12345', status: 'confirmed' }),
      })
    );

    await page.goto('/checkout');
    checkout = new CheckoutPage(page);
  });

  test('completes full checkout with valid data', async ({ page }) => {
    // Step 1: Shipping
    await checkout.fillShippingAddress('123 Main St', 'Portland', '97201');
    await checkout.nextButton.click();
    await expect(page.getByText('Payment Method')).toBeVisible();

    // Step 2: Payment
    await checkout.selectPaymentMethod('credit-card');
    await checkout.nextButton.click();
    await expect(page.getByText('Order Summary')).toBeVisible();

    // Step 3: Confirm
    await checkout.submitOrder();
    await expect(checkout.confirmationMessage).toBeVisible();
    await expect(page.getByText('ORD-12345')).toBeVisible();
  });

  test('shows validation errors for empty shipping fields', async ({ page }) => {
    await checkout.nextButton.click();
    await expect(page.getByText('Street Address is required')).toBeVisible();
    await expect(page.getByText('City is required')).toBeVisible();
  });
});
```

## Visual Test (visual-reviewer agent)

```typescript
// tests/checkout-visual.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Checkout Visual Regression', () => {
  test('shipping step matches baseline', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page).toHaveScreenshot('checkout-shipping-step.png', {
      maxDiffPixelRatio: 0.01,
      mask: [page.locator('[data-testid="session-timer"]')],
    });
  });

  test('validation error state matches baseline', async ({ page }) => {
    await page.goto('/checkout');
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page).toHaveScreenshot('checkout-validation-errors.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});
```

## Accessibility Test (accessibility-auditor agent)

```typescript
// tests/checkout-a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Checkout Accessibility', () => {
  test('shipping form passes WCAG 2.1 AA', async ({ page }) => {
    await page.goto('/checkout');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('validation error state is accessible', async ({ page }) => {
    await page.goto('/checkout');
    await page.getByRole('button', { name: 'Next' }).click();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
```

## Key Takeaways

- The test-author owns the functional flow and page objects
- The visual-reviewer captures baselines at each meaningful state
- The accessibility-auditor scans after each interaction, not just page load
- All three agents share the same route mocks to ensure consistency
