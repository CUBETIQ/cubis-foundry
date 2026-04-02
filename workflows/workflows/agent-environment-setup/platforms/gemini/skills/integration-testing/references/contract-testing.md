# Contract Testing

## What is Contract Testing

Contract testing verifies that two services (a consumer and a provider) agree on the shape of their interactions without requiring both services to be running simultaneously.

A contract captures:
- The request format (HTTP method, path, headers, body).
- The response format (status code, headers, body shape).
- The states required for specific scenarios.

## Consumer-Driven Contracts

In consumer-driven contract testing, the consumer defines what it needs from the provider. The provider then verifies it can satisfy those needs.

### Why Consumer-Driven

The consumer knows exactly which fields it uses. The provider may return 50 fields, but the consumer only depends on 5. Testing all 50 creates unnecessary coupling. Consumer-driven contracts test only the fields that matter.

### Workflow

```
1. Consumer team writes contract tests defining expected interactions.
2. Contract file (pact) is generated and published to a broker.
3. Provider team runs verification against the contract.
4. Broker records verification results.
5. Both teams see red/green status before deployment.
```

## Tools

### Pact

The most widely adopted contract testing framework. Supports JavaScript, Python, Java, Go, Ruby, .NET, and more.

```
Consumer Side:
  pact-js, pact-python, pact-jvm, pact-go

Provider Side:
  Same libraries, verification mode

Broker:
  Pactflow (SaaS) or Pact Broker (self-hosted)
```

### Spring Cloud Contract

For Spring Boot ecosystems. The provider defines contracts (in Groovy or YAML), and stubs are auto-generated for consumers.

```
Provider defines:  contracts/userService/getUser.groovy
Auto-generates:    stubs for WireMock
Consumer uses:     WireMock stubs in integration tests
```

### OpenAPI/Swagger Validation

Not a full contract testing tool, but can verify that API responses match the OpenAPI spec:

```bash
# Validate response against schema
npx swagger-cli validate openapi.yaml
npx schemathesis run --validate-schema=true http://localhost:3000/openapi.json
```

## Writing Consumer Contracts

### Pact Example (JavaScript)

```javascript
const { PactV3, MatchersV3 } = require('@pact-foundation/pact');
const { like, eachLike, integer, string, boolean } = MatchersV3;

const provider = new PactV3({
  consumer: 'order-frontend',
  provider: 'order-service',
});

describe('Order API Contract', () => {
  test('GET /api/orders returns a list of orders', async () => {
    await provider
      .given('orders exist for user 123')
      .uponReceiving('a request for user orders')
      .withRequest({
        method: 'GET',
        path: '/api/orders',
        query: { userId: '123' },
        headers: { Authorization: 'Bearer valid-token' },
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: eachLike({
          id: integer(1),
          status: string('pending'),
          total: like(99.99),
          createdAt: string('2025-01-15T10:30:00Z'),
        }),
      });

    await provider.executeTest(async (mockServer) => {
      const client = new OrderClient(mockServer.url);
      const orders = await client.getOrders('123');

      expect(orders).toBeInstanceOf(Array);
      expect(orders[0]).toHaveProperty('id');
      expect(orders[0]).toHaveProperty('status');
      expect(orders[0]).toHaveProperty('total');
    });
  });
});
```

### Matchers

Use matchers to allow flexibility in exact values while enforcing type and structure:

| Matcher | Purpose | Example |
|---------|---------|---------|
| `like(value)` | Same type as example | `like(42)` matches any number |
| `string(value)` | Any string | `string('hello')` matches any string |
| `integer(value)` | Any integer | `integer(1)` matches any integer |
| `boolean(value)` | Any boolean | `boolean(true)` matches true or false |
| `eachLike(example)` | Array of items matching shape | `eachLike({id: 1})` matches `[{id: 2}, {id: 3}]` |
| `regex(regex, example)` | Matches regex pattern | `regex(/^\d{4}-\d{2}-\d{2}/, '2025-01-15')` |

## Provider Verification

### Running Verification

```javascript
const { Verifier } = require('@pact-foundation/pact');

describe('Provider Verification', () => {
  test('satisfies all consumer contracts', async () => {
    const verifier = new Verifier({
      providerBaseUrl: 'http://localhost:3001',
      pactBrokerUrl: process.env.PACT_BROKER_URL,
      provider: 'order-service',
      publishVerificationResult: process.env.CI === 'true',
      providerVersion: process.env.GIT_SHA,
      consumerVersionSelectors: [
        { mainBranch: true },
        { deployedOrReleased: true },
      ],
      stateHandlers: {
        'orders exist for user 123': async () => {
          await seedOrdersForUser('123');
        },
        'no orders exist': async () => {
          await clearOrders();
        },
      },
    });

    await verifier.verifyProvider();
  });
});
```

### State Handlers

State handlers set up the provider's data to match the `given` clause in the consumer contract. Each unique `given` string needs a corresponding handler.

```javascript
stateHandlers: {
  'user Alice exists': async () => {
    await db.users.create({ name: 'Alice', id: 1 });
  },
  'no users exist': async () => {
    await db.users.deleteAll();
  },
}
```

## CI/CD Integration

### Deployment Safety

The Pact Broker tracks which versions are deployed and verified:

```bash
# Before deploying, check if it's safe
pact-broker can-i-deploy \
  --pacticipant order-service \
  --version $(git rev-parse --short HEAD) \
  --to-environment production
```

This command checks that all consumer contracts have been verified by this version of the provider. If not, it returns a non-zero exit code, blocking deployment.

### Webhook Triggers

Configure the Pact Broker to trigger provider verification whenever a new consumer contract is published:

```
Consumer publishes contract
  -> Broker sends webhook to provider CI
  -> Provider CI runs verification
  -> Result published back to broker
  -> Consumer can check deployment safety
```

## Common Contract Testing Mistakes

| Mistake | Consequence | Fix |
|---------|-------------|-----|
| Over-specifying exact values | Contract breaks on any data change | Use matchers (`like`, `string`, `integer`) |
| No state handlers | Provider can't set up test scenarios | Implement handlers for each `given` clause |
| Not publishing to broker | Contracts only exist locally | Publish in CI, verify automatically |
| Testing non-essential fields | High coupling, frequent breaks | Only include fields the consumer actually uses |
| Skipping error scenarios | Missing 404, 401, 500 contracts | Add contracts for all response codes the consumer handles |

## Contract Evolution

When the provider needs to change the API:

1. **Additive changes** (new fields): Safe. Consumer contracts don't break because they only check fields they use.
2. **Removing fields**: Dangerous. Check if any consumer contract references the field. If yes, coordinate deprecation.
3. **Renaming fields**: Breaking. Equivalent to removing the old name and adding a new one. Requires consumer migration.
4. **Changing types**: Breaking. The consumer's matcher will fail if the type changes.

Always check `can-i-deploy` before making changes. The broker tells you exactly which consumers would break.
