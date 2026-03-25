# Acceptance

## Traceability Status

Complete at the harness-runtime layer, partial at the shared core-runtime layer.

The benchmark route, runner, remediation executor, atlas validation, runtime dataset sync, analyzer-backed scoring, and component-system reporting now exist. The remaining gap is promotion from repo-local harness runtime into shared Foundry runtime behavior.

## Acceptance Criteria

### Workflow Runtime

- One canonical Foundry workflow or CLI path runs the benchmark suite end-to-end.
- The workflow knows about both scenario fixtures and the supplementary `style-atlas` artifact.
- The workflow can refresh scorecards and the consolidated report without manual file coordination.

### Provenance

- Design-heavy benchmark runs emit:
  - style direction id
  - layout pattern id
  - motif id
  - style reference id
  - exclusions
  - remediation steps
- `prompt-trace.json` can be generated from runtime data instead of static harness templates.

### Scoring

- `design-audit` can score:
  - style fidelity
  - layout occupancy
  - optical collision risk
  - mobile recomposition
  - geometry coverage
  - texture discipline
- Repeated desktop shell waste and repeated texture overlays become explicit failures.

### Atlas

- The benchmark run fails if the `style-atlas` fixture, atlas note, or atlas screenshot is missing.
- Atlas output clearly compares rounded and hard-edge systems.
- Material-like component language is represented as a first-class benchmark surface.

### Dataset And Style Coverage

- External style-reference normalization is available to runtime code, not only local harness files.
- Rounded/tactile system coverage is available through canonical dataset entries.
- Style selection can intentionally choose a rounded/tactile direction instead of defaulting to hard-edge systems.

### Reporting

- Consolidated output shows:
  - benchmark route status
  - atlas artifact status
  - score summary
  - repeated gaps
  - subsystem ownership
  - prioritized fixes

## Non-Acceptance Signals

- Prompt traces are still emitted only by the harness layer and not by the shared design runtime.
- Guided remediation can execute at the harness-runtime layer, but not yet natively end-to-end from the shared runtime.
- Shared QA and design-audit primitives still cannot reuse the harness scoring logic directly.
- The canonical `/ui-testing` route still depends on repo-local executor scripts instead of a shared native executor.
