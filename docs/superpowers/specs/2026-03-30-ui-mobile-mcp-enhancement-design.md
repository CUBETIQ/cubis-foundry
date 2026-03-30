# UI Skill and Mobile MCP Enhancement Design

Date: 2026-03-30
Repo: `/Users/phumrin/Documents/Cubis Foundry/.worktrees/foundry-v2-plan-a`
Branch: `foundry-v2-plan-a`

## Goal

Strengthen Foundry's UI and testing surfaces by:

- upgrading the canonical design skills so they produce more distinctive, premium, implementation-ready UI direction for web and mobile
- making `web-testing` explicitly Playwright-MCP-first
- adding `mobile-mcp` as a first-class Foundry MCP integration for Android and iOS while retaining the current CLI-first mobile path as a fallback and evidence path

## Why This Change Exists

The current canonical design and testing skills are directionally correct but still underspecified for the quality bar now expected:

- UI skills need stronger art direction, hierarchy, restraint, and motion guidance so outputs stop converging on generic app and landing-page patterns
- `web-testing` should be unambiguous about Playwright MCP as the primary browser runtime
- mobile testing currently has good CLI-first coverage, but no equivalent first-class semantic MCP path for richer Android/iOS interaction

This design keeps the reduced taxonomy from the realignment effort while materially upgrading the execution quality behind it.

## Research Inputs

### OpenAI frontend guidance

The provided OpenAI frontend guidance pushes four important defaults:

- composition before components
- one dominant idea per section
- image-led or visual-anchor-led hierarchy
- motion used sparingly but intentionally

That guidance should shape the canonical web and mobile design skills directly rather than living as informal advice.

### Anthropic frontend-design guidance

The provided Anthropic guidance pushes:

- bold but coherent aesthetic direction
- stronger typography and anti-generic visual choices
- explicit differentiation and memorable design identity
- production-grade code and real implementation awareness

This maps cleanly onto Foundry's canonical design stack and should be expressed as enforceable design behavior, not optional inspiration.

### Playwright

Official Playwright guidance emphasizes:

- testing user-visible behavior
- strong isolation between runs
- resilient locators, especially role- and label-based locators

Sources:

- https://playwright.dev/docs/best-practices
- https://playwright.dev/docs/locators
- https://github.com/microsoft/playwright-mcp

### Mobile MCP

`mobile-mcp` already provides a cross-platform MCP automation layer for:

- Android emulators and devices
- iOS simulators and devices
- app install/launch/terminate flows
- element listing
- taps, swipes, text input, screenshots, and device control

It is a real fit for Foundry, but it is heavier than the current CLI-first path. In particular:

- Android depends on the Android SDK / ADB path being available
- iOS simulator/device support depends on WebDriverAgent and a booted simulator or connected device

Sources:

- https://github.com/mobile-next/mobile-mcp
- https://github.com/mobile-next/mobile-mcp/wiki
- https://github.com/mobile-next/mobile-mcp/wiki/Getting-Started-with-iOS-Simulators
- https://github.com/mobile-next/mobile-mcp/wiki/Getting-Started-with-Android-Physical-Device

## Chosen Approach

Chosen approach: full skill + runtime realignment.

This means:

- rewrite the canonical UI skills, not just their examples
- keep `web-testing` Playwright-MCP-first
- add `mobile-mcp` as a real upstream MCP integration
- keep CLI-first Android/iOS guidance as the deterministic fallback path

This is intentionally heavier than a skill-only rewrite because the user explicitly wants the stronger mobile automation surface, not just better prose.

## Non-Goals

- no broad rewrite of unrelated backend, security, or research skills in this pass
- no removal of Playwright MCP from Foundry
- no replacement of the current CLI-first mobile path with mobile-mcp-only behavior
- no immediate deletion of Stitch MCP service integration; this pass is about UI skill quality and mobile testing/runtime strength

## Canonical Skill Outcomes

### 1. `design`

`design` remains the top-level routing and critique surface, but its internal standard becomes stricter.

It should require:

- a visual thesis
- a content plan
- an interaction thesis
- explicit route selection into `web-ui-design`, `mobile-ui-design`, or `design-system`
- anti-generic constraints that downstream execution must preserve

It should reject:

- generic SaaS-card-first layouts
- weak brand hierarchy
- decorative motion without hierarchy value
- blended outputs that mix critique, routing, and execution into one vague answer

### 2. `web-ui-design`

`web-ui-design` becomes the strongest browser-first aesthetic execution skill in the stack.

It should encode:

- full-bleed hero rules for branded landing pages
- default section sequencing for landing pages
- restrained, layout-first product UI guidance
- explicit card skepticism
- typography direction that avoids generic defaults
- explicit motion expectations for hero, scroll, and interaction states
- image-led hierarchy where imagery must do narrative work
- stronger litmus checks and failure cases

It should support both:

- expressive marketing/brand surfaces
- calmer product/dashboard surfaces with utility-first copy

### 3. `mobile-ui-design`

`mobile-ui-design` should become the phone-first equivalent of `web-ui-design`, not just a shrunk layout surface.

It should encode:

- one dominant screen idea per screen
- thumb-reach and safe-area-aware composition
- CTA placement discipline
- mobile-native flow pacing
- platform-aware state handling
- animation guidance that fits mobile performance and tactile feel
- explicit rejection of desktop layout compression disguised as mobile design

### 4. `design-system`

`design-system` remains the canonical system surface but should become more useful as the stable bridge between art direction and implementation.

It should explicitly own:

- token vocabulary
- typography system
- spacing and rhythm system
- component tone and interaction language
- state semantics
- design refresh rules

It may continue to mention `.stitch/DESIGN.md` as a compatibility mirror if that mirror still exists in runtime behavior, but it should not imply `stitch` is a skill.

### 5. `web-testing`

`web-testing` should become unambiguously Playwright-MCP-first.

It should encode:

- user-visible behavior over implementation details
- role/label/placeholder/test-id locator order
- single-flow evidence-driven runs
- explicit artifact capture at key steps
- console and network failures as first-class findings
- when to stop and report a blocked step instead of continuing blindly

It should not imply a secondary deleted browser-specialist skill.

### 6. `android-emulator-testing`

`android-emulator-testing` becomes a dual-path skill:

- preferred path: `mobile-mcp`
- deterministic fallback path: CLI-first `adb` + emulator + UI dump + screenshots + logcat

The skill should teach when to use which:

- use `mobile-mcp` for semantic interaction, screen element listing, and richer automation
- use CLI-first tooling when environment assumptions are brittle, when lower-level control is needed, or when reproducible evidence bundles matter more than convenience

### 7. `ios-simulator-testing`

`ios-simulator-testing` also becomes dual-path:

- preferred path: `mobile-mcp`
- fallback path: `simctl`, `xcodebuild`, and the existing Python/shell helpers

The skill should explicitly document:

- `mobile-mcp` setup cost on iOS
- WebDriverAgent dependency
- when to stay on raw simulator tooling instead

## Runtime and MCP Outcomes

### 1. Add `mobile-mcp` as a Foundry upstream provider

Foundry should gain a new upstream service/provider for `mobile-mcp`, parallel to existing upstream MCP-backed services.

This should include:

- gateway config support
- provider status reporting
- enabled-tool discovery
- MCP registry entries where needed
- CLI config and status surfaces
- docs for install and runtime expectations

### 2. Preserve mobile CLI-first fallback

Even with `mobile-mcp` added, the existing CLI-first mobile path remains part of the canonical testing design.

Reason:

- CLI-first remains the most deterministic low-level control path
- it aligns with the current sample assets and helper scripts
- it gives a defensible fallback when `mobile-mcp` environment setup is incomplete

### 3. Keep Playwright MCP as the browser runtime

No browser runtime replacement is needed.

`web-testing` should remain anchored to:

- Playwright MCP for live interactive evidence
- Playwright best-practice locator and isolation guidance

## Affected Surface Areas

### Skill authoring

- `foundry/modules/design/**`
- `foundry/modules/web-ui-design/**`
- `foundry/modules/mobile-ui-design/**`
- `foundry/modules/design-system/**`
- `foundry/modules/web-testing/**`
- `foundry/modules/android-emulator-testing/**`
- `foundry/modules/ios-simulator-testing/**`

### MCP/runtime

- `mcp/src/gateway/**`
- `mcp/src/tools/**`
- `mcp/src/upstream/**`
- `src/cli/mcp/**`
- `src/cli/core.ts`
- generated manifest/docs surfaces as needed

### Planning/docs

- active realignment plan/spec/handoff under `docs/superpowers/**`
- MCP docs in `mcp/README.md`

## Implementation Shape

### Phase A — Rewrite UI skill content

Refresh the canonical design skills to encode the stronger OpenAI + Anthropic frontend guidance directly in:

- purpose
- when-to-use triggers
- instructions
- anti-patterns
- output contracts
- references

### Phase B — Upgrade web testing guidance

Tighten `web-testing` so it matches official Playwright behavior and current Foundry MCP routing.

### Phase C — Add mobile-mcp integration

Add `mobile-mcp` as a new MCP provider while preserving current Android/iOS fallback tooling.

### Phase D — Upgrade mobile testing skills

Rewrite Android and iOS testing skills so they explain:

- preferred `mobile-mcp` flow
- fallback CLI-first flow
- evidence expectations
- environment troubleshooting

## Risks

### 1. iOS setup complexity

`mobile-mcp` on iOS depends on WebDriverAgent and simulator/device readiness, so Foundry must not oversell it as zero-setup.

Mitigation:

- document it honestly
- keep the fallback path first-class
- add status tooling that makes environment readiness explicit

### 2. Taxonomy drift

If new UI/testing guidance reintroduces sidecar or wrapper language carelessly, the reduced taxonomy will get messy again.

Mitigation:

- only upgrade canonical skills
- avoid reviving deleted skill names
- keep references and examples aligned to the canonical surface only

### 3. Runtime drift between docs and code

If `mobile-mcp` is documented but not actually wired through Foundry MCP tooling, the skills become misleading.

Mitigation:

- treat MCP integration and skill rewrite as one coordinated implementation effort

## Success Criteria

This design is complete when:

- the four canonical design skills produce stronger, more distinctive, less generic UI direction
- `web-testing` is clearly Playwright-MCP-first and aligned with official Playwright guidance
- `mobile-mcp` is available as a real Foundry MCP integration
- Android and iOS testing skills support both `mobile-mcp` and CLI-first fallback flows
- active docs under `docs/superpowers/` describe the new runtime and skill behavior accurately
- verification demonstrates the new MCP and skill surfaces compile, validate, and test cleanly

