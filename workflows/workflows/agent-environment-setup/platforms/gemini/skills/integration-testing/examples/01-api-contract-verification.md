# Example: Consumer-Driven Contract Testing for a Product API

## Context

A React frontend consumes a `GET /api/products/:id` endpoint from the product-service. The contract needs to be verified on both sides to prevent field-level breaking changes.

## User Prompt

> Our frontend team keeps breaking because the backend renames or removes fields from the product API. Set up consumer-driven contract testing so both teams know immediately when the contract is violated. We use Node.js on both sides.

## Skill Response

### Integration Boundary

- **Consumer:** React frontend application
- **Producer:** product-service (Express.js)
- **Protocol:** HTTP REST, JSON responses
- **Endpoint:** `GET /api/products/:id`

### Step 1: Define the Consumer Contract

The frontend team writes a Pact contract specifying exactly what fields it needs:

```javascript
// frontend/tests/contracts/product.consumer.pact.js
const { PactV3, MatchersV3 } = require('@pact-foundation/pact');
const { like, integer, string } = MatchersV3;

const provider = new PactV3({
  consumer: 'frontend-app',
  provider: 'product-service',
});

describe('Product API Contract', () => {
  test('GET /api/products/:id returns expected shape', async () => {
    // Arrange: define the expected interaction
    await provider
      .given('product with ID 42 exists')
      .uponReceiving('a request for product 42')
      .withRequest({
        method: 'GET',
        path: '/api/products/42',
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          id: integer(42),
          name: string('Widget Pro'),
          price: like(29.99),
          currency: string('USD'),
          inStock: like(true),
        },
      });

    // Act: run the consumer code against the Pact mock
    await provider.executeTest(async (mockServer) => {
      const response = await fetch(
        `${mockServer.url}/api/products/42`
      );
      const product = await response.json();

      // Assert: consumer gets what it expects
      expect(product.id).toBe(42);
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('currency');
      expect(product).toHaveProperty('inStock');
    });
  });

  test('GET /api/products/:id returns 404 for missing product', async () => {
    await provider
      .given('product with ID 999 does not exist')
      .uponReceiving('a request for non-existent product')
      .withRequest({
        method: 'GET',
        path: '/api/products/999',
      })
      .willRespondWith({
        status: 404,
        body: {
          error: string('Product not found'),
        },
      });

    await provider.executeTest(async (mockServer) => {
      const response = await fetch(
        `${mockServer.url}/api/products/999`
      );
      expect(response.status).toBe(404);
    });
  });
});
```

### Step 2: Publish the Contract

```bash
# In frontend CI pipeline
npx pact-broker publish ./pacts \
  --consumer-app-version=$(git rev-parse --short HEAD) \
  --broker-base-url=https://pact-broker.internal.example.com \
  --tag=$(git branch --show-current)
```

### Step 3: Provider Verification

The backend team verifies their service satisfies the contract:

```javascript
// product-service/tests/contracts/product.provider.pact.js
const { Verifier } = require('@pact-foundation/pact');

describe('Product Service Provider Verification', () => {
  test('satisfies frontend-app contract', async () => {
    const verifier = new Verifier({
      providerBaseUrl: 'http://localhost:3001',
      pactBrokerUrl: 'https://pact-broker.internal.example.com',
      provider: 'product-service',
      consumerVersionSelectors: [
        { mainBranch: true },
        { deployedOrReleased: true },
      ],
      stateHandlers: {
        'product with ID 42 exists': async () => {
          await seedProduct({ id: 42, name: 'Widget Pro', price: 29.99 });
        },
        'product with ID 999 does not exist': async () => {
          await clearProducts();
        },
      },
    });

    await verifier.verifyProvider();
  });
});
```

### Step 4: CI Integration

```yaml
# .github/workflows/contract-tests.yml
name: Contract Tests
on: [pull_request]

jobs:
  consumer-contract:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:contract
      - run: npx pact-broker publish ./pacts
              --consumer-app-version=${{ github.sha }}
              --broker-base-url=${{ secrets.PACT_BROKER_URL }}

  provider-verification:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run start:test &
      - run: npm run test:provider-contract
```

### What This Prevents

If the backend renames `inStock` to `isAvailable`, the provider verification step fails immediately with:

```
Verifier Error: Missing field 'inStock' in response body
  Expected: boolean
  Actual: field not present
```

The backend team sees this failure before the PR is merged, preventing the break from reaching production.
