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
- Benchmark runtime artifact present: yes (ui-testing/reports/benchmark-runtime.json)
- Benchmark execution artifact present: yes (ui-testing/reports/benchmark-execution.json)
- Remediation runtime artifact present: yes (ui-testing/reports/remediation-runtime.json)
- Component system summary JSON present: yes (ui-testing/reports/component-system-summary.json)
- Component system summary note present: yes (ui-testing/reports/component-system-summary.md)

## Score Summary

- Design intent: 4.8
- Anti-slop: 4.5
- Responsive: 3.8
- Interaction: 5
- Accessibility: 5
- Style fidelity: 4.9
- Composition balance: 4.5
- Layout occupancy: 4.7
- Mobile recomposition: 3.3
- Texture discipline: 4.2
- Geometry coverage: 3.6

## Scenario Results

| Scenario | Style Direction | Design | Anti-slop | Style | Composition | Occupancy | Mobile | Responsive | Interaction | Accessibility |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| atelier-stay | monochrome-editorial | 4.2 | 4.2 | 4.4 | 5 | 2 | 3.6 | 4.1 | 5 | 5 |
| coach-loop | swiss-minimalist | 5 | 4.8 | 5 | 3.2 | 5 | 3.6 | 4.1 | 5 | 5 |
| field-notes | newsprint-editorial | 4.2 | 4.2 | 4.4 | 3.2 | 5 | 3.6 | 4.1 | 5 | 5 |
| maison-prive | luxury-formal | 4.2 | 4.2 | 5 | 5 | 5 | 3.6 | 4.1 | 5 | 5 |
| neo-market | neo-brutalist-product | 5 | 4.8 | 5 | 5 | 5 | 2.7 | 3.2 | 5 | 5 |
| plant-ops | industrial-control | 5 | 4.8 | 5 | 5 | 5 | 2.7 | 3.2 | 5 | 5 |
| pulse-festival | kinetic-poster | 5 | 4.8 | 5 | 3.2 | 5 | 3.6 | 4.1 | 5 | 5 |
| saas-foundry | saas-minimal | 5 | 4.8 | 5 | 5 | 5 | 3.6 | 4.1 | 5 | 5 |
| terminal-cloud | terminal-ops | 5 | 4.8 | 5 | 5 | 5 | 2.7 | 3.2 | 5 | 5 |
| wealth-ops | enterprise-disciplined | 5 | 3.6 | 5 | 5 | 5 | 3.6 | 4.1 | 5 | 5 |

## Component-System Summary

- Use `ui-testing/reports/component-system-summary.md` for geometry, tactile-system, and atlas-lane review.
- Treat component-language failures separately from page-shell composition failures.

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

- runtime-provenance: The UI harness now emits runtime-derived traces, but Foundry's underlying design runtime still does not natively emit first-class provenance for style selection, exclusions, remediation steps, and dataset usage outside the harness layer.
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops
  Owner area: design-engine runtime
  Recommended fix: Promote prompt-trace generation into the core design runtime and attach dataset ids, exclusions, remediation skills, and style reference ids automatically.
- shared-remediation-runtime: The UI harness now executes guided remediation passes, but Foundry still lacks a shared native runtime that exposes the same second-pass design remediation path outside the benchmark layer.
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops
  Owner area: design-engine runtime / workflow routing
  Recommended fix: Promote the harness remediation executor into a shared design remediation runtime that chains audit, layout repair, typography repair, intensity adjustment, simplification, and polish with explicit execution traces.
- workflow-surface: Foundry now has a first-class ui-testing route and a single benchmark runner, but the execution path still lives in repo-local harness scripts instead of a shared Foundry runtime or CLI executor.
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops
  Owner area: workflow routing / CLI
  Recommended fix: Promote the repo-local benchmark runner into a native ui-testing runtime or CLI surface that the shared route can execute directly.

## Repeated Failures By Foundry Subsystem

- design-engine runtime: repeated across 10 scenarios
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops
- design-engine runtime / workflow routing: repeated across 10 scenarios
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops
- workflow routing / CLI: repeated across 10 scenarios
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops

## Repeated Failures By Gap Category

- runtime-provenance: repeated across 10 scenarios
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops
- shared-remediation-runtime: repeated across 10 scenarios
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops
- workflow-surface: repeated across 10 scenarios
  Scenarios: atelier-stay, coach-loop, field-notes, maison-prive, neo-market, plant-ops, pulse-festival, saas-foundry, terminal-cloud, wealth-ops

## Scenario-Specific Notes

- atelier-stay / composition-balance: The first atelier-stay layout let the hero headline dominate the spread so heavily that the supporting editorial modules looked underweighted until the type scale and column proportions were manually rebalanced.
  Owner area: design remediation / composition guidance
  Recommended fix: Add composition-balance checks to design-audit so oversized editorial headlines and underweighted companion columns fail review before screenshots are approved.
- atelier-stay / layout-occupancy: The atelier-stay fixture reserves more desktop shell tracks than it meaningfully fills, so the layout reads under-occupied.
  Owner area: design audit / layout review
  Recommended fix: Fail layouts whose page-level shell columns exceed the number of meaningful mounted peer zones.
- atelier-stay / mobile-recomposition: The atelier-stay fixture relies mostly on column collapse and still shows weak mobile re-staging signals.
  Owner area: web QA / responsive scoring
  Recommended fix: Require mobile reordering and staged hierarchy changes, not just single-column collapse.
- atelier-stay / style-fidelity-drift: The atelier-stay fixture only partially expresses the intended monochrome-editorial direction when analyzed through typography, geometry, and surface cues.
  Owner area: design audit / scoring
  Recommended fix: Add stronger style-family-aware scoring and style-selector checks so partial fallback is caught automatically.
- atelier-stay / texture-discipline: The atelier-stay fixture uses enough layered gradients or texture treatment to risk feeling like a reusable harness default.
  Owner area: design audit / visual direction
  Recommended fix: Penalize repeated background texture patterns unless the style family explicitly calls for them.
- coach-loop / composition-balance: The coach-loop fixture has elevated optical-collision risk because display scale and shell constraints are not sufficiently bounded.
  Owner area: design audit / layout review
  Recommended fix: Add optical-collision heuristics that penalize oversized display type without max-width or supporting seam control.
- coach-loop / layout-occupancy: The first coach-loop desktop shell reserved a full right-side grid track with no mounted content, creating a large dead zone until the shell structure was manually corrected.
  Owner area: design remediation / layout audit
  Recommended fix: Add layout-occupancy checks to design-audit and the UI harness so empty reserved rails or underfilled desktop columns fail review.
- coach-loop / mobile-recomposition: The coach-loop fixture relies mostly on column collapse and still shows weak mobile re-staging signals.
  Owner area: web QA / responsive scoring
  Recommended fix: Require mobile reordering and staged hierarchy changes, not just single-column collapse.
- coach-loop / texture-discipline: The coach-loop fixture uses enough layered gradients or texture treatment to risk feeling like a reusable harness default.
  Owner area: design audit / visual direction
  Recommended fix: Penalize repeated background texture patterns unless the style family explicitly calls for them.
- field-notes / composition-balance: The field-notes fixture has elevated optical-collision risk because display scale and shell constraints are not sufficiently bounded.
  Owner area: design audit / layout review
  Recommended fix: Add optical-collision heuristics that penalize oversized display type without max-width or supporting seam control.
- field-notes / layout-occupancy: The first field-notes desktop shell reserved a page-level track that read like accidental left-spacing waste until the shell structure was collapsed into one real page canvas.
  Owner area: design remediation / layout audit
  Recommended fix: Add page-shell occupancy checks so empty desktop tracks fail review before spacing debates start.
- field-notes / mobile-recomposition: The field-notes fixture relies mostly on column collapse and still shows weak mobile re-staging signals.
  Owner area: web QA / responsive scoring
  Recommended fix: Require mobile reordering and staged hierarchy changes, not just single-column collapse.
- field-notes / style-fidelity-drift: The field-notes fixture only partially expresses the intended newsprint-editorial direction when analyzed through typography, geometry, and surface cues.
  Owner area: design audit / scoring
  Recommended fix: Add stronger style-family-aware scoring and style-selector checks so partial fallback is caught automatically.
- field-notes / texture-discipline: The field-notes fixture uses enough layered gradients or texture treatment to risk feeling like a reusable harness default.
  Owner area: design audit / visual direction
  Recommended fix: Penalize repeated background texture patterns unless the style family explicitly calls for them.
- maison-prive / luxury-operability: Luxury concierge surfaces still need stronger heuristics for coupling narrative atmosphere to itinerary and host actions so they do not drift into static premium storytelling.
  Owner area: design-engine direction / screen-brief
  Recommended fix: Expand service-led luxury patterns so host itineraries, rate ledgers, and request actions are first-class design moves.
- maison-prive / mobile-recomposition: The maison-prive fixture relies mostly on column collapse and still shows weak mobile re-staging signals.
  Owner area: web QA / responsive scoring
  Recommended fix: Require mobile reordering and staged hierarchy changes, not just single-column collapse.
- neo-market / intensity-governance: Neo-brutalist product surfaces can lose operability quickly if loud labels and offset stacks are not explicitly bounded around the transaction path.
  Owner area: design-audit / style-selector
  Recommended fix: Add intensity-governance checks that verify loud styles still preserve the primary transaction path and do not bury critical actions.
- neo-market / mobile-recomposition: The neo-market fixture relies mostly on column collapse and still shows weak mobile re-staging signals.
  Owner area: web QA / responsive scoring
  Recommended fix: Require mobile reordering and staged hierarchy changes, not just single-column collapse.
- plant-ops / mobile-recomposition: The plant-ops fixture relies mostly on column collapse and still shows weak mobile re-staging signals.
  Owner area: web QA / responsive scoring
  Recommended fix: Require mobile reordering and staged hierarchy changes, not just single-column collapse.
- plant-ops / warning-governance: Industrial control surfaces need better guardrails for warning-state density so risk colors do not flatten the hierarchy when several maintenance signals are active at once.
  Owner area: design-engine direction / audit
  Recommended fix: Add industrial warning-state heuristics that separate watch, hold, and stop conditions through structure as well as color.
- pulse-festival / composition-balance: The pulse-festival fixture has elevated optical-collision risk because display scale and shell constraints are not sufficiently bounded.
  Owner area: design audit / layout review
  Recommended fix: Add optical-collision heuristics that penalize oversized display type without max-width or supporting seam control.
- pulse-festival / layout-occupancy: The first pulse-festival desktop shell also reserved a dead page-level track, so the left-side hero felt like a spacing bug instead of intentional poster composition.
  Owner area: design remediation / layout audit
  Recommended fix: Teach design-audit to fail poster-style shells when the page-level right track is empty instead of structurally counterweighted.
- pulse-festival / mobile-recomposition: The pulse-festival fixture relies mostly on column collapse and still shows weak mobile re-staging signals.
  Owner area: web QA / responsive scoring
  Recommended fix: Require mobile reordering and staged hierarchy changes, not just single-column collapse.
- pulse-festival / texture-discipline: The pulse-festival fixture uses enough layered gradients or texture treatment to risk feeling like a reusable harness default.
  Owner area: design audit / visual direction
  Recommended fix: Penalize repeated background texture patterns unless the style family explicitly calls for them.
- saas-foundry / mobile-recomposition: The saas-foundry fixture relies mostly on column collapse and still shows weak mobile re-staging signals.
  Owner area: web QA / responsive scoring
  Recommended fix: Require mobile reordering and staged hierarchy changes, not just single-column collapse.
- saas-foundry / style-fidelity: Minimal SaaS surfaces remain vulnerable to collapsing into generic shadcn-like shells unless the preview lane and command ribbon are explicitly designed as product proof, not decorative support.
  Owner area: style-selector / screen-brief
  Recommended fix: Add stronger style-fidelity checks for restrained SaaS directions so generic startup fallback fails even when the UI is clean.
- saas-foundry / texture-discipline: The saas-foundry fixture uses enough layered gradients or texture treatment to risk feeling like a reusable harness default.
  Owner area: design audit / visual direction
  Recommended fix: Penalize repeated background texture patterns unless the style family explicitly calls for them.
- terminal-cloud / mobile-recomposition: The terminal-cloud fixture relies mostly on column collapse and still shows weak mobile re-staging signals.
  Owner area: web QA / responsive scoring
  Recommended fix: Require mobile reordering and staged hierarchy changes, not just single-column collapse.
- wealth-ops / composition-calibration: The first remediated wealth-ops pass still produced an optical collision between the left control rail and the main hero canvas even though the CSS grid itself was valid.
  Owner area: design remediation / scoring
  Recommended fix: Add optical-collision and composition-balance checks to design-audit and the UI harness so dense layouts can fail before screenshots are approved.
- wealth-ops / mobile-recomposition: The wealth-ops mobile view initially read like a compressed desktop stack instead of a staged mobile command surface with reprioritized sections and tighter action flow.
  Owner area: design remediation / responsive guidance
  Recommended fix: Add mobile re-staging checks to design-arrange and the UI harness so dense dashboards must reorder, compress, or defer sections instead of only stacking them.
- wealth-ops / mobile-recomposition: The wealth-ops fixture relies mostly on column collapse and still shows weak mobile re-staging signals.
  Owner area: web QA / responsive scoring
  Recommended fix: Require mobile reordering and staged hierarchy changes, not just single-column collapse.
- wealth-ops / texture-discipline: The wealth-ops fixture uses enough layered gradients or texture treatment to risk feeling like a reusable harness default.
  Owner area: design audit / visual direction
  Recommended fix: Penalize repeated background texture patterns unless the style family explicitly calls for them.

## Fix Order

1. promote harness-derived prompt traces and design execution traces into the core design runtime
2. promote the harness remediation executor into shared runtime support so audit output can route into arrange, typeset, bolder, distill, and polish outside the benchmark layer
3. promote the shared ui-testing route from script-backed orchestration into a native runtime executor
4. wire the harness scoring heuristics into shared design-audit and web-qa primitives so route-local logic is no longer the only scorer
5. teach shared design workflows to query the runtime style-reference catalog directly instead of relying on harness-only normalization
6. reduce remaining fixture-level regressions in mobile recomposition, texture discipline, and style-fidelity drift

