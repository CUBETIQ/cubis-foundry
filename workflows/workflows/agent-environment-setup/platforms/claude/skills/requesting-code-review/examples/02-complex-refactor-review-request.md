# Example: Complex Refactor Review Request

## Scenario

A senior developer has completed a large refactoring of the notification system, moving from a synchronous in-process model to an async event-driven architecture using a message queue. The change is 600 lines across 15 files and needs to be reviewed by multiple people with different expertise.

## User Prompt

> I just finished refactoring our notification system from synchronous to async. Here is the summary:
>
> - Replaced direct function calls to `sendEmail()`, `sendSMS()`, `sendPush()` with events published to a RabbitMQ queue
> - Added a notification worker service that consumes events and dispatches to the appropriate channel
> - Added retry logic with exponential backoff (3 retries, max 30s delay)
> - Added a dead letter queue for failed notifications
> - Migrated 12 call sites across 6 services to use the new event-based API
> - Added a `notifications` database table to track delivery status
>
> Total: ~600 lines across 15 files. This is bigger than I wanted but the migration had to be atomic — we cannot have some call sites using the old pattern and some using the new one.
>
> The team is:
> - Elena: principal engineer, designed the original notification system, on PTO until Thursday
> - Frank: backend lead, RabbitMQ expert, available now
> - Grace: owns 3 of the 6 services that were migrated, available now
> - Hassan: DevOps, manages the RabbitMQ cluster, available tomorrow
>
> This is not urgent — no deadline. But I want thorough review because this touches a lot of surfaces. Help me prepare the review request.

## Expected Response

### PR Title

Refactor notification system to async event-driven architecture

### PR Description

#### What

Replaces the synchronous notification dispatch (`sendEmail()`, `sendSMS()`, `sendPush()`) with an async event-driven architecture using RabbitMQ. All 12 notification call sites across 6 services now publish events to a message queue, and a new worker service consumes and dispatches notifications.

#### Why

The synchronous approach causes three problems:
1. **Latency**: Sending notifications inline blocks the request (email API calls take 200-500ms).
2. **Reliability**: If the email provider is down, the entire request fails even though the core operation succeeded.
3. **Scalability**: Notification volume during peak events (sales, password resets) creates cascading slowdowns across services.

The async approach decouples notification dispatch from business logic, adds retry capability, and enables independent scaling of notification throughput. Related: Issue #156 (notification latency), Issue #201 (email provider outages).

#### How

**Architecture change**:
```
Before: Service -> sendEmail() -> Email API (synchronous, inline)
After:  Service -> publish(NotificationEvent) -> RabbitMQ -> Worker -> Email API (async, decoupled)
```

**Key components**:
- `NotificationEvent` schema: type, recipient, template, payload, metadata
- `notification-worker`: new service that consumes events, dispatches via the appropriate channel, and tracks delivery status
- Retry policy: exponential backoff (1s, 4s, 16s), max 3 attempts, then dead letter queue
- `notifications` table: tracks event_id, status (queued/sent/failed/dead-lettered), attempts, timestamps

**Migration approach**:
- All 12 call sites migrated atomically in this PR to avoid split-brain behavior
- Old `sendEmail/SMS/Push` functions replaced with `publishNotification()` wrapper
- Backward-compatible: if RabbitMQ is unreachable, falls back to synchronous dispatch with a warning log

#### Commit Structure

Review commit-by-commit for the best experience:
1. `Add NotificationEvent schema and RabbitMQ publisher` — the new event model and publishing layer
2. `Add notification worker service with retry logic` — the consumer, dispatcher, and retry policy
3. `Add notifications tracking table and migration` — database schema for delivery tracking
4. `Migrate call sites to event-based notification API` — the 12 call site migrations across 6 services
5. `Add integration tests for async notification flow` — end-to-end tests with RabbitMQ test container
6. `Add dead letter queue handling and alerting` — DLQ consumer and PagerDuty alert integration

#### Testing

- Unit tests for NotificationEvent validation, retry logic, and backoff calculation
- Integration tests using Testcontainers with a real RabbitMQ instance
- End-to-end test: publish event, verify worker consumes and dispatches, verify delivery status recorded
- Manual testing: killed RabbitMQ mid-dispatch to verify fallback behavior
- Load test: 1,000 events/second sustained for 5 minutes, no message loss
- **Not tested**: Behavior during RabbitMQ cluster failover (need Hassan's help to simulate)

#### Known Limitations

- The fallback to synchronous dispatch means a RabbitMQ outage degrades performance but does not prevent notifications. This is a conscious trade-off for the migration period. Post-migration, we should consider queuing to a local buffer instead.
- The dead letter queue alert goes to PagerDuty but there is no self-service retry UI yet. Failed notifications must be replayed manually via `rabbitmqadmin`.
- No rate limiting per recipient. A bug in a calling service could spam a user with notifications. Follow-up: Issue #234.

#### Risk Areas

1. **Call site migration correctness** (high risk) — 12 call sites across 6 services must all produce correctly-shaped events. A malformed event silently enters the DLQ.
2. **Retry and backoff logic** (medium risk) — incorrect backoff could hammer the email provider or create infinite retry loops.
3. **Database migration** (low risk) — additive only, new table, no existing schema changes.
4. **RabbitMQ configuration** (medium risk) — queue declarations, exchange bindings, and DLQ routing must match between publisher and consumer.

### Review Guidance

- **Commit-by-commit review recommended**: Each commit builds on the previous one. Reviewing the squashed diff will be overwhelming at 600 lines.
- **Focus areas by reviewer**:
  - Frank: RabbitMQ patterns (exchange/queue topology, message durability, ack handling, retry logic)
  - Grace: Call site migrations in the 3 services she owns (verify event payloads match the templates each service uses)
  - Hassan: RabbitMQ configuration, deployment concerns, monitoring and alerting setup
  - Elena: Overall architecture review when she returns from PTO (non-blocking)
- **Architecture decision to validate**: The synchronous fallback when RabbitMQ is down. Is this the right trade-off, or should we fail fast and rely on the calling service to handle the error?
- **Depth**: Deep review for the worker service and retry logic. Standard review for call site migrations. Quick review for the database migration.

### Reviewer Recommendation

| Reviewer | Focus Area | Priority | Timeline |
|----------|-----------|----------|----------|
| Frank | RabbitMQ architecture, retry logic, message durability | Primary | This week |
| Grace | Call site migrations in her 3 services | Primary | This week |
| Hassan | RabbitMQ config, deployment, monitoring | Secondary | When available tomorrow |
| Elena | Overall architecture sign-off | Advisory | After PTO Thursday (non-blocking) |

**Urgency**: Low — no deadline. Prefer thorough review over speed. Happy to wait for Elena's feedback before merging if the team prefers.

## Why This Response Works

- The PR description addresses the "why" before the "how," helping reviewers understand the motivation.
- The architecture diagram (before/after) gives reviewers a mental model before diving into code.
- The commit structure guide enables progressive review of a large change.
- Each reviewer gets specific focus areas matching their expertise, reducing duplicated effort.
- The risk areas are ranked so reviewers allocate attention proportionally.
- Known limitations and follow-up issues demonstrate the author has thought about completeness.
- The non-urgent timeline with an advisory review from Elena shows mature process awareness.
- The architecture question (synchronous fallback) invites the kind of feedback that improves the design.
