# Scoring Rubric

The harness scores whether Foundry can produce distinctive, operable UI work.

Use a 1-5 scale for each dimension:

- 5 = clear, repeatable strength
- 3 = acceptable but uneven
- 1 = weak, generic, or broken

## Dimensions

### Design intent

Does the fixture express a clear point of view?

High score indicators:

- style direction is visible without explanation
- hierarchy feels deliberate
- typography and composition work together

Low score indicators:

- generic dashboard or landing-page layout
- no visible thesis for the interface

### Anti-slop quality

Did the result avoid the scenario’s banned cliches?

High score indicators:

- constraints clearly shaped the layout
- there is no accidental fallback to default house style

Low score indicators:

- purple-on-dark drift
- anonymous gradient hero
- decorative cards with no task meaning

### Responsive quality

Does the mobile view meaningfully re-compose?

High score indicators:

- hierarchy changes appropriately
- controls remain reachable
- information density is still understandable

Low score indicators:

- desktop simply shrinks
- critical actions fall below noisy content

### Style fidelity

Does the fixture clearly reflect the normalized style reference and dataset direction?

High score indicators:

- the style family is recognizable without explanation
- the chosen style is visible in typography, surface treatment, and composition

Low score indicators:

- the scenario says one style but the fixture looks like a generic fallback
- only color changed while structure stayed generic

### Composition balance

Do major zones feel proportionate and intentionally weighted?

High score indicators:

- hero mass and companion modules feel in tension, not in conflict
- seams, gutters, and dividers clarify the composition

Low score indicators:

- giant headline crushes adjacent content
- empty negative space reads like accidental imbalance

### Layout occupancy

Does every major desktop track earn its space?

High score indicators:

- page-level shells use their full width with meaningful mounted content
- rails, drawers, and columns hold real work, not decorative emptiness

Low score indicators:

- a major page column is reserved but empty
- a rail exists mostly to make the layout look complex

Any fixture with an empty page-level shell track should score 2 or lower here.

### Mobile recomposition

Does the mobile view become a new staged interface instead of a collapsed desktop screenshot?

High score indicators:

- order changes intentionally
- primary actions move into reach
- secondary context is deferred or compressed

Low score indicators:

- the desktop shell just stacks
- the mobile view leads with the wrong zone

### Interaction quality

Do interaction states reveal useful changes?

High score indicators:

- controls update real text or content zones
- states feel designed, not bolted on

Low score indicators:

- buttons exist but change nothing important
- interactivity is purely cosmetic

### Accessibility baseline

Can the fixture support meaningful automated review?

High score indicators:

- semantic landmarks
- real buttons, headings, labels
- visible state changes reflected in text

Low score indicators:

- clickable `div` patterns
- unclear naming
- hidden or purely visual status

### Provenance quality

Can the reviewer see why the fixture looks the way it does?

High score indicators:

- prompt trace lists dataset ids and exclusions
- the report can connect visual choices to normalized research

Low score indicators:

- unexplained “look and feel”
- no record of why one style was chosen over another

## Gap extraction

Turn repeated low scores into Foundry gaps.

Use this mapping:

- repeated design intent failures -> design-engine gap
- repeated design intent failures that survive a remediation pass -> design-command gap
- repeated anti-slop failures -> style-selector or screen-brief gap
- repeated responsive failures -> responsive guidance gap
- repeated style fidelity failures -> dataset or style-selector gap
- repeated composition balance failures -> design-audit or design capability gap
- repeated layout occupancy failures -> design-audit or layout remediation gap
- repeated interaction failures -> fixture or handoff gap
- repeated accessibility failures -> QA or implementation-handoff gap
- repeated provenance failures -> runtime trace gap

Do not file a Foundry gap for a one-off copy issue unless it exposes a workflow problem.

## Atlas check

The harness should also review the supplementary `style-atlas` surface.

Use it to verify:

- whether component geometry varies meaningfully across style families
- whether rounded and tactile systems such as Material-like surfaces are represented
- whether repeated background textures or surface tricks are being reused as a generic fallback

If the atlas exposes that multiple style families share the same component kit with only color changes, treat that as a style-fidelity and design-system gap even when the page-level fixtures look superficially different.
