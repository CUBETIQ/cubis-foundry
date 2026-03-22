# Foundry Real-World Gaps

Date: March 21, 2026

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

## Recommended Fix Order

1. Ship a first-class Stitch executor with design gating, project reuse, and timeout recovery.
2. Ship a first-class mobile QA workflow with emulator/device preflight and Android MCP or ADB evidence capture.
3. Add structured execution tracing for routes, skills, references, and tool gating.
4. Formalize seeded-scenario integration testing in `flutter-mobile-qa`.
5. Add stricter MCP registry/build drift protection.

