# PR Review Checklist (copy/paste)

## Architecture
- [ ] Presentation does not call repository/data sources directly
- [ ] Domain has no framework-specific imports (Flutter/Riverpod/Dio/Isar/GetX)
- [ ] Data implements repository interface; errors mapped to Failure/Result
- [ ] Dependency injection used correctly (no hardcoded dependencies)
- [ ] Single responsibility principle followed

## State Management

### Riverpod Projects
- [ ] No side effects in build
- [ ] `ref.watch` in build, `ref.read` in callbacks, `ref.listen` for side effects
- [ ] `build()` is pure, mutations in methods
- [ ] Family params stable (==/hashCode)
- [ ] No in-place mutation of emitted state
- [ ] `ref.mounted` checked after async operations

### GetX Projects
- [ ] Controllers properly disposed
- [ ] Observables used correctly (.obs, Rx types)
- [ ] No memory leaks from subscriptions
- [ ] GetBuilder/Obx used appropriately

### Bloc/Cubit Projects
- [ ] Events/states are immutable
- [ ] No side effects in mapEventToState
- [ ] Bloc properly closed
- [ ] BlocProvider scope is correct

## UI

### Design System Compliance (if project has design system)
- [ ] Uses project's design tokens (colors, spacing, typography)
- [ ] Uses project's component library (not raw Flutter widgets)
- [ ] No hardcoded colors (`Color(0xFF...)`, `Colors.white`)
- [ ] No hardcoded spacing (`SizedBox(height: 16)`)
- [ ] Theme-aware colors used where appropriate

### General UI Best Practices
- [ ] `select()` or equivalent used to minimize rebuilds
- [ ] Large lists use `ListView.builder` or equivalent
- [ ] List items have stable keys when needed
- [ ] `const` widgets used where possible
- [ ] No expensive computation in build methods

## Networking/Errors
- [ ] No secrets in logs
- [ ] Errors mapped to typed Failure/Error classes
- [ ] Timeouts configured appropriately
- [ ] Cancellation behavior reasonable
- [ ] Retry logic doesn't expose sensitive data

## Tests
- [ ] Controller/provider/bloc unit tests added
- [ ] Failure/error paths tested
- [ ] Widget test covers loading/error/data states
- [ ] Mocks used appropriately (no real network calls)
- [ ] Edge cases covered

## Code Quality
- [ ] Files use lowercase_with_underscores naming
- [ ] Types use UpperCamelCase
- [ ] Methods use verb-first naming (fetchUser, submitForm)
- [ ] One main type per file
- [ ] No commented-out code
- [ ] No TODO without issue reference
