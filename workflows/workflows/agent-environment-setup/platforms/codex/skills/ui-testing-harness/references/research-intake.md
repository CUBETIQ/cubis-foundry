# Research Intake

Use research as intake, not as execution input.

## Source classes

Foundry UI harness work pulls from five kinds of outside material:

1. Product or engineering posts from model vendors
2. Design-system or design-tool vendor posts
3. Style libraries or prompt galleries
4. Public UI research references already reflected in Foundry lineage
5. Real fixture review from the repo itself

The normalization order matters:

1. Read the source for the principle.
2. Extract only the principle, anti-pattern, or workflow cue.
3. Map it into a Foundry note or dataset entry with source metadata.
4. Use the normalized artifact during scenario and fixture work.

## What to extract

Extract compact claims such as:

- design-system context improves generated UI consistency
- agent-produced interfaces still need explicit hierarchy and provenance
- style galleries are useful for contrast and vocabulary, not for raw prompt reuse
- structured prompting beats aesthetic adjectives alone
- fixed scenarios are better than open-ended “make it nicer” requests

Do not extract:

- long prompt templates
- brand-copy phrasing
- full HTML or XML outputs
- screenshots as if they were a design system

## Normalization contract

Every outside reference should be represented by:

- `id`
- `title`
- `date`
- `source_url`
- `principles[]`
- `anti_patterns[]`
- `foundry_implications[]`

That representation can live in `ui-testing/research/` or be converted into a dataset entry under `workflows/design-datasets/`.

## Current research lanes

### Anthropic

Use Anthropic research for fast interactive artifact workflow and iteration behavior.

Good harness implications:

- interfaces can be generated quickly but still need design-state constraints
- iteration loops should preserve artifact lineage
- “interactive” does not mean “visually coherent”

### Google

Use Google Stitch and A2UI material for generated UI orchestration and agent-driven interface patterns.

Good harness implications:

- generated UI needs stronger structured prep before mutation
- orchestration and artifact recovery matter
- interface generation should preserve explicit task context

### Vercel

Use Vercel material for design-system-guided generation and style drift warnings.

Good harness implications:

- a model without a design system snaps toward defaults
- shared tokens and primitives are not optional if the goal is consistency

### Figma

Use Figma material for prompt structure, design review framing, and design-system retrospectives.

Good harness implications:

- structured prompt dimensions outperform adjective piles
- provenance and review loops matter more than prompt length
- “make it beautiful” is too weak as a quality contract

### Design Prompts

Use Design Prompts for style contrast and vocabulary only.

Good harness implications:

- style presets are useful as naming help
- presets should be converted into Foundry directions, motifs, and exclusions
- direct prompt reuse would contaminate the runtime path

## Review questions

Ask these before promoting research into runtime assets:

1. Is this a reusable principle or just a single attractive example?
2. Can it be represented as a direction, motif, pattern, or anti-pattern?
3. Does it help Foundry avoid generic output?
4. Can a fixture or scorecard measure whether the principle was followed?

If the answer to the last question is no, keep the note in research and do not promote it into the harness runtime.
