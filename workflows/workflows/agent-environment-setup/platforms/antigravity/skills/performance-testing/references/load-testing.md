# Load Testing

## What is Load Testing

Load testing simulates expected production traffic to verify that a system meets its performance requirements under normal and peak conditions. It answers the question: "Can this system handle the traffic we expect?"

## Load Test Types

### Baseline Test

Run at normal expected traffic levels to establish a performance baseline.

```
Users:    50 concurrent
Duration: 10 minutes
Pattern:  Constant rate
Purpose:  Establish baseline metrics for comparison
```

### Peak Load Test

Run at the highest expected traffic level (e.g., during a campaign or seasonal peak).

```
Users:    500 concurrent (10x normal)
Duration: 30 minutes
Pattern:  Ramp up over 5 minutes, hold for 20 minutes, ramp down
Purpose:  Verify system handles expected peak without degradation
```

### Stress Test

Push beyond expected capacity to find the breaking point.

```
Users:    Start at 100, increase by 100 every 5 minutes
Duration: Until failure or SLO breach
Pattern:  Stepped ramp
Purpose:  Find maximum capacity and failure mode
```

### Soak Test (Endurance)

Run at moderate load for an extended period to detect memory leaks, connection pool exhaustion, and gradual degradation.

```
Users:    200 concurrent
Duration: 4-8 hours
Pattern:  Constant rate
Purpose:  Detect slow resource leaks and degradation over time
```

### Spike Test

Apply sudden traffic spikes to test auto-scaling and recovery behavior.

```
Users:    50 -> 500 instantly -> 50 (within seconds)
Duration: 15 minutes total
Pattern:  Sharp spike
Purpose:  Verify auto-scaling and recovery behavior
```

## k6 Configuration Patterns

### Basic Ramp-Up

```javascript
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '5m', target: 100 },   // Hold
    { duration: '2m', target: 0 },     // Ramp down
  ],
};
```

### Stepped Load

```javascript
export const options = {
  stages: [
    { duration: '3m', target: 100 },
    { duration: '3m', target: 100 },  // Hold at 100
    { duration: '3m', target: 200 },
    { duration: '3m', target: 200 },  // Hold at 200
    { duration: '3m', target: 300 },
    { duration: '3m', target: 300 },  // Hold at 300
    { duration: '2m', target: 0 },    // Ramp down
  ],
};
```

### Multiple Scenarios

```javascript
export const options = {
  scenarios: {
    browse: {
      executor: 'constant-vus',
      vus: 50,
      duration: '10m',
      exec: 'browseCatalog',
    },
    checkout: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 20 },
        { duration: '5m', target: 20 },
      ],
      exec: 'checkoutFlow',
    },
  },
};

export function browseCatalog() {
  http.get(`${BASE_URL}/api/products`);
  sleep(Math.random() * 3 + 1);
}

export function checkoutFlow() {
  // Multi-step checkout
  http.post(`${BASE_URL}/api/cart`, JSON.stringify({ productId: 1 }));
  sleep(2);
  http.post(`${BASE_URL}/api/checkout`);
  sleep(1);
}
```

## Workload Modeling

### Think Time

Real users pause between actions. Without think time, load tests generate unrealistically high request rates per virtual user.

```javascript
// Realistic: 1-5 second think time between actions
sleep(Math.random() * 4 + 1);

// Unrealistic: no think time (machine-gun requests)
// http.get(...); http.get(...); http.get(...);
```

### Request Distribution

Not all endpoints receive equal traffic. Model the distribution:

| Endpoint | Traffic Share | Rationale |
|----------|-------------|-----------|
| GET /api/products | 60% | Browsing is the most common activity |
| GET /api/products/:id | 20% | Product detail views |
| POST /api/cart | 10% | Adding items to cart |
| POST /api/checkout | 5% | Completing purchase |
| POST /api/auth/login | 5% | Authentication |

### Data Variation

Use realistic data variety to avoid cache hits that hide real performance:

```javascript
// Load test data from a file
const products = JSON.parse(open('./test-data/products.json'));
const users = JSON.parse(open('./test-data/users.json'));

export default function () {
  const product = products[Math.floor(Math.random() * products.length)];
  const user = users[Math.floor(Math.random() * users.length)];

  http.get(`${BASE_URL}/api/products/${product.id}`);
}
```

## Thresholds and SLOs

### Defining Thresholds in k6

```javascript
export const options = {
  thresholds: {
    http_req_duration: [
      'p(50)<200',     // p50 under 200ms
      'p(95)<500',     // p95 under 500ms
      'p(99)<1000',    // p99 under 1s
    ],
    http_req_failed: ['rate<0.01'],  // Less than 1% errors
    http_reqs: ['rate>100'],          // At least 100 rps
  },
};
```

### Custom Metric Thresholds

```javascript
const loginDuration = new Trend('login_duration', true);

export const options = {
  thresholds: {
    login_duration: ['p(95)<300'],  // Login-specific SLO
  },
};
```

## Analyzing Results

### Key Metrics

| Metric | What It Tells You |
|--------|-------------------|
| http_req_duration (p50) | Median user experience |
| http_req_duration (p95) | Experience for most users |
| http_req_duration (p99) | Tail latency, worst-case experience |
| http_reqs (rate) | Throughput in requests per second |
| http_req_failed (rate) | Error rate as percentage |
| vus | Active virtual users at any point |
| iteration_duration | Total time per complete user journey |

### Identifying Saturation

The point where adding more users no longer increases throughput:

```
VUs: 100 -> Throughput: 200 rps, p95: 150ms
VUs: 200 -> Throughput: 380 rps, p95: 180ms
VUs: 300 -> Throughput: 400 rps, p95: 350ms   <- Throughput plateauing
VUs: 400 -> Throughput: 410 rps, p95: 800ms   <- Latency spiking
VUs: 500 -> Throughput: 390 rps, p95: 2000ms  <- Throughput declining
```

Saturation point is around 300 VUs. Beyond that, queuing effects degrade performance.

### Result Storage and Comparison

```bash
# Output results to JSON for programmatic analysis
k6 run --out json=results/2025-03-14.json script.js

# Output to InfluxDB for Grafana dashboards
k6 run --out influxdb=http://localhost:8086/k6 script.js

# Output to Grafana Cloud k6
k6 cloud script.js
```

## Common Mistakes

| Mistake | Impact | Correction |
|---------|--------|------------|
| No think time | Unrealistically high rps per VU | Add 1-5 second sleeps |
| Testing only happy paths | Misses error handling performance | Include 4xx and 5xx scenarios |
| Running from same region as server | Hides network latency | Test from multiple regions |
| Ignoring warm-up | JIT/cache cold start skews results | Discard first 1-2 minutes |
| Single endpoint testing | Misses contention between endpoints | Model realistic traffic mix |
