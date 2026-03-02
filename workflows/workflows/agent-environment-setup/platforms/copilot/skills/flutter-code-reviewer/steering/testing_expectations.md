# Testing expectations for reviews

When a PR adds or modifies provider/controller logic, require tests:

## Controllers (AsyncNotifier/Notifier)
- Happy path returns expected state
- Failure path maps to UI state (message/code)
- refresh() re-runs build (invalidateSelf)
- paging: loadMore merges immutably & stops when no more

## Repositories
- cache hit/miss behavior
- TTL expiry (if implemented)
- mapping errors into Failure types

## Widgets
- verifies loading/error/data renders
- verifies actions call notifier methods (button taps)

If tests are missing:
- mark as MAJOR (or BLOCKER if change is risky: auth/session, payment, data deletion).
