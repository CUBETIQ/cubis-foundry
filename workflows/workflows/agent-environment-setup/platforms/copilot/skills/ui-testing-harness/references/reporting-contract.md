# Reporting Contract

The harness exists to improve Foundry, so the report must stay operational.

## Scenario report package

Each scenario report directory should contain:

- `brief.md`
- `prompt-trace.json`
- `scorecard.json`
- optional screenshots and snapshots

## Global harness artifact package

Each benchmark pass should also include:

- a current `style-atlas` route
- one atlas screenshot under `ui-testing/reports/`
- a short `style-atlas.md` note that explains which style families, geometry types, and component systems are represented

## `brief.md`

Keep the brief short:

- scenario goal
- selected direction, motif, and layout ids
- anti-slop constraints
- must-include interaction states

Do not turn the brief into a giant prompt transcript.

## `prompt-trace.json`

Record:

- selected dataset ids
- `style_reference_id`
- normalized research notes referenced
- excluded cliches
- intended skill sequence
- remediation skill sequence, if a second pass ran
- benchmark lane results
- fallback or drift warnings

This file is for traceability, not for end-user prose.

## `scorecard.json`

Required fields:

- `scenario_id`
- `style_reference_id`
- `build_status`
- `design_intent_score`
- `anti_slop_score`
- `responsive_score`
- `interaction_score`
- `accessibility_score`
- `style_fidelity_score`
- `composition_balance_score`
- `layout_occupancy_score`
- `mobile_recomposition_score`
- `skills_exercised[]`
- `benchmark_lane_results[]`
- `artifact_paths[]`
- `gaps[]`

Each gap item should include:

- `category`
- `severity`
- `symptom`
- `likely_root_cause`
- `foundry_owner_area`
- `recommended_fix`

## Consolidated report

The final report should answer:

1. Which failures repeated across scenarios?
2. Which Foundry subsystem owns each repeated failure?
3. Which fixes should happen first?

Recommended sections:

- Harness summary
- Supplementary harness artifacts
- Style-family coverage
- Scenario results table
- Repeated gaps
- Scenario-specific notes
- Fix order

## Master gap doc update

Only promote consolidated findings into `docs/foundry-real-world-gaps.md`.

Use the master doc for:

- systemic workflow gaps
- missing runtime features
- weak dataset coverage
- missing provenance and scoring support

Do not use the master doc for:

- fixture copy tweaks
- one-off styling preferences
- bugs that belong to a single sample file
