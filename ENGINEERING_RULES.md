# Engineering Rules

These rules are the default for this project.

## 1) Build Only What Is Needed (YAGNI)

- Implement only what current requirements need.
- Do not add speculative abstractions, extension points, or feature flags "for future use."
- If a helper/class is used only once and does not improve clarity, keep it inline.

## 2) Readability First

- Code should be understandable in one pass.
- Prefer straightforward flow over clever tricks.
- Reduce nesting and branching where possible.
- Remove dead code and commented-out blocks.

## 3) Precise Naming (One Look = Clear Intent)

- Class names must say exactly what they represent.
  - Good: `AttendanceStatisticScreen`
  - Bad: `DataScreen`, `CommonManager`
- Method names must say exactly what they do.
  - Good: `loadCurrentUserSessions`
  - Bad: `handleData`, `processThing`
- Boolean names must read as true/false facts: `isActive`, `hasError`, `canSubmit`.
- Avoid vague suffixes like `Helper`, `Util`, `Manager` unless the type has a narrow, clear responsibility.

## 4) Keep Functions and Classes Focused

- One function should do one clear job.
- One class should own one clear responsibility.
- Split when a file mixes unrelated concerns (UI + networking + mapping in one place).
- Prefer small composable units over inheritance-heavy designs.

## 5) Platform Implementation Rules

- Keep providers/services focused; do not let one unit fetch unrelated feature data.
- Prevent duplicate network calls (cache or in-flight dedupe) when multiple views depend on the same data.
- Route/build functions must not return placeholder content in production flows.

## 6) UI Migration Rule (Required for This Project)

For each migrated screen:

1. Copy legacy layout/behavior/state flow first (behavior parity).
2. Replace legacy widgets/components with your project design system while preserving behavior.
3. Replace ad-hoc sizing with design tokens (spacing, radius, typography).
4. Verify on both small and large devices.

## 7) PR / Review Checklist

Before merge, confirm:

- Naming is precise and intention-revealing.
- No speculative abstraction was added.
- Logic is simple enough for fast onboarding.
- UI uses design system tokens/components, not ad-hoc sizing.
- Lint/analyze/tests pass.

## 8) Keep TECH.md Fresh

- `TECH.md` is generated from current codebase reality.
- Re-run `cbx rules tech-md --overwrite` after major stack or architecture changes.

