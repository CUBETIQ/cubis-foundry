# Scenario Schema

Every harness scenario is a fixed contract, not a loose prompt.

## Manifest fields

Each scenario manifest must define:

- `id`
- `topic`
- `surface_type`
- `style_reference_id`
- `primary_style_direction`
- `supporting_motif`
- `layout_pattern`
- `complexity_tier`
- `anti_slop_constraints[]`
- `must_include[]`
- `interactive_states[]`
- `desktop_failure_checks[]`
- `mobile_expectations[]`
- `skills_required[]`
- `benchmark_lanes[]`
- `acceptance_checks[]`

## Field intent

### `id`

Stable identifier used across fixtures, charters, scorecards, and reports.

### `topic`

The product slice the fixture represents. Keep it concrete enough to imply a content model and interaction style.

Examples:

- finance operations console
- boutique hotel booking site
- event discovery webapp

### `surface_type`

Use a small controlled vocabulary:

- `webapp`
- `website`
- `dashboard`
- `editorial-commerce`

### `primary_style_direction`

One Foundry direction id from `workflows/design-datasets/style-directions.json`.

### `style_reference_id`

One normalized style intake id from `workflows/design-datasets/style-reference-catalog.json`.

### `supporting_motif`

One Foundry motif id from `workflows/design-datasets/component-motifs.json`.

### `layout_pattern`

One Foundry layout id from `workflows/design-datasets/layout-patterns.json`.

### `anti_slop_constraints`

These are explicit bans and guards.

Good examples:

- avoid default SaaS card stacks
- avoid purple gradients
- avoid undifferentiated metrics tiles
- avoid empty glassmorphism

### `must_include`

Elements that define the scenario’s usefulness.

Good examples:

- one operator queue
- one booking detail rail
- one guided weekly plan
- one content filter

### `interactive_states`

List named states a reviewer can trigger without backend dependencies.

Examples:

- filter change
- tab switch
- detail panel update
- spotlight mode

### `desktop_failure_checks`

Explicit desktop review failures the scenario must guard against.

Examples:

- hero headline overlaps the adjacent card stack
- page shell reserves an empty right-side track
- rail and canvas seam is too weak to read as intentional

### `mobile_expectations`

State what the mobile composition must do differently from desktop.

Examples:

- move the decision queue above descriptive metrics
- collapse the preview shell into one swipeable band
- defer secondary watchlists below the primary task flow

### `skills_required`

List the Foundry skills the scenario must exercise.

Recommended baseline:

- `design-context-capture`
- `frontend-design-style-selector`
- `frontend-design-system`
- `frontend-design-screen-brief`
- `frontend-design`
- `design-audit`
- `frontend-design-mobile-patterns`
- `playwright-web-qa`

### `benchmark_lanes`

Declare whether the scenario runs only in the local-authored lane or also in sampled `stitch` and deep `playwright-interactive` lanes.

### `acceptance_checks`

Human-readable checks that can later be mirrored into a charter or scorecard.

Examples:

- the primary motif is visible in the hero and at least one secondary zone
- the mobile state is visibly re-composed, not just scaled down
- interactive text changes after a state switch

## Required companion artifacts

Each scenario should also produce:

- `brief.md`
- `prompt-trace.json`
- `remediation-pass.md`
- `remediation-execution.json`
- a local runnable fixture
- a QA charter
- `scorecard.json`

The harness is incomplete if the scenario stops at a prompt.

## Required global harness artifact

In addition to scenario-specific artifacts, every benchmark run should maintain:

- a runnable `style-atlas` surface under `ui-testing/fixtures/style-atlas/`
- at least one current screenshot of that atlas in `ui-testing/reports/`
- a short atlas note describing which style families and component systems are represented

The atlas is part of the benchmark contract because page-level fixtures alone do not expose component geometry drift, missing rounded-system coverage, or repeated texture fallbacks clearly enough.

## Runtime dataset requirement

The benchmark runtime should also maintain a normalized style-reference dataset at:

- `workflows/design-datasets/style-reference-catalog.json`

That dataset exists so design workflows can query normalized style-reference data without depending directly on the local harness research folder.
