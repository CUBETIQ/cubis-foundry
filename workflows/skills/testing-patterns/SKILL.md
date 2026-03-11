---
name: testing-patterns
description: Design test strategies with unit, integration, and e2e testing. Apply TDD, mocking, fixtures, coverage analysis, and test architecture best practices.
license: Apache-2.0
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot, Gemini CLI
---

# Testing Patterns

## Purpose

Guide test strategy, structure, and implementation across all testing levels. Covers unit, integration, and e2e testing patterns, TDD methodology, mocking strategies, and test architecture.

## When to Use

- Writing tests for new features or bug fixes
- Designing a test strategy for a new project or module
- Debugging flaky or slow tests
- Reviewing test quality and coverage gaps
- Setting up test infrastructure (runners, fixtures, mocks)
- Deciding what level of testing is appropriate

## Instructions

### Step 1 — Choose the Right Test Level

| Level | Tests | Speed | Confidence | When to Use |
|-------|-------|-------|------------|-------------|
| Unit | Individual functions/classes | ms | Logic correctness | Pure logic, calculations, transformers |
| Integration | Module boundaries | 100ms–1s | Components work together | API routes, database queries, service interactions |
| E2E | Full user flows | 5–30s | System works as user expects | Critical paths (signup, checkout, deploy) |

**Testing Trophy** (preferred distribution):
- Many integration tests (highest ROI)
- Some unit tests (fast logic verification)
- Few e2e tests (critical paths only)
- Static analysis as the foundation (TypeScript, linting)

### Step 2 — Write Effective Tests

**Structure every test as Arrange → Act → Assert**:

```typescript
test('calculates total with tax', () => {
  // Arrange
  const items = [{ price: 100 }, { price: 200 }];
  const taxRate = 0.1;

  // Act
  const total = calculateTotal(items, taxRate);

  // Assert
  expect(total).toBe(330);
});
```

**Naming**: Use natural language that describes the behavior:
- DO: `"returns empty array when no items match filter"`
- DON'T: `"test filter"` or `"test1"`

**One assertion per behavior** (not per test):
- One test can have multiple `expect()` calls if they verify the same behavior
- Split separate behaviors into separate tests

### Step 3 — Mock Strategically

**Mock at boundaries, not everywhere**:
- Mock: external APIs, databases, file system, time, randomness
- Don't mock: your own code, simple utilities, data transformations

**Mock patterns**:
```typescript
// Dependency injection (preferred)
function createUserService(db: Database) {
  return { getUser: (id) => db.query('SELECT...', [id]) };
}

// Module mocking (when DI not available)
vi.mock('./database', () => ({
  query: vi.fn().mockResolvedValue([{ id: 1, name: 'Alice' }])
}));
```

**Avoid**:
- Mocking implementation details (private methods, internal state)
- Over-mocking (if you mock everything, you're testing nothing)
- Snapshot tests for behavior (only for serialized output like HTML)

### Step 4 — Handle Test Data

**Factories over fixtures**:
```typescript
function createUser(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    ...overrides,
  };
}

// Usage
const admin = createUser({ role: 'admin' });
```

**Test isolation**:
- Each test creates its own data (no shared mutable state)
- Clean up after integration tests (database, files)
- Use transactions for database tests (rollback after each test)

### Step 5 — Fix Common Test Problems

**Flaky tests**:
- Remove timing dependencies (`setTimeout`, `sleep`)
- Use deterministic data (no `Math.random()` without seeding)
- Await all async operations properly
- Isolate external dependencies (mock network, use test databases)

**Slow tests**:
- Run in parallel when tests are isolated
- Use in-memory databases for integration tests
- Minimize e2e tests — push logic down to unit/integration
- Profile and fix the slowest 10% first

**Brittle tests**:
- Test behavior, not implementation
- Use accessible queries in UI tests (role, label — not CSS selectors)
- Avoid testing framework internals

## Output Format

```
## Test Strategy
[approach and reasoning for test level choices]

## Tests
[test code organized by describe blocks]

## Coverage Notes
[what's tested, what's intentionally not tested, and why]
```

## Examples

**User**: "Write tests for this user registration function"

**Response approach**: Unit tests for validation logic (email format, password strength). Integration test for the full registration flow (validate → hash password → insert DB → send email). Mock the email service and database. Test edge cases (duplicate email, weak password, missing fields).

**User**: "Our test suite takes 20 minutes, help us speed it up"

**Response approach**: Profile the slowest tests. Look for unnecessary e2e tests that could be integration. Check for missing parallelization. Identify shared state causing serial execution. Suggest in-memory database for integration tests.
