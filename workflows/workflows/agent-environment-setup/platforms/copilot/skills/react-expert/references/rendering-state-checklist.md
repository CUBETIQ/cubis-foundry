# Rendering And State Checklist

Load this when React work needs more than the root routing rules.

## Component boundaries

- Split components by ownership of behavior and state, not only by file size.
- Keep server/client boundaries explicit when React is used under a framework.
- Prefer composition over prop tunnels or hidden module state.

## State placement

- Put state at the lowest level that still preserves correctness.
- Derive state instead of mirroring it when possible.
- Distinguish local UI state, shared client state, and async/server state deliberately.

## Effects and async flows

- Use effects only for real synchronization with external systems.
- Keep effects idempotent and cleanup-safe.
- Prefer event handlers, transitions, or framework data APIs before effect-heavy fetching.

## Performance and verification

- Measure rerender hotspots before reaching for memoization.
- Check loading, error, empty, and disabled states as real UX states.
- Pair non-trivial interaction changes with focused component or behavior tests.
