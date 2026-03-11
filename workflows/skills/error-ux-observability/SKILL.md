---
name: error-ux-observability
description: Design error experiences, structured logging, distributed tracing, alerting strategies, and user-facing error handling for production systems.
license: Apache-2.0
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot, Gemini CLI
---

# Error UX & Observability

## Purpose

Bridge user-facing error handling and backend observability. Design error experiences that help users recover, while ensuring engineers have the telemetry to diagnose and fix issues quickly.

## When to Use

- Designing error messages, states, and recovery flows for users
- Implementing structured logging and error tracking
- Setting up distributed tracing across services
- Building alerting strategies that reduce noise
- Creating error boundaries and fallback UI
- Debugging production issues with telemetry data

## Instructions

### Step 1 — Design User-Facing Errors

Every error the user sees must answer three questions:
1. **What happened?** (plain language, no stack traces)
2. **Is it their fault or ours?** (affects tone)
3. **What can they do next?** (always give an action)

**Error message structure**:
```
[Title]: Brief description of what went wrong
[Body]: What happened and why
[Action]: Clear next step (retry, change input, contact support)
```

**Good vs Bad error messages**:
| Bad | Good |
|-----|------|
| "Error 500" | "Something went wrong on our end. We're looking into it." |
| "Invalid input" | "Email address must include @ and a domain (e.g., name@example.com)" |
| "Network error" | "Couldn't reach the server. Check your connection and try again." |
| "Null reference exception" | "We couldn't load your profile. Try refreshing the page." |

**Error states in UI**:
- **Inline**: validation errors next to the field that caused them
- **Toast/snackbar**: transient non-critical errors (auto-dismiss in 5-8s)
- **Banner**: persistent issues affecting the whole page
- **Full page**: catastrophic failures with recovery path
- **Empty state**: data couldn't load — show illustration + retry button

### Step 2 — Implement Error Boundaries

**Frontend**:
- Catch errors at route/feature boundaries, not globally
- Show fallback UI that lets the user continue elsewhere
- Log the error with context (component tree, user action, state)
- Auto-report to error tracking service

**Backend**:
- Return structured error responses:
```json
{
  "error": {
    "code": "PAYMENT_DECLINED",
    "message": "Your card was declined. Please try a different payment method.",
    "details": { "reason": "insufficient_funds" },
    "requestId": "req_abc123"
  }
}
```
- Map internal errors to user-safe messages (never expose stack traces, SQL, or internal paths)
- Include request ID for correlation
- Use appropriate HTTP status codes (don't 200 everything)

### Step 3 — Structured Logging

**Every log entry should include**:
- Timestamp (ISO 8601, UTC)
- Level (debug, info, warn, error)
- Message (human-readable)
- Request ID / correlation ID
- Service name and version
- User ID (if authenticated)
- Relevant context (input parameters, affected resource)

**Log levels**:
| Level | When | Example |
|-------|------|---------|
| error | Something failed that shouldn't have | Database connection lost |
| warn | Something unusual but handled | Rate limit approaching |
| info | Normal business events | User signed up, order placed |
| debug | Development troubleshooting | Query parameters, cache hit/miss |

**Rules**:
- Never log secrets, passwords, tokens, or PII
- Use structured format (JSON) for machine parsing
- Include enough context to diagnose without reproducing
- Log at the boundary (entry/exit of service calls)

### Step 4 — Distributed Tracing

**Trace propagation**:
- Every request gets a trace ID at the edge
- Pass trace ID through all service calls (HTTP headers, message metadata)
- Each service creates spans for its operations
- Spans include: operation name, duration, status, attributes

**What to trace**:
- HTTP requests (method, path, status, latency)
- Database queries (operation, table, duration)
- External API calls (service, endpoint, latency)
- Queue operations (publish, consume, processing time)
- Cache operations (hit/miss, key pattern, latency)

### Step 5 — Alerting Strategy

**Alert on symptoms, not causes**:
- DO alert: "Error rate > 1% for 5 minutes"
- DON'T alert: "CPU > 80%" (that's a dashboard metric, not an alert)

**Reduce noise**:
- Alert on SLO burn rate, not individual errors
- Group related alerts (one page, not 50)
- Required for every alert: runbook link, severity, escalation path
- Review alert fatigue monthly — suppress alerts that never led to action

## Output Format

```
## Error Handling Design
[user-facing error strategy]

## Observability Implementation
[logging, tracing, and metrics setup]

## Alerting Rules
[what triggers alerts and who responds]

## Runbook
[diagnosis and resolution steps for common errors]
```

## Examples

**User**: "Design error handling for our checkout flow"

**Response approach**: Map all failure modes (payment declined, inventory gone, session expired, network error). Design user-facing messages for each. Implement retry logic for transient errors. Add structured logging at every decision point. Set up alerts on checkout error rate.

**User**: "We can't figure out why requests are slow in production"

**Response approach**: Add distributed tracing to identify the slow span. Structured logging at service boundaries. Dashboard for p50/p95/p99 latency. Alert on latency SLO burn rate. Runbook for common latency causes.
