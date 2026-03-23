# Acceptance

## Traceability Status

Partial.

The benchmark data and backlog are captured, but the runtime behavior is still mostly manual. This spec closes that gap.

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

- A workflow still depends on hand-authored prompt traces.
- Atlas artifacts are optional or omitted.
- Mobile quality is still only a screenshot reviewer note.
- Rounded/material coverage still requires one-off local fixture work instead of canonical dataset support.
