# Svelte 5 + SvelteKit -- Eval Assertions

## Eval 01: Rune-based component state management

This eval validates correct usage of Svelte 5 runes for reactive state in a temperature converter component.

### Assertions

| # | Type | Target | Rationale |
|---|------|--------|-----------|
| 1 | contains | `$state` | Verifies the skill uses the Svelte 5 `$state` rune for mutable reactive declarations. In Svelte 5, `$state` replaces plain `let` for reactivity and enables fine-grained tracking across component boundaries. |
| 2 | contains | `$derived` | Verifies the skill uses `$derived` for computed values. The Fahrenheit value is a pure derivation of Celsius, so `$derived` is the correct rune -- it automatically recomputes when dependencies change. |
| 3 | contains | `$effect` | Verifies the skill uses `$effect` for side effects (console logging). Effects in Svelte 5 run after DOM updates and auto-track their reactive dependencies. |
| 4 | pattern | `<script[^>]*>` | Verifies the output includes a Svelte component script block. All Svelte 5 components with logic must have a `<script>` tag. |
| 5 | excludes | `$:` | Verifies the skill does NOT use Svelte 4 reactive declarations. The `$:` syntax is the legacy approach replaced by runes in Svelte 5. Mixing them causes confusing behavior. |

### What a passing response looks like

A passing response creates a `TemperatureConverter.svelte` component with:
- A `$state(0)` declaration for the Celsius input value
- A `$derived(celsius * 9/5 + 32)` computation for Fahrenheit
- An `$effect(() => { console.log(...) })` for logging conversions
- Input validation that guards against non-numeric entries
- No usage of Svelte 4 `$:` reactive labels

---

## Eval 02: SvelteKit form action with progressive enhancement

This eval validates correct implementation of SvelteKit form actions with server-side validation and progressive enhancement.

### Assertions

| # | Type | Target | Rationale |
|---|------|--------|-----------|
| 1 | contains | `use:enhance` | Verifies the skill applies SvelteKit's progressive enhancement directive. `use:enhance` intercepts native form submission to provide SPA-like behavior while maintaining the no-JS fallback. |
| 2 | contains | `fail(` | Verifies the skill uses SvelteKit's `fail()` helper for returning validation errors. `fail()` sets the correct HTTP status and makes errors available via `$page.form` on the client. |
| 3 | pattern | `actions.*=.*\{` | Verifies the skill exports a form actions object. SvelteKit form actions must be exported from `+page.server.ts` as a named `actions` constant. |
| 4 | pattern | `z\.(string\|object)\|zod` | Verifies the skill uses Zod for server-side validation. Schema-based validation is critical because client-side checks can be bypassed. |
| 5 | contains | `+page.server.ts` | Verifies the skill correctly places form action logic in the server-only file. Form actions must run on the server to protect secrets and enforce authorization. |

### What a passing response looks like

A passing response provides:
- A `+page.server.ts` file with `actions` export containing form validation logic
- Zod schemas for name (string, min 2, max 100) and email (string, email format)
- Usage of `fail(400, { errors })` to return validation errors
- A `+page.svelte` file with a `<form method="POST" use:enhance>` that displays loading and error states
- An `+error.svelte` boundary for unexpected server errors
