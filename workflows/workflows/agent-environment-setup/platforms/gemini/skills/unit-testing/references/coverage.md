# Coverage Analysis

## Coverage Metrics Explained

### Line Coverage

Measures the percentage of executable lines that were executed during testing.

```python
def calculate_discount(price, is_member):
    if is_member:              # Line 1 - covered if any test runs this function
        discount = price * 0.1 # Line 2 - covered only if is_member=True tested
    else:
        discount = 0           # Line 3 - covered only if is_member=False tested
    return discount            # Line 4 - covered if any test runs this function
```

- 100% line coverage: tests with both `is_member=True` and `is_member=False`.
- 75% line coverage: only one branch tested, one line never executed.

**Limitation:** Line coverage cannot detect missing tests for values that are never checked. If no test verifies the return value, the line is "covered" but the behavior is unverified.

### Branch Coverage

Measures whether each boolean sub-expression has been evaluated to both true and false.

```python
def apply_coupon(price, coupon_code, is_active):
    if coupon_code and is_active:    # Two boolean branches
        return price * 0.8
    return price
```

Branch coverage requires four test cases:
1. `coupon_code=True, is_active=True` -- both true.
2. `coupon_code=True, is_active=False` -- first true, second false.
3. `coupon_code=False, is_active=True` -- first false (short-circuit).
4. `coupon_code=False, is_active=False` -- both false.

**Why it matters:** Line coverage might show 100% with only cases 1 and 4. Branch coverage exposes the missing combinations.

### Function Coverage

Measures the percentage of defined functions that were called at least once. Useful for finding dead code or completely untested modules.

### Mutation Coverage

Mutation testing modifies production code (introduces "mutants") and checks if tests detect the change. If a mutant survives (tests still pass after the change), the test suite has a blind spot.

Common mutations:
- Change `>` to `>=`
- Replace `true` with `false`
- Remove a method call
- Change `+` to `-`

**Tools:** Stryker (JavaScript/TypeScript), mutmut (Python), pitest (Java).

Mutation coverage is the most rigorous metric but also the most expensive to compute. Use it selectively on critical business logic, not across the entire codebase.

## Interpreting Coverage Reports

### Coverage as Diagnostic, Not Target

Coverage metrics reveal where tests are missing. They do not prove that existing tests are good. A test that executes every line but asserts nothing provides 100% line coverage and zero confidence.

### Meaningful Coverage Targets

| Codebase Area          | Recommended Target | Rationale                              |
|-----------------------|-------------------|----------------------------------------|
| Business logic         | 90%+ line, 80%+ branch | High defect cost, stable interfaces  |
| API controllers        | 70%+ line          | Tested more thoroughly by integration  |
| Utility/helper code    | 95%+ line          | Pure functions are easy to test        |
| Generated code         | 0% (exclude)       | Not authored by humans, not maintained |
| Configuration/startup  | 30-50% line        | Tested by integration/E2E             |

### Reading Coverage Gaps

When coverage is low, analyze *what* is uncovered:

1. **Uncovered error handlers** -- Often the most important code to test. Missing error path tests are high-risk gaps.
2. **Uncovered branches in conditionals** -- Suggests edge cases that have not been considered.
3. **Uncovered functions** -- May be dead code (remove it) or untested features (add tests).
4. **Uncovered catch blocks** -- Often indicates that error injection is not part of the test strategy.

### Coverage Ratchet

A coverage ratchet prevents coverage from decreasing. Configure CI to fail if coverage drops below the current level:

```json
// jest.config.js
{
  "coverageThreshold": {
    "global": {
      "lines": 85,
      "branches": 75,
      "functions": 80,
      "statements": 85
    }
  }
}
```

Update the threshold upward as coverage improves. Never lower it.

## Tool Configuration

### Jest (JavaScript/TypeScript)

```bash
# Generate coverage report
npx jest --coverage

# Output formats: text, lcov (for CI), html (for review)
npx jest --coverage --coverageReporters text lcov html
```

### pytest (Python)

```bash
# Install coverage plugin
pip install pytest-cov

# Run with coverage
pytest --cov=src --cov-report=html --cov-report=term-missing

# Fail if below threshold
pytest --cov=src --cov-fail-under=85
```

### Go

```bash
# Run tests with coverage
go test -coverprofile=coverage.out ./...

# Generate HTML report
go tool cover -html=coverage.out -o coverage.html

# Show coverage percentage
go tool cover -func=coverage.out
```

## Coverage in CI/CD

### Automated Coverage Tracking

Store coverage reports as CI artifacts and track trends over time:

```yaml
# GitHub Actions example
- name: Run tests with coverage
  run: npm test -- --coverage --coverageReporters json-summary

- name: Check coverage threshold
  run: |
    COVERAGE=$(jq '.total.lines.pct' coverage/coverage-summary.json)
    echo "Line coverage: ${COVERAGE}%"
    if (( $(echo "$COVERAGE < 85" | bc -l) )); then
      echo "Coverage below 85% threshold"
      exit 1
    fi
```

### Pull Request Coverage Comments

Tools like Codecov, Coveralls, or custom scripts can comment on PRs with coverage diff:

```
Coverage: 87.3% (+0.5%)
New lines covered: 42/45 (93.3%)
Uncovered new lines:
  src/services/PaymentService.ts:142 -- catch block
  src/services/PaymentService.ts:143 -- error logging
  src/services/PaymentService.ts:144 -- rethrow
```

This makes coverage actionable during code review rather than an afterthought.

## Common Mistakes

| Mistake | Consequence | Correction |
|---------|-------------|------------|
| Chasing 100% coverage | Brittle tests on trivial code | Focus on critical paths, accept 85-90% |
| Excluding files to raise the number | False confidence | Only exclude generated code |
| Counting covered lines as tested | Lines executed but not asserted | Add mutation testing for critical code |
| One-time coverage push | Coverage decays after the initial effort | Use ratchet to maintain, review in PRs |
