# Version Matrix

Do not treat this file as a hardcoded source of truth for package numbers.

## When Version Guidance Is Needed

Before recommending or editing Riverpod package versions:

1. Inspect the project's current Flutter and Dart SDK constraints.
2. Check the official Riverpod packages and migration notes.
3. Prefer a version set that is internally compatible with the project's SDK and existing generator tooling.

## Packages to Check Together

- `flutter_riverpod`
- `riverpod_annotation`
- `riverpod_generator`
- `riverpod_lint`
- `build_runner`

## Output Rule

When the task is version-sensitive, state the versions you verified and why
they fit the project instead of copying a stale example blindly.
