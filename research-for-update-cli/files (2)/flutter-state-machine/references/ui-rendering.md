# UI Rendering

## Shared Rendering Rules

- Render app state through one shared abstraction when possible.
- Use shared design-system widgets for loading, empty, error, and dead-letter states.
- Keep the data branch focused on actual content, not error plumbing.

## Review Checklist

- error state exposes request ID when available,
- empty state has helpful next-step messaging,
- dead-letter state does not masquerade as a retryable transient error,
- loading state matches the design system.
