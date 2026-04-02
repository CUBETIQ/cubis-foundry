# TDD Workflow

## The Red-Green-Refactor Cycle

Test-Driven Development follows a strict three-phase cycle repeated for each small increment of functionality.

### Phase 1: Red (Write a Failing Test)

Write a test for the next small piece of behavior. Run it. It must fail. If it passes, either the behavior already exists (no new code needed) or the test is not testing what you think.

**Rules for Red:**
- Write the simplest test that fails for the right reason.
- The test should fail because the production code does not yet implement the behavior, not because of a syntax error or missing import.
- If you cannot write a failing test, you do not understand the requirement well enough. Clarify before proceeding.

```python
# Red: test for a feature that does not exist yet
def test_add_returns_sum_of_two_numbers():
    calc = Calculator()
    assert calc.add(2, 3) == 5
# Run: FAILS with AttributeError: 'Calculator' has no attribute 'add'
```

### Phase 2: Green (Make It Pass with Minimum Code)

Write the least amount of production code that makes the failing test pass. Do not add extra logic, handle additional cases, or optimize. The goal is to go from red to green as quickly as possible.

**Rules for Green:**
- Write only enough code to pass the current test.
- It is acceptable to hard-code a return value if that satisfies the test. The next test will force generalization.
- Do not refactor during this phase. Ugly code that passes is fine temporarily.

```python
# Green: minimum implementation
class Calculator:
    def add(self, a, b):
        return a + b
# Run: PASSES
```

### Phase 3: Refactor (Improve Under Green)

With all tests passing, improve the code structure without changing behavior. Extract methods, rename variables, remove duplication, simplify conditionals. Run tests after each refactoring step to ensure nothing breaks.

**Rules for Refactor:**
- All tests must remain green throughout.
- If a test breaks, undo the last change and try a smaller step.
- Refactor both production code and test code.
- This is where you pay down technical debt incrementally.

## Cadence and Rhythm

### Micro-Cycles (Minutes)

Each Red-Green-Refactor cycle should take 1-10 minutes. If a cycle takes longer, the step is too large. Break it into smaller behaviors.

```
Red   (1 min): Write test for "empty cart total is zero"
Green (1 min): Return 0 from calculateTotal()
Refactor (0 min): Nothing to refactor yet.

Red   (2 min): Write test for "single item cart total equals item price"
Green (1 min): If items.length == 1, return items[0].price; else return 0;
Refactor (1 min): Simplify to sum(items.map(i => i.price))

Red   (2 min): Write test for "cart with discount code applies percentage"
Green (3 min): Add discount calculation
Refactor (2 min): Extract applyDiscount method
```

### The Test List

Before starting, write down the behaviors you need to implement as a list:

```
[ ] Empty cart returns total of zero
[ ] Single item returns item price
[ ] Multiple items returns sum of prices
[ ] Discount code reduces total by percentage
[ ] Expired discount code is ignored
[ ] Negative quantities are rejected
```

Work through the list one item at a time. Add new items as you discover them. Cross off items as tests pass.

## Handling Common TDD Challenges

### "I Don't Know Where to Start"

Start with the simplest case. For a calculator, start with `add(0, 0)`. For a validator, start with the valid case. For a parser, start with the empty input.

### "My Test Requires Too Much Setup"

If the Arrange phase is complex, the unit under test may have too many dependencies. This is TDD giving you design feedback: consider extracting a smaller class or function.

### "I Can't Test This Without a Database"

If the behavior involves data access, introduce a repository interface and mock it. TDD pushes you toward dependency injection and clean architecture naturally.

### "The Tests Are Slowing Me Down"

Initially, TDD feels slower. The payoff comes later:
- Fewer debugging sessions (bugs are caught immediately).
- Confidence to refactor aggressively.
- Tests serve as documentation.
- Defect rate drops significantly.

## TDD and Design

TDD influences software design in specific ways:

| TDD Pressure | Design Outcome |
|-------------|----------------|
| "I need to mock this dependency" | Dependency injection, interfaces |
| "This test setup is complex" | Smaller classes, single responsibility |
| "I can't test this private method" | Extract to a new public class |
| "These tests are redundant" | Remove duplication in production code |
| "I can't test the error path" | Error handling separated from happy path |

## When NOT to Use TDD

TDD is not always the right approach:

- **Exploratory prototyping** -- When you do not know the shape of the solution yet. Write the code first, then write tests to lock it down.
- **UI layout code** -- Visual output is better verified by visual regression tests.
- **One-off scripts** -- If the code will be used once and discarded, TDD overhead is not justified.
- **Performance-critical inner loops** -- Profile first, then test. TDD may lead you away from the optimal algorithm.

Even when skipping TDD, write tests after implementation. The question is test-first vs. test-after, not tested vs. untested.

## Transformation Priority Premise

When going from Red to Green, apply transformations in order of increasing complexity:

1. `{} -> nil` (return nothing)
2. `nil -> constant` (return a hard-coded value)
3. `constant -> variable` (parameterize)
4. `unconditional -> conditional` (add if/else)
5. `scalar -> collection` (use a list or array)
6. `statement -> recursion/iteration` (add loops)
7. `simple type -> complex type` (introduce objects)

Following this order keeps Green steps small and avoids over-engineering.

## Metrics for TDD Practice

| Metric | Healthy Range | Warning Sign |
|--------|--------------|--------------|
| Cycle time | 1-10 minutes | > 15 minutes per cycle |
| Test-to-code ratio | 1:1 to 3:1 | < 0.5:1 (undertested) or > 5:1 (over-tested) |
| Failing test duration | < 30 seconds to fix | > 5 minutes to go green |
| Refactoring frequency | Every 2-3 cycles | Never refactoring |
| Test count growth | Linear with features | Exponential (combinatorial explosion) |
