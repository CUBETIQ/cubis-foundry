# Example: Load Testing an API Gateway with k6

## Context

An API gateway handles user authentication and proxies requests to downstream services. A marketing campaign is expected to drive 5x normal traffic. The team needs to validate the system can handle the spike.

## User Prompt

> Our API gateway normally handles 200 requests per second. We expect a 5x spike next week from a marketing email blast. Design a k6 load test for the /api/auth/login and /api/users/me endpoints. Show me the full test script, SLOs, and how to interpret the results.

## Skill Response

### Performance Objectives (SLOs)

| Metric       | Target (Normal) | Target (5x Load) | Failure Threshold |
|-------------|----------------|-------------------|-------------------|
| p50 Latency  | < 100ms        | < 200ms           | > 500ms           |
| p95 Latency  | < 300ms        | < 800ms           | > 2000ms          |
| p99 Latency  | < 500ms        | < 1500ms          | > 3000ms          |
| Throughput   | 200 rps        | 1000 rps          | < 800 rps         |
| Error Rate   | < 0.1%         | < 0.5%            | > 1%              |

### k6 Test Script

```javascript
// load-tests/api-gateway-load.js
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const loginLatency = new Trend('login_latency', true);
const profileLatency = new Trend('profile_latency', true);
const errorRate = new Rate('errors');

// Test configuration: ramp up to 5x, hold, then ramp down
export const options = {
  stages: [
    { duration: '2m', target: 50 },    // Warm-up to baseline
    { duration: '3m', target: 50 },    // Hold at baseline (200 rps)
    { duration: '5m', target: 250 },   // Ramp to 5x load (1000 rps)
    { duration: '5m', target: 250 },   // Hold at peak
    { duration: '2m', target: 0 },     // Ramp down (recovery test)
  ],
  thresholds: {
    'login_latency': ['p(95)<800', 'p(99)<1500'],
    'profile_latency': ['p(95)<800', 'p(99)<1500'],
    'errors': ['rate<0.005'],           // < 0.5% error rate
    'http_req_duration': ['p(95)<800'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://staging-api.example.com';

// Test data: pre-generated user credentials
const users = JSON.parse(open('./test-data/users.json'));

export default function () {
  const user = users[Math.floor(Math.random() * users.length)];

  group('Login Flow', () => {
    // Step 1: Authenticate
    const loginRes = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({
        email: user.email,
        password: user.password,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    loginLatency.add(loginRes.timings.duration);

    const loginOk = check(loginRes, {
      'login status 200': (r) => r.status === 200,
      'login has token': (r) => r.json('token') !== undefined,
      'login under 800ms': (r) => r.timings.duration < 800,
    });

    if (!loginOk) {
      errorRate.add(1);
      return; // Skip profile fetch if login failed
    }
    errorRate.add(0);

    const token = loginRes.json('token');

    // Think time: simulate user reading the dashboard
    sleep(Math.random() * 2 + 1); // 1-3 seconds

    // Step 2: Fetch user profile
    const profileRes = http.get(`${BASE_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    profileLatency.add(profileRes.timings.duration);

    const profileOk = check(profileRes, {
      'profile status 200': (r) => r.status === 200,
      'profile has email': (r) => r.json('email') !== undefined,
      'profile under 800ms': (r) => r.timings.duration < 800,
    });

    if (!profileOk) errorRate.add(1);
    else errorRate.add(0);
  });

  // Think time between iterations
  sleep(Math.random() * 3 + 2); // 2-5 seconds
}
```

### Running the Test

```bash
# Against staging environment
k6 run --out json=results.json \
  -e BASE_URL=https://staging-api.example.com \
  load-tests/api-gateway-load.js

# With Grafana Cloud k6 for dashboard visualization
k6 cloud load-tests/api-gateway-load.js
```

### Interpreting Results

```
     scenarios: (100.00%) 1 scenario, 250 max VUs, 17m30s max duration
     ...
     ✓ login status 200........: 99.7%  ✓ 48231  ✗ 145
     ✓ login has token..........: 99.7%  ✓ 48231  ✗ 145
     ✗ login under 800ms........: 94.2%  ✓ 45432  ✗ 2799
       ↳ INVESTIGATION NEEDED: 5.8% of logins exceeded 800ms

     login_latency...........: avg=187ms  p(50)=142ms  p(95)=623ms  p(99)=1289ms
     profile_latency.........: avg=95ms   p(50)=72ms   p(95)=312ms  p(99)=687ms
     errors..................: 0.30%  ✓ 290  ✗ 96172

     ✓ p(95) login_latency < 800ms
     ✓ p(99) login_latency < 1500ms
     ✓ error rate < 0.5%
```

### Analysis

| Finding | Severity | Evidence | Recommendation |
|---------|----------|----------|----------------|
| Login p95 at 623ms (target: 800ms) | Medium | Only 177ms headroom | Profile login endpoint; consider connection pool tuning |
| 5.8% of logins exceeded 800ms | High | Concentrated during ramp-up phase | Investigate cold-start behavior; pre-warm connection pools |
| Profile endpoint well within SLOs | Low | p99 at 687ms vs 1500ms target | No action needed |
| Error rate 0.3% at peak | Low | Within 0.5% threshold | Monitor during real event |

### Resource Monitoring Checklist

During the test, the following should be tracked on the server dashboard:
- CPU utilization per pod/instance
- Memory usage and garbage collection pauses
- Database connection pool usage (active vs. idle)
- Network bandwidth and connection count
- Downstream service response times
