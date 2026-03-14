# Receiving Code Review — Eval Assertions

## Eval 1: Categorizing and responding to mixed feedback

### Assertion 1: Race condition as blocking
The skill must identify the race condition comment as the highest priority. Race conditions cause data corruption and are correctness bugs — they must be fixed before merge.

### Assertion 2: Variable naming as non-blocking
Naming feedback is a style improvement that doesn't affect behavior. Categorizing it correctly prevents over-prioritizing cosmetic changes.

### Assertion 3: Acknowledge positive feedback
Responding to praise builds reviewer rapport and signals that all feedback is valued, not just criticism.

### Assertion 4: Integration tests for cache miss
When a reviewer asks "why no tests?", the correct response is usually to add the tests. The skill should recommend writing them.

### Assertion 5: Technical approach for race condition
The response should include a specific fix strategy (locking, atomic operations, or compare-and-swap), not just acknowledge the problem.

## Eval 2: Handling conflicting reviewer opinions

### Assertion 1: Surface the conflict explicitly
Silently choosing one reviewer's approach leads to confusion. The skill must recommend making the disagreement visible.

### Assertion 2: Trade-off analysis
Both approaches have valid merits. The skill must analyze testability vs simplicity trade-offs with specific reasoning.

### Assertion 3: Resolution mechanism
Async comment threads can spiral. The skill should suggest a synchronous discussion for faster resolution.

### Assertion 4: YAGNI consideration
Bob's concern about unnecessary abstraction for a single implementation is a valid YAGNI argument that should be weighed.

### Assertion 5: Document the decision
Regardless of outcome, the reasoning should be captured so future developers understand the choice.
