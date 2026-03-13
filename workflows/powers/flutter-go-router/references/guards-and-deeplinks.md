# Guards and Deep Links

## Guard Rules

- Redirect functions stay pure and deterministic.
- Check the current matched location before redirecting to avoid loops.
- Preserve user intent with a `from` query when redirecting to auth.
- Keep init/auth guards separate when they represent different state machines.

## Deep-Link Rules

- Validate required IDs and query params before building the page.
- Route invalid or incomplete links to a safe fallback or error screen.
- Keep notification payload parsing outside widgets when possible.

## Shell Navigation

- Use stateful shell navigation when each tab needs its own stack.
- Give each branch its own navigator key.
- Test back navigation and tab switching explicitly.
