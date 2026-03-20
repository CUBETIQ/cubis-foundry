# Flutter Readiness For AI-Driven QA

## Goal

Make the Flutter app observable enough that a mobile QA agent can reason about it without brittle coordinate guessing.

## Required signals

### Stable semantics labels

Use `Semantics(label: "...")` or widgets that expose meaningful accessibility labels. These become high-signal targets for UI inspection and interaction.

### Stable widget keys

Use `ValueKey` for primary controls, especially:

- login or submit buttons
- bottom-nav items
- important toggles
- search fields
- modal confirm or cancel actions

### Predictable route names

Expose named routes or another stable navigation signal so the test report can say which screen the app actually reached.

### Clean log messages

Emit clear error logs for:

- network failures
- auth failures
- route guard failures
- uncaught exceptions

## Recommended Flutter patterns

```dart
ElevatedButton(
  key: const ValueKey('login_button'),
  onPressed: onLogin,
  child: const Text('Login'),
)
```

```dart
Semantics(
  label: 'Email address',
  child: TextField(
    key: const ValueKey('email_input'),
  ),
)
```

## Common failure modes

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Agent cannot find a button reliably | No semantics label or stable key | Add `Semantics` or `ValueKey` |
| Agent taps the wrong item in a list | Repeated labels with no scoping | Add more specific labels or keys |
| Route assertions are ambiguous | Anonymous navigation or duplicate titles | Expose stable route names or screen markers |
| Crash exists but report is weak | Logs are noisy or generic | Add explicit error logging around failure boundaries |

## QA-friendly app checklist

- Primary CTA buttons have `ValueKey`
- Important inputs have labels
- Loading, error, and empty states are visible and distinct
- Offline and retry states are testable without hidden gestures
- Navigation destinations have stable names or screen IDs

## Reporting rule

When readiness gaps block progress, treat them as product findings:

- do not hide them behind repeated retries
- record the exact missing label, key, or route signal
- suggest the smallest instrumentation change needed
