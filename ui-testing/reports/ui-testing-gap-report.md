# UI Testing Gap Report

## Harness Summary

- Scenarios reviewed: 10
- Style families covered: 10
- Benchmark lanes observed: 3
- Surface: web and webapp fixtures
- Goal: expose repeated Foundry workflow gaps in anti-slop UI generation, style fidelity, and responsive recomposition

## Supplementary Harness Artifacts

- Style atlas route: /style-atlas/
- Style atlas fixture present: yes
- Style atlas note present: yes (ui-testing/reports/style-atlas.md)
- Style atlas screenshot present: yes (ui-testing/reports/style-atlas-desktop.png)

## Score Summary

- Design intent: 4.8
- Anti-slop: 4.8
- Responsive: 4
- Interaction: 4.8
- Accessibility: 4.6
- Style fidelity: 4.9
- Composition balance: 4.3
- Layout occupancy: 4.7
- Mobile recomposition: 4

## Scenario Results

| Scenario | Style Direction | Design | Anti-slop | Style | Composition | Occupancy | Mobile | Responsive | Interaction | Accessibility |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| atelier-stay | monochrome-editorial | 5 | 5 | 5 | 4 | 5 | 4 | 4 | 5 | 4 |
| coach-loop | swiss-minimalist | 5 | 5 | 5 | 5 | 4 | 4 | 4 | 5 | 5 |
| field-notes | newsprint-editorial | 5 | 5 | 5 | 4 | 4 | 4 | 4 | 4 | 5 |
| maison-prive | luxury-formal | 5 | 5 | 5 | 4 | 5 | 4 | 4 | 4 | 4 |
| neo-market | neo-brutalist-product | 4 | 4 | 5 | 4 | 5 | 4 | 4 | 5 | 4 |
| plant-ops | industrial-control | 5 | 5 | 5 | 5 | 5 | 4 | 4 | 5 | 5 |
| pulse-festival | kinetic-poster | 5 | 5 | 5 | 4 | 4 | 4 | 4 | 5 | 4 |
| saas-foundry | saas-minimal | 4 | 4 | 4 | 4 | 5 | 4 | 4 | 5 | 5 |
| terminal-cloud | terminal-ops | 5 | 5 | 5 | 5 | 5 | 4 | 4 | 5 | 5 |
| wealth-ops | enterprise-disciplined | 5 | 5 | 5 | 4 | 5 | 4 | 4 | 5 | 5 |

## Style-Family Coverage

- enterprise-disciplined via enterprise-light-24: wealth-ops
- industrial-control via industrial-light-26: plant-ops
- kinetic-poster via kinetic-dark-09: pulse-festival
- luxury-formal via luxury-light-06: maison-prive
- monochrome-editorial via monochrome-light-01: atelier-stay
- neo-brutalist-product via neo-brutalism-light-13: neo-market
- newsprint-editorial via newsprint-light-04: field-notes
- saas-minimal via saas-light-05: saas-foundry
- swiss-minimalist via swiss-minimalist-light-08: coach-loop
- terminal-ops via terminal-dark-07: terminal-cloud

## Benchmark-Lane Coverage

- local-authored: active=10
- playwright-interactive: pending-review=3
- stitch: skipped-unavailable=3

## Repeated Gaps

- component-atlas-coverage: The harness benchmarked full pages but did not originally include a first-class component atlas showing how each style treats buttons, inputs, chips, cards, rails, and interactive states.
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops
  Owner area: design-system guidance / ui-testing
  Recommended fix: Add a first-class style atlas workflow that compares component behavior, geometry, state language, and density across style families alongside full-page fixtures.
- design-command-orchestration: The remediation skills still have to be sequenced manually after a weak UI pass.
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops
  Owner area: design-engine runtime / workflow routing
  Recommended fix: Add a first-class design remediation workflow that chains audit, layout repair, typography repair, intensity adjustment, simplification, and polish with explicit traces.
- responsive-scoring: Responsive quality is visible in screenshots but not automatically scored by existing Foundry QA primitives.
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops
  Owner area: web QA / scoring
  Recommended fix: Add viewport-aware scoring hooks and responsive heuristics to the harness workflow.
- runtime-provenance: Prompt and dataset provenance is still captured manually in the harness instead of being emitted by the design runtime.
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops
  Owner area: design-engine runtime
  Recommended fix: Promote prompt-trace generation into the runtime and attach dataset ids, exclusions, remediation skills, and style reference ids automatically.
- style-catalog-normalization: The harness now depends on a large external style reference intake, but Foundry still lacks a first-class normalized style catalog that the design runtime can query directly.
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops
  Owner area: design datasets / runtime data
  Recommended fix: Promote Design Prompts-style normalization into a first-class Foundry dataset pipeline with explicit source metadata, mappings, and anti-pattern fields.
- style-fidelity-scoring: The harness can describe style drift, but style fidelity still depends on manually assigned scorecard numbers rather than a runtime scoring dimension.
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops
  Owner area: design audit / scoring
  Recommended fix: Add style-fidelity checks to design-audit and the UI harness so each scenario can fail when it drifts back to generic product defaults.
- style-geometry-coverage: The current harness over-indexed on hard-edge, low-radius component geometry and underrepresented rounded systems such as Material-style surfaces.
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops
  Owner area: design datasets / style-selector
  Recommended fix: Expand canonical style coverage to include rounded, tactile systems and make geometry variation a first-class style-fidelity check.
- texture-discipline: Background texture patterns were reused too freely as a quick way to differentiate surfaces, which made several pages feel templated instead of style-specific.
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops
  Owner area: design audit / visual direction
  Recommended fix: Teach design-audit to flag repeated texture overlays and require surface texture to be justified by the chosen style family.
- workflow-surface: The harness still relies on local scripts and per-scenario charters rather than a first-class ui-testing workflow.
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops
  Owner area: workflow routing / CLI
  Recommended fix: Add a first-class ui-testing workflow or CLI command that chains fixture review, remediation, QA capture, and score aggregation.

## Repeated Failures By Foundry Subsystem

- design audit / scoring: repeated across 10 scenarios
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops
- design audit / visual direction: repeated across 10 scenarios
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops
- design datasets / runtime data: repeated across 10 scenarios
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops
- design datasets / style-selector: repeated across 10 scenarios
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops
- design-engine runtime: repeated across 10 scenarios
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops
- design-engine runtime / workflow routing: repeated across 10 scenarios
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops
- design-system guidance / ui-testing: repeated across 10 scenarios
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops
- web QA / scoring: repeated across 10 scenarios
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops
- workflow routing / CLI: repeated across 10 scenarios
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops

## Repeated Failures By Gap Category

- component-atlas-coverage: repeated across 10 scenarios
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops
- design-command-orchestration: repeated across 10 scenarios
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops
- responsive-scoring: repeated across 10 scenarios
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops
- runtime-provenance: repeated across 10 scenarios
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops
- style-catalog-normalization: repeated across 10 scenarios
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops
- style-fidelity-scoring: repeated across 10 scenarios
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops
- style-geometry-coverage: repeated across 10 scenarios
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops
- texture-discipline: repeated across 10 scenarios
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops
- workflow-surface: repeated across 10 scenarios
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops

## Scenario-Specific Notes

- atelier-stay / composition-balance: The first atelier-stay layout let the hero headline dominate the spread so heavily that the supporting editorial modules looked underweighted until the type scale and column proportions were manually rebalanced.
  Owner area: design remediation / composition guidance
  Recommended fix: Add composition-balance checks to design-audit so oversized editorial headlines and underweighted companion columns fail review before screenshots are approved.
- coach-loop / layout-occupancy: The first coach-loop desktop shell reserved a full right-side grid track with no mounted content, creating a large dead zone until the shell structure was manually corrected.
  Owner area: design remediation / layout audit
  Recommended fix: Add layout-occupancy checks to design-audit and the UI harness so empty reserved rails or underfilled desktop columns fail review.
- field-notes / layout-occupancy: The first field-notes desktop shell reserved a page-level track that read like accidental left-spacing waste until the shell structure was collapsed into one real page canvas.
  Owner area: design remediation / layout audit
  Recommended fix: Add page-shell occupancy checks so empty desktop tracks fail review before spacing debates start.
- maison-prive / luxury-operability: Luxury concierge surfaces still need stronger heuristics for coupling narrative atmosphere to itinerary and host actions so they do not drift into static premium storytelling.
  Owner area: design-engine direction / screen-brief
  Recommended fix: Expand service-led luxury patterns so host itineraries, rate ledgers, and request actions are first-class design moves.
- neo-market / intensity-governance: Neo-brutalist product surfaces can lose operability quickly if loud labels and offset stacks are not explicitly bounded around the transaction path.
  Owner area: design-audit / style-selector
  Recommended fix: Add intensity-governance checks that verify loud styles still preserve the primary transaction path and do not bury critical actions.
- plant-ops / warning-governance: Industrial control surfaces need better guardrails for warning-state density so risk colors do not flatten the hierarchy when several maintenance signals are active at once.
  Owner area: design-engine direction / audit
  Recommended fix: Add industrial warning-state heuristics that separate watch, hold, and stop conditions through structure as well as color.
- pulse-festival / layout-occupancy: The first pulse-festival desktop shell also reserved a dead page-level track, so the left-side hero felt like a spacing bug instead of intentional poster composition.
  Owner area: design remediation / layout audit
  Recommended fix: Teach design-audit to fail poster-style shells when the page-level right track is empty instead of structurally counterweighted.
- saas-foundry / style-fidelity: Minimal SaaS surfaces remain vulnerable to collapsing into generic shadcn-like shells unless the preview lane and command ribbon are explicitly designed as product proof, not decorative support.
  Owner area: style-selector / screen-brief
  Recommended fix: Add stronger style-fidelity checks for restrained SaaS directions so generic startup fallback fails even when the UI is clean.
- wealth-ops / composition-calibration: The first remediated wealth-ops pass still produced an optical collision between the left control rail and the main hero canvas even though the CSS grid itself was valid.
  Owner area: design remediation / scoring
  Recommended fix: Add optical-collision and composition-balance checks to design-audit and the UI harness so dense layouts can fail before screenshots are approved.
- wealth-ops / mobile-recomposition: The wealth-ops mobile view initially read like a compressed desktop stack instead of a staged mobile command surface with reprioritized sections and tighter action flow.
  Owner area: design remediation / responsive guidance
  Recommended fix: Add mobile re-staging checks to design-arrange and the UI harness so dense dashboards must reorder, compress, or defer sections instead of only stacking them.

## Fix Order

1. promote prompt-trace provenance and design execution traces into the runtime
2. add a first-class remediation workflow that routes audit output into arrange, typeset, bolder, distill, and polish
3. ship a first-class ui-testing workflow over scenario manifests, browser capture, remediation, and score aggregation
4. promote Design Prompts-style normalization into a reusable Foundry style catalog
5. add style-fidelity scoring, optical-collision checks, and layout-occupancy checks to design-audit
6. add viewport-aware mobile recomposition scoring and shell-track occupancy failure rules

