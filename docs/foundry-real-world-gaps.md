# Foundry Real-World Gaps

Date: March 23, 2026

This document captures the concrete issues exposed while using Foundry to:
- generate Stitch-driven UI concepts
- build real Flutter validation apps
- run emulator-based integration tests
- exercise Android/ADB-style QA workflows

The goal is to track the gaps that still need product or tooling fixes inside Foundry itself. This is not an app bug list unless the issue exposed a Foundry design problem.

## High-Priority Gaps

### 1. Stitch execution is still too manual
- Problem: Foundry can route Stitch intent correctly, but the actual execution path still depends on manual orchestration instead of a first-class runtime that loads design skills, prepares design context, checks Stitch availability, chooses the right tool, and performs guarded retries.
- Evidence:
  - route resolution correctly selected the Stitch-aware implement path
  - actual screen generation still relied on direct MCP tool calls and manually prepared context
- Fix direction:
  - add a real Stitch executor in the MCP/runtime layer
  - require design prep before generation
  - make project reuse, screen reuse, and timeout recovery automatic

### 2. Stitch timeout handling is not first-class enough
- Problem: long-running Stitch generation calls can time out at the MCP/client layer even when the remote operation completes successfully.
- Evidence:
  - `generate_screen_from_text` timed out while the screen still appeared in subsequent `list_screens` calls
  - shorter prompts succeeded more often than larger prompts
- Fix direction:
  - use longer tool-specific timeouts for Stitch mutations
  - add post-timeout recovery by checking `list_screens`
  - surface “operation may have completed remotely” instead of a plain hard failure

### 3. Stitch project reuse policy still needs stronger automation
- Problem: Foundry now supports exact-title reuse, but the higher-level workflow still tends to create concept projects too eagerly during exploratory runs.
- Evidence:
  - repeated validation sessions created multiple temporary Stitch projects before reuse policy was tightened
- Fix direction:
  - make project lookup and reuse mandatory in the orchestration path
  - reuse screens with `edit_screens` whenever a matching concept already exists
  - expose “reuse or create” explicitly in the user-facing runtime logs

### 4. Android MCP is not yet integrated as a first-class Foundry runtime
- Problem: Foundry can install Android MCP config, but the actual validation work still required direct `adb` and emulator management outside a unified Foundry workflow.
- Evidence:
  - real emulator/device checks were done with `adb` and Flutter tooling
  - Android MCP concepts exist in skills and setup, but there is no single Foundry command that orchestrates build, install, screenshot, UI tree, and logs end-to-end
- Fix direction:
  - add a native `cbx mobile qa` or equivalent workflow
  - standardize screenshot, UI tree, log capture, and app install/launch in one place
  - support both direct ADB fallback and Android MCP server mode

### 5. Emulator reliability is a real bottleneck and Foundry does not manage it yet
- Problem: slow or stale emulators caused false negatives, install failures, and boot timing issues that Foundry currently leaves entirely to the operator.
- Evidence:
  - insufficient storage on `/data` blocked APK install
  - `adb` reported boot-ready before the device was truly install-ready
  - headless emulator runs became unstable and required restart/wipe
- Fix direction:
  - add preflight checks for emulator storage, boot completeness, and install readiness
  - add recommended recovery actions in runtime output
  - optionally provide a managed “clean emulator session” mode for mobile validation

## Design Engine Gaps

### 6. Design skills exist, but enforcement is still mostly policy rather than runtime guarantees
- Problem: the design-first model is documented and routed, but it is still possible to bypass the full intended sequence with manual calls.
- Evidence:
  - generated docs and route resolution were correct
  - actual high-quality output still depended on manual discipline
- Fix direction:
  - encode design-prep completion in runtime state
  - block Stitch generation when design state is missing or stale
  - emit structured artifacts showing which design skills and references actually ran

### 7. Design datasets are not yet observable in runtime behavior
- Problem: the new normalized design datasets exist, but it is not obvious from execution traces which entries influenced a generation or handoff.
- Evidence:
  - design direction improved structurally, but provenance of chosen motifs, motion rules, and token language is still opaque
- Fix direction:
  - log selected dataset entries during design-screen and design-system runs
  - include dataset provenance in generated design briefs

## Testing Gaps

### 8. Foundry needed app-specific stable keys to make emulator testing reliable
- Problem: real slow-device testing exposed that many interactions were not robustly targetable until we manually added screen and control keys.
- Evidence:
  - product-detail, wishlist, profile, orders, and screen-level navigation all benefited from new stable keys
  - test failures were often due to ambiguous or offscreen elements rather than business logic
- Fix direction:
  - add stronger guidance in design/mobile QA skills for testability hooks
  - consider a “testability contract” checklist for generated reference apps and design handoffs

### 9. One giant integration flow was too fragile for slow emulators
- Problem: a monolithic device test made it hard to separate environment issues, app bugs, and simple timing problems.
- Evidence:
  - splitting the suite into smaller seeded scenarios produced much more stable results
  - once split, the suite passed with far less ambiguity
- Fix direction:
  - document seeded scenario testing as the default Foundry mobile QA pattern
  - prefer multiple smaller integration tests over one giant end-to-end chain

### 10. Foundry does not yet provide a first-class seeded-state testing workflow
- Problem: seeded persisted-state tests were the key to stabilizing emulator coverage, but Foundry does not expose a built-in pattern or helper for it.
- Evidence:
  - the final passing suite used persisted shop state to test specific slices cleanly
- Fix direction:
  - add guidance or helpers for seeded-state integration tests in `flutter-mobile-qa`
  - promote “seed, launch, verify slice” as the standard mobile testing recipe

## Runtime And Tooling Gaps

### 11. MCP docs and actual exposed tools can drift
- Problem: earlier live testing exposed mismatches between documented helper tools and what the server actually exported.
- Evidence:
  - helper tools had to be explicitly registered and rebuilt before live testing matched expectations
- Fix direction:
  - keep an executable registry test for every documented MCP helper tool
  - make `build:cli` and runtime rebuild expectations unambiguous

### 12. Local rebuild coupling is still easy to miss
- Problem: MCP changes can exist in source while local runs still use stale built output if the right build path is skipped.
- Evidence:
  - live testing surfaced stale runtime behavior until the build path rebuilt `mcp/dist`
- Fix direction:
  - enforce rebuild coupling in scripts
  - fail fast when generated runtime output is stale compared to source

## UX Gaps In Foundry Itself

### 13. Route correctness is better than runtime transparency
- Problem: routing decisions are now much stronger, but operators still need more visibility into what actually ran after routing.
- Evidence:
  - route resolution said the right thing, but there was no single structured trace proving which skills, references, and gates executed during a run
- Fix direction:
  - add structured execution traces for routes, loaded skills, selected references, and blocked tool calls

### 14. Mobile QA should be an explicit first-class workflow, not just a skill plus manual steps
- Problem: the current skill content is useful, but the operator still had to manually sequence build, install, integration, screenshot, UI tree, and logs.
- Evidence:
  - the successful validation process was repeatable, but not yet encapsulated as one Foundry workflow
- Fix direction:
  - introduce a dedicated mobile QA workflow for Flutter/Android validation
  - make artifact output paths deterministic

### 15. UI harness provenance is still manual
- Problem: the new web UI testing harness can record dataset ids, exclusions, and skill sequence, but only through manually authored `prompt-trace.json` files rather than a first-class runtime artifact.
- Evidence:
  - every scenario in `ui-testing/` required a hand-authored prompt trace to preserve design reasoning
  - the current design runtime still does not emit selected dataset ids or anti-slop exclusions automatically
- Fix direction:
  - promote prompt-trace generation into the design runtime
  - attach selected style direction, motif, layout pattern, and exclusions to every design-heavy run

### 16. Web UI testing is still a folder-first harness, not a first-class workflow
- Problem: Foundry now has a repo-local `ui-testing/` harness, but operators still need to coordinate fixture serving, charter execution, score aggregation, and report updates manually.
- Evidence:
  - the current loop depends on local scripts and per-scenario QA charters
  - there is still no single `cbx` command or workflow that runs multi-scenario web UI evaluation end-to-end
- Fix direction:
  - add a first-class `ui-testing` workflow or CLI surface on top of existing web QA primitives
  - let the workflow chain scenario selection, browser evidence capture, scoring, and consolidated report generation

### 17. Web style coverage is improving, but the normalized dataset is still thin
- Problem: the harness needed new style directions, motifs, and layout patterns just to produce an initial ten-scenario benchmark without drifting back to the same few safe web compositions.
- Evidence:
  - `monochrome-editorial`, `newsprint-editorial`, `saas-minimal`, `luxury-formal`, `enterprise-disciplined`, `swiss-minimalist`, `neo-brutalist-product`, `terminal-ops`, `industrial-control`, and `kinetic-poster` had to be added during the harness expansion
  - distinct editorial, SaaS, luxury, industrial, and poster-like scenarios still relied on manual research normalization from `designprompts.dev`
- Fix direction:
  - keep expanding the web-oriented style catalog with stronger anti-cliche exclusions
  - grow motif and layout coverage so multi-scenario UI evaluation does not require bespoke curation every time

### 18. External style intake is still normalized in the harness instead of the runtime
- Problem: Foundry now depends on a large external style reference intake, but the normalization step still lives inside the repo-local harness rather than in a first-class runtime dataset pipeline.
- Evidence:
  - the v2 harness added `ui-testing/research/design-prompts-style-catalog.json` with 30 normalized style entries
  - those entries are useful immediately, but they are still harness-managed research artifacts instead of runtime-native design data
- Fix direction:
  - promote style-reference normalization into a reusable Foundry dataset pipeline
  - preserve source metadata, anti-patterns, and mapping status in runtime-visible assets instead of only local harness files

### 19. Responsive UI quality is still evidence-rich but rubric-poor
- Problem: Foundry can capture desktop and mobile evidence for web fixtures, but it still does not score meaningful re-composition quality as a first-class concern.
- Evidence:
  - the harness could save viewport-specific screenshots and snapshots
  - responsive quality still had to be scored manually because existing web QA primitives do not understand layout re-composition or thumb-reach style heuristics
  - dense surfaces such as `wealth-ops` initially degraded into compressed desktop stacks until the mobile order and section staging were manually rewritten
- Fix direction:
  - add viewport-aware scoring hooks to the web QA or UI testing workflow
  - surface responsive drift as a structured report dimension instead of a freeform reviewer note

### 20. Design remediation now exists as skills, but not yet as a guided runtime
- Problem: Foundry now has a usable command layer for second-pass UI remediation, but operators still need to decide manually when to run audit, typeset, arrange, bolder, distill, or polish after a weak first pass.
- Evidence:
  - the second UI harness pass improved substantially only after manually sequencing the new remediation skills
  - prompt traces still needed to record remediation steps by hand because the runtime does not understand this loop yet
- Fix direction:
  - add a first-class remediation workflow that runs `design-audit` first and routes to the right follow-on skills
  - emit remediation traces automatically so the harness can prove how a weak surface was improved

### 21. Optical collision detection is still manual
- Problem: the remediated web harness can still approve layouts whose composition is technically valid but visually collides, such as a narrow control rail fighting a very large adjacent hero headline.
- Evidence:
  - the first second-pass `wealth-ops` desktop layout looked overlapped even though the CSS grid was correct
  - the first `atelier-stay` pass also let the hero headline overpower the supporting editorial stack until the type scale and column proportions were manually rebalanced
  - the issue required manual visual correction to rail width, gutter strength, and headline scale after browser review
- Fix direction:
  - add composition-balance and optical-collision checks to `design-audit` and the web UI harness
  - treat rail-to-canvas tension, oversized adjacent headlines, and weak seam definition as explicit review failures

### 22. Layout occupancy is not audited as a first-class failure
- Problem: Foundry can emit a visually polished desktop grid that still wastes a major track on empty space because the harness does not verify whether reserved rails or columns are actually populated.
- Evidence:
  - the first `coach-loop` desktop shell reserved a full right-side track even though only one top-level grid child was mounted
  - the first `field-notes` and `pulse-festival` shells repeated the same page-level track waste, which users read as a left-spacing bug rather than intentional negative space
  - the issue looked like a design decision at first glance, but browser review showed it was dead layout space rather than intentional counterweight
- Fix direction:
  - add layout-occupancy checks to `design-audit` and the UI harness
  - fail layouts that reserve major desktop columns or rails without meaningful mounted content

### 23. Style fidelity is still judged manually
- Problem: the expanded harness now scores style fidelity, but the score is still authored by hand in scorecards rather than emitted by runtime heuristics.
- Evidence:
  - restrained scenarios such as `saas-foundry` need different failure checks than editorial, neo-brutalist, or industrial surfaces
  - the harness can describe drift back to generic UI defaults, but current Foundry tooling cannot score that drift automatically
- Fix direction:
  - add style-family-aware checks to `design-audit`
  - treat regression to generic startup UI, generic luxury styling, or generic enterprise BI as explicit scoring failures

### 24. The web harness lacked a first-class style component atlas
- Problem: the harness compared full pages, but it did not initially provide one place to inspect how each style family treats core component primitives such as buttons, cards, chips, inputs, tabs, drawers, and action clusters.
- Evidence:
  - browser review repeatedly surfaced geometry and component-language complaints that were hard to isolate from full-page composition issues
  - it was difficult to compare restrained SaaS, editorial, brutalist, industrial, and Material-like systems side by side without a dedicated atlas surface
- Fix direction:
  - add a first-class component-atlas page or workflow to the UI harness
  - score geometry, density, and interaction-state variation at the component-system layer, not just the page-shell layer

### 25. Rounded and tactile system coverage was underrepresented
- Problem: the expanded harness over-indexed on hard-edge, low-radius visual systems, so it did not adequately benchmark rounded and tactile directions such as Material-style product surfaces.
- Evidence:
  - multiple benchmark pages used sharp borders and rule-driven geometry
  - user review correctly called out the lack of radius diversity and asked where Material design fit into the benchmark matrix
- Fix direction:
  - add canonical rounded-system coverage to the style datasets
  - ensure at least one benchmark or atlas lane exercises Material-like surfaces, chips, FABs, sheets, and rounded cards

### 26. Texture overlays are too easy to overuse
- Problem: several fixture pages used faint grid or box textures as a quick stylistic differentiator, but repeated use made the backgrounds feel like a harness default instead of a deliberate style choice.
- Evidence:
  - browser review surfaced the visible box-pattern background on multiple pages
  - the texture looked more like a repeated design crutch than style-specific surface treatment
- Fix direction:
  - add texture-discipline checks to `design-audit`
  - require surface texture to be justified by the active style family instead of used as a generic backdrop

## Recommended Fix Order

1. Ship a first-class Stitch executor with design gating, project reuse, and timeout recovery.
2. Ship a first-class mobile QA workflow with emulator/device preflight and Android MCP or ADB evidence capture.
3. Promote prompt-trace provenance and structured execution tracing for routes, skills, references, and tool gating.
4. Promote the new design remediation command layer into a guided runtime with explicit traces.
5. Ship a first-class web UI testing workflow that composes scenario manifests, QA charters, scorecards, remediation passes, and consolidated reporting.
6. Promote external style-reference normalization into a reusable runtime dataset pipeline.
7. Add style-fidelity scoring, optical-collision checks, and layout-occupancy checks to the design remediation and scoring loop.
8. Expand the web style dataset, add a first-class component-atlas workflow, and add responsive/mobile-recomposition scoring hooks.
