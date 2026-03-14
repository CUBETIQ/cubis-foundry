# Assertion Patterns

## Assertion Design Principles

### Assert on Behavior, Not Implementation

Good assertions verify what the code does (observable outcomes), not how it does it (internal mechanisms).

```typescript
// Good: asserts the observable result
const result = calculator.add(2, 3);
expect(result).toBe(5);

// Bad: asserts implementation details
expect(calculator._lastOperation).toBe('addition');
expect(calculator._operandStack).toEqual([2, 3]);
```

### One Logical Assertion Per Test

Each test verifies a single behavioral outcome. Multiple `expect` statements are fine when they verify different facets of the same outcome.

```typescript
// Good: multiple expects for one concept (the created user)
test('createUser returns a complete user profile', () => {
  const user = createUser({ name: 'Alice', email: 'alice@test.com' });
  expect(user.name).toBe('Alice');
  expect(user.email).toBe('alice@test.com');
  expect(user.id).toBeDefined();
  expect(user.createdAt).toBeInstanceOf(Date);
});

// Bad: testing two unrelated behaviors
test('user operations work', () => {
  const user = createUser({ name: 'Alice' });
  expect(user.name).toBe('Alice');      // creation
  deleteUser(user.id);
  expect(getUser(user.id)).toBeNull();  // deletion -- separate test
});
```

### Assert the Minimum Necessary

Over-specific assertions break when irrelevant details change. Assert only what matters for the test scenario.

```typescript
// Over-specific: breaks if any field is added
expect(response.body).toEqual({
  id: 1,
  name: 'Alice',
  email: 'alice@test.com',
  createdAt: '2025-01-15T00:00:00Z',
  updatedAt: '2025-01-15T00:00:00Z',
});

// Better: assert only the fields this test cares about
expect(response.body).toMatchObject({
  name: 'Alice',
  email: 'alice@test.com',
});
expect(response.body.id).toBeDefined();
```

## Common Assertion Patterns

### Equality Assertions

```typescript
// Exact equality (primitives)
expect(result).toBe(42);
expect(name).toBe('Alice');

// Deep equality (objects, arrays)
expect(result).toEqual({ id: 1, name: 'Alice' });
expect(items).toEqual([1, 2, 3]);

// Approximate equality (floating point)
expect(0.1 + 0.2).toBeCloseTo(0.3, 5);
```

### Truthiness Assertions

```typescript
expect(user).toBeDefined();
expect(user).not.toBeNull();
expect(user).toBeTruthy();
expect(emptyResult).toBeFalsy();
```

### Collection Assertions

```typescript
// Contains specific element
expect(tags).toContain('javascript');

// Contains element matching criteria
expect(users).toContainEqual(expect.objectContaining({ name: 'Alice' }));

// Length
expect(results).toHaveLength(3);

// Array of specific type
expect(ids).toEqual(expect.arrayContaining([1, 2, 3]));
```

### Exception Assertions

```typescript
// Synchronous throw
expect(() => validate(null)).toThrow();
expect(() => validate(null)).toThrow(ValidationError);
expect(() => validate(null)).toThrow('Input cannot be null');

// Async rejection
await expect(fetchUser(-1)).rejects.toThrow(NotFoundError);
await expect(fetchUser(-1)).rejects.toThrow('User not found');
```

### Partial Matching

```typescript
// Object with specific properties (ignores extra)
expect(user).toMatchObject({
  name: 'Alice',
  role: 'admin',
});

// String containing substring
expect(errorMessage).toContain('invalid email');
expect(log).toMatch(/Error: .* failed/);

// Flexible matchers
expect(response).toEqual({
  id: expect.any(Number),
  name: expect.any(String),
  timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}/),
});
```

## Custom Assertions

### When to Create Custom Matchers

Create custom matchers when:
- The same complex assertion appears in many tests.
- The assertion logic requires multiple steps that obscure the test's intent.
- The default failure message is unhelpful.

### Jest Custom Matcher Example

```typescript
// Define the matcher
expect.extend({
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    return {
      pass,
      message: () =>
        pass
          ? `Expected "${received}" not to be a valid email`
          : `Expected "${received}" to be a valid email address`,
    };
  },
});

// Use in tests
expect(user.email).toBeValidEmail();
expect('not-an-email').not.toBeValidEmail();
```

### pytest Custom Assertion Example

```python
# Custom assertion with clear failure message
def assert_valid_user(user):
    assert user is not None, "User should not be None"
    assert user.id is not None, f"User {user.name} should have an ID"
    assert "@" in user.email, f"User email '{user.email}' is invalid"
    assert user.created_at is not None, "User should have a creation timestamp"

# Usage
def test_create_user():
    user = create_user(name="Alice", email="alice@test.com")
    assert_valid_user(user)
```

## Assertion Anti-Patterns

### Tautological Assertions

```typescript
// Bad: always passes, tests nothing
expect(true).toBe(true);
expect(1 + 1).toBe(2);

// Bad: asserts that the mock returns what you told it to
const mock = jest.fn().mockReturnValue(42);
expect(mock()).toBe(42);  // This tests Jest, not your code
```

### Missing Assertions

```typescript
// Bad: no assertion -- test passes even if function is broken
test('should process the order', async () => {
  const order = createOrder(items);
  await processOrder(order);
  // Where is the expect?
});
```

### Assertion Roulette

```typescript
// Bad: when this fails, which assertion broke?
test('user validation', () => {
  expect(validate('')).toBe(false);
  expect(validate('a')).toBe(false);
  expect(validate('ab')).toBe(false);
  expect(validate('abc')).toBe(true);
  expect(validate('abcdefghijklmnop')).toBe(false);
});

// Better: separate tests with descriptive names
test('rejects empty input', () => { expect(validate('')).toBe(false); });
test('rejects single character', () => { expect(validate('a')).toBe(false); });
test('accepts three characters', () => { expect(validate('abc')).toBe(true); });
```

## Parameterized Assertions

When the same logic needs testing with many inputs, use parameterized tests instead of duplicating tests:

```typescript
// Jest: test.each
test.each([
  ['alice@test.com', true],
  ['bob@example.org', true],
  ['not-an-email', false],
  ['@missing-local.com', false],
  ['missing-domain@', false],
  ['', false],
])('validate(%s) returns %s', (input, expected) => {
  expect(validateEmail(input)).toBe(expected);
});
```

```python
# pytest: parametrize
@pytest.mark.parametrize("input,expected", [
    ("alice@test.com", True),
    ("not-an-email", False),
    ("", False),
])
def test_validate_email(input, expected):
    assert validate_email(input) == expected
```

Parameterized tests keep the test file concise while covering many cases. Each parameter set appears as a separate test in the output, making failures easy to identify.

## Assertion Message Guidelines

Always include a custom message when the default failure output is ambiguous:

```python
# Without message: "AssertionError: False is not True"
assert result > 0

# With message: "AssertionError: Expected discount to be positive for premium users, got -5"
assert result > 0, f"Expected discount to be positive for premium users, got {result}"
```

Good assertion messages answer: What was expected? What was received? Under what conditions?
