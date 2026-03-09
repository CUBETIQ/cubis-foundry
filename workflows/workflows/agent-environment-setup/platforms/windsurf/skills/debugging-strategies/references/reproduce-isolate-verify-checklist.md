# Reproduce, Isolate, Verify Checklist

Use this when the bug is real but the shortest path to root cause is still unclear.

## Reproduce

- Capture exact steps, inputs, environment, and expected-versus-actual behavior.
- Determine whether the bug is:
  - consistent
  - data-dependent
  - environment-specific
  - time or concurrency sensitive
- Reduce the problem to the smallest reliable reproduction you can keep.

## Isolate

Move from broad to narrow:

1. which boundary fails first
2. which recent change could have shifted behavior
3. which artifact proves the branch is wrong

Useful tools by situation:

- browser trace or devtools for UI failures
- focused logs or request IDs for service failures
- query plans for data slowdowns
- `git bisect` for regressions with unknown starting points
- targeted tests for turning a manual reproduction into an automated one

## Hypothesis discipline

- Write down one likely cause at a time.
- Add the smallest instrumentation that can disprove it.
- Revert or remove exploratory logging once the cause is known.

## Fix and verify

- Fix the confirmed cause, not just the outer symptom.
- Add or update the smallest regression proof that would have caught it earlier.
- Recheck adjacent cases with similar state, timing, or data-shape assumptions.
- Record any residual risk if the full environment could not be reproduced locally.
