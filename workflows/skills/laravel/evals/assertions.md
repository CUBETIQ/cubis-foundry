# Laravel Skill Assertions

## Eval 1: API Resource with Eloquent Relationships

| # | Assertion | Type | Expected Value | Rationale |
|---|-----------|------|----------------|-----------|
| 1 | Uses JsonResource | contains | `JsonResource` | API Resources are the canonical Laravel pattern for shaping JSON output. Raw model `toArray()` leaks schema internals. |
| 2 | Eager-loads relationships | contains | `with(` | Eager loading with `with()` prevents N+1 queries when serializing related models through API Resources. |
| 3 | Defines belongsTo | contains | `belongsTo` | The Order-to-Customer relationship must be explicitly defined on the model for Eloquent to resolve it. |
| 4 | Defines hasMany | contains | `hasMany` | The Order-to-OrderItems relationship must be explicitly defined for nested resource serialization. |
| 5 | Registers routes | contains | `Route::` | Route registration is required to expose the API Resource controller to HTTP clients. |

## Eval 2: Queue-Based Job Processing

| # | Assertion | Type | Expected Value | Rationale |
|---|-----------|------|----------------|-----------|
| 1 | Implements ShouldQueue | contains | `implements ShouldQueue` | The ShouldQueue interface is required for Laravel to dispatch the job to a queue driver instead of running it synchronously. |
| 2 | Defines backoff | contains | `backoff` | Exponential or stepped backoff prevents thundering-herd retries against a failing third-party API. |
| 3 | Implements failed() | contains | `failed(` | The `failed()` method is the designated hook for handling permanent failures after all retries are exhausted. |
| 4 | Dispatches the job | contains | `dispatch(` | The job must be dispatched from the controller or service to enter the queue pipeline. |
| 5 | Uses event dispatch | contains | `event(` | Post-payment side effects (notifications, audit logs) should be decoupled via events to keep the job focused. |
