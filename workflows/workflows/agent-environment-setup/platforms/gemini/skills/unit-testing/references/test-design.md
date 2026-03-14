# Test Design Principles

## Structural Patterns

### Arrange-Act-Assert (AAA)

Every unit test follows three distinct phases:

```
Arrange: Set up the preconditions and inputs.
Act:     Execute the unit under test.
Assert:  Verify the expected outcome.
```

Keep each phase visually separated with a blank line or comment. When a test has no Arrange phase (testing default behavior), that is acceptable -- document why.

### Given-When-Then (BDD Style)

An alternative framing useful for behavior-oriented tests:

```
Given: A user with an expired subscription.
When:  The user attempts to access premium content.
Then:  The system returns a 403 Forbidden response.
```

Use Given-When-Then when writing specifications that non-developers will read. Use AAA for purely technical tests.

## Naming Conventions

### Method Under Test + Scenario + Expected Result

```
calculateDiscount_withExpiredCoupon_returnsZero
getUserById_whenUserDoesNotExist_returnsNull
sendEmail_withInvalidAddress_throwsValidationError
```

This pattern produces test names that serve as living documentation. When a test fails in CI, the name alone should tell you what broke and under what conditions.

### Avoiding Vague Names

Bad: `testCalculation`, `checkUser`, `itWorks`
Good: `calculateTotal_withEmptyCart_returnsZero`, `getUser_withDeletedAccount_returnsNull`

## Test Scope Guidelines

### What to Test

- Public methods and their return values.
- Observable side effects (database writes, events emitted, messages sent).
- Error handling behavior (exception types, error messages, fallback values).
- Boundary conditions (empty inputs, maximum values, null, undefined).
- State transitions in stateful objects.

### What Not to Test

- Private methods directly (test them through the public interface).
- Framework or library internals (trust that lodash.map works).
- Trivial getters/setters with no logic.
- Implementation details that may change during refactoring.

## Test Independence

Each test must be runnable in isolation, in any order, and produce the same result. This means:

- No shared mutable state between tests.
- Each test sets up its own preconditions in the Arrange phase.
- Teardown restores any global state modified during the test.
- No file system, network, or database access (those belong in integration tests).

## Test Granularity

### One Logical Assertion Per Test

A test should verify a single behavioral outcome. Multiple assertions are acceptable when they verify different aspects of the same outcome:

```python
# Good: multiple assertions about one outcome
def test_create_user_returns_complete_profile():
    user = create_user(name="Alice", email="alice@test.com")
    assert user.name == "Alice"
    assert user.email == "alice@test.com"
    assert user.id is not None
    assert user.created_at is not None

# Bad: testing multiple behaviors in one test
def test_user_operations():
    user = create_user(name="Alice")
    assert user.name == "Alice"       # Creation behavior
    user.update_name("Bob")
    assert user.name == "Bob"          # Update behavior -- separate test
```

## Test Organization

### File Structure

Mirror the source directory structure:

```
src/
  services/
    UserService.ts
  utils/
    validators.ts
tests/
  services/
    UserService.test.ts
  utils/
    validators.test.ts
```

### Grouping with Describe/Context Blocks

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    test('with valid data creates and returns user', ...);
    test('with duplicate email throws ConflictError', ...);
    test('with missing name throws ValidationError', ...);
  });

  describe('deleteUser', () => {
    test('with existing user removes from database', ...);
    test('with non-existent user throws NotFoundError', ...);
  });
});
```

## Edge Case Checklist

When designing tests for a function, systematically check:

| Category        | Test Cases                                    |
|----------------|----------------------------------------------|
| Empty inputs    | null, undefined, empty string, empty array    |
| Boundary values | 0, -1, MAX_INT, minimum/maximum valid values |
| Type edges      | NaN, Infinity, very long strings              |
| Collections     | Empty, single element, many elements          |
| Concurrency     | Parallel calls, race conditions               |
| Error paths     | Network failure, timeout, malformed data      |

## Anti-Patterns to Avoid

| Anti-Pattern         | Problem                                        | Fix                                    |
|---------------------|-----------------------------------------------|----------------------------------------|
| Test interdependence | Tests pass in one order, fail in another       | Make each test fully self-contained    |
| Logic in tests       | if/else/loops in test code                     | Parameterize instead                   |
| Overly DRY tests     | Shared setup obscures what each test does      | Repeat setup for clarity               |
| Testing the mock     | Asserting mock behavior instead of real logic  | Assert on the unit's output            |
| Eager test deletion  | Deleting "annoying" failing tests              | Fix the test or the production code    |
