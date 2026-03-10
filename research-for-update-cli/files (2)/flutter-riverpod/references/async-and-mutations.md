# Async and Mutations

## Async Rules

- Use `ref.watch` inside build methods.
- In mutation methods, use `ref.read` for dependencies.
- Guard post-`await` state updates with `ref.mounted` when disposal is possible.
- Prefer invalidate-and-rebuild over bespoke refresh state machines unless the UX needs something custom.

## Stream Rules

- Prefer streams for local reactive data such as Drift watches.
- Map raw repository output into a UI-friendly state shape at the provider boundary.

## Mutation Rules

- Keep mutation methods thin.
- Do not trigger UI side effects directly from the provider unless the project has a dedicated side-effect channel.
- If the project already uses experimental Riverpod mutation helpers, follow existing conventions instead of mixing styles.
