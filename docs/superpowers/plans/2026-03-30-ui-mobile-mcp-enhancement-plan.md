# UI Skill and Mobile MCP Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the canonical UI and testing skills, add first-class `mobile-mcp` integration, and keep browser/mobile testing aligned to Playwright MCP plus deterministic mobile fallback flows.

**Architecture:** Refresh the canonical skill content first so the design/testing contract is clear, then wire `mobile-mcp` into Foundry's MCP provider stack, and finally connect the upgraded runtime story back into docs, manifests, and verification. Web remains Playwright-MCP-first. Mobile becomes dual-path: `mobile-mcp` preferred, CLI-first fallback preserved.

**Tech Stack:** Foundry `SKILL.md` modules, MCP gateway/provider config, route/runtime tools, Commander CLI commands, TypeScript, Vitest, Playwright MCP, `mobile-mcp`, Android `adb`, iOS `simctl` and helper scripts.

**Status (2026-03-30):** Tasks 1-6 are complete in this worktree. The canonical UI skills are upgraded, `mobile-mcp` is first-class in the bundled MCP provider stack, root CLI/help/docs reflect the new runtime model, Android/iOS testing skills are dual-path, and the full verification slice is green.

---

### Task 1: Rewrite the canonical UI design skills

**Files:**
- Modify: `foundry/modules/design/SKILL.md`
- Modify: `foundry/modules/web-ui-design/SKILL.md`
- Modify: `foundry/modules/mobile-ui-design/SKILL.md`
- Modify: `foundry/modules/design-system/SKILL.md`
- Modify: `foundry/modules/design-system/templates/claude.j2`
- Modify: `foundry/modules/design/references/execution-contract.md`

- [ ] **Step 1: Write the failing assertions for the new UI guidance**

Create or extend a targeted content test file:

```ts
// src/cli/catalog/ui-skills.test.ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../../..");

function skill(path: string) {
  return readFileSync(resolve(ROOT, path), "utf8");
}

describe("canonical UI skill guidance", () => {
  it("makes web-ui-design explicitly reject generic SaaS card grids", () => {
    expect(skill("foundry/modules/web-ui-design/SKILL.md")).toContain(
      "generic SaaS card grids",
    );
  });

  it("requires visual thesis and interaction thesis in design routing", () => {
    const content = skill("foundry/modules/design/SKILL.md");
    expect(content).toContain("visual thesis");
    expect(content).toContain("interaction thesis");
  });
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
npm run test:cli -- src/cli/catalog/ui-skills.test.ts
```

Expected: FAIL because the current skill text does not yet encode the new UI contract.

- [ ] **Step 3: Rewrite `design/SKILL.md` around route-first art direction**

Required content changes:

```md
## Working Model
- visual thesis
- content plan
- interaction thesis

## Hard Rules
- do not collapse critique, systemization, and execution into one answer
- return the chosen route and the non-negotiable anti-generic constraints
```

Also ensure the file still routes only to:

```md
- ../design-system/SKILL.md
- ../web-ui-design/SKILL.md
- ../mobile-ui-design/SKILL.md
```

- [ ] **Step 4: Rewrite `web-ui-design/SKILL.md` with the stronger OpenAI + Anthropic frontend rules**

The final content must explicitly cover:

```md
- one dominant idea per section
- full-bleed hero rule for branded landing pages
- cardless layout default
- image-led hierarchy
- utility-copy mode for product UI
- 2-3 intentional motion beats
- reject generic SaaS card-grid first impressions
```

- [ ] **Step 5: Rewrite `mobile-ui-design/SKILL.md` as a true phone-first execution skill**

The final content must explicitly cover:

```md
- one dominant screen idea
- thumb-reach and safe-area rules
- CTA placement discipline
- mobile-native state transitions
- no desktop compression disguised as mobile design
```

- [ ] **Step 6: Tighten `design-system` and the shared execution contract**

Update:

- `foundry/modules/design-system/SKILL.md`
- `foundry/modules/design-system/templates/claude.j2`
- `foundry/modules/design/references/execution-contract.md`

Required direction:

```md
- token vocabulary
- typography system
- spacing rhythm
- interaction/state language
- compatibility mirror wording may mention `.stitch/DESIGN.md`
- must not present `stitch` as a skill
```

- [ ] **Step 7: Re-run the focused UI skill test**

Run:

```bash
npm run test:cli -- src/cli/catalog/ui-skills.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit the UI skill rewrite**

```bash
git add \
  foundry/modules/design/SKILL.md \
  foundry/modules/web-ui-design/SKILL.md \
  foundry/modules/mobile-ui-design/SKILL.md \
  foundry/modules/design-system/SKILL.md \
  foundry/modules/design-system/templates/claude.j2 \
  foundry/modules/design/references/execution-contract.md \
  src/cli/catalog/ui-skills.test.ts
git commit -m "feat(foundry): strengthen canonical ui skill direction"
```

### Task 2: Rewrite `web-testing` around Playwright MCP best practices

**Files:**
- Modify: `foundry/modules/web-testing/SKILL.md`
- Modify: `mcp/src/tools/webQaRun.ts`
- Modify: `mcp/README.md`
- Modify: `mcp/src/tools/skillTools.test.ts`

- [ ] **Step 1: Add a failing assertion for Playwright-first guidance**

Add or extend a focused test:

```ts
it("keeps web-testing Playwright-MCP-first", () => {
  const content = skill("foundry/modules/web-testing/SKILL.md");
  expect(content).toContain("user-visible behavior");
  expect(content).toContain("role, label, placeholder, test id, text, CSS last");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm run test:cli -- src/cli/catalog/ui-skills.test.ts
```

Expected: FAIL on the new browser-testing expectations.

- [ ] **Step 3: Rewrite `web-testing/SKILL.md`**

The final content must explicitly cover:

```md
- Playwright MCP first
- user-visible behavior over implementation details
- isolated flow execution
- locator order: role -> label -> placeholder -> test id -> text -> CSS
- artifact capture at key transitions
- console/network errors as first-class findings
```

- [ ] **Step 4: Keep the runtime trace aligned**

Update `mcp/src/tools/webQaRun.ts` so the trace and selected references still point only to the canonical browser skill:

```ts
trace.selectedSkills = ["web-testing"];
trace.selectedReferences = ["foundry/modules/web-testing/SKILL.md"];
```

- [ ] **Step 5: Update the docs and route tests**

Adjust:

- `mcp/README.md`
- `mcp/src/tools/skillTools.test.ts`

so they never imply a deleted browser-specialist skill.

- [ ] **Step 6: Run MCP/browser verification**

Run:

```bash
npm --prefix mcp test -- src/tools/skillTools.test.ts src/tools/registry.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit the browser-testing rewrite**

```bash
git add \
  foundry/modules/web-testing/SKILL.md \
  mcp/src/tools/webQaRun.ts \
  mcp/README.md \
  mcp/src/tools/skillTools.test.ts \
  src/cli/catalog/ui-skills.test.ts
git commit -m "feat(foundry): make web testing playwright-first"
```

### Task 3: Add `mobile-mcp` as a first-class upstream provider

**Files:**
- Modify: `mcp/src/gateway/types.ts`
- Modify: `mcp/src/gateway/config.ts`
- Modify: `mcp/src/gateway/manager.ts`
- Modify: `mcp/src/upstream/passthrough.ts`
- Modify: `mcp/src/server.ts`
- Modify: `mcp/src/tools/registry.ts`
- Modify: `mcp/src/tools/registry.test.ts`
- Modify: `mcp/src/tools/mcpGateway.ts`
- Modify: `mcp/src/cbxConfig/types.ts`
- Modify: `mcp/src/cbxConfig/reader.ts`
- Modify: `mcp/src/cbxConfig/serviceConfig.ts`

- [ ] **Step 1: Write failing provider-registry tests**

Add tests asserting the new provider exists:

```ts
expect(summary.categories).toHaveProperty("mobile");
expect(names).toContain("mobile_list_enabled_tools");
```

and config normalization accepts:

```ts
mobile?: {
  mcpUrl?: string;
  activeProfileName?: string;
  profiles?: ...
}
```

- [ ] **Step 2: Run the MCP test suite to verify it fails**

Run:

```bash
npm --prefix mcp test -- src/tools/registry.test.ts src/cbxConfig/serviceConfig.test.ts
```

Expected: FAIL because `mobile-mcp` provider wiring does not exist yet.

- [ ] **Step 3: Add `mobile` provider support in gateway/config**

Required structure:

```ts
export type UpstreamProvider = "postman" | "stitch" | "playwright" | "android" | "mobile";
```

and config resolution parallel to existing provider config handling.

- [ ] **Step 4: Extend upstream passthrough discovery**

In `mcp/src/upstream/passthrough.ts`, add:

```ts
type ServiceId = "postman" | "stitch" | "playwright" | "android" | "mobile";
```

and ensure discovery, alias naming, and tool proxying work for `mobile`.

- [ ] **Step 5: Register mobile provider tools**

Add registry entries for:

```ts
mobileListEnabledToolsName
mobileGetModeName
mobileSetProfileName
mobileGetStatusName
```

if you keep the current per-provider tool pattern, or the equivalent minimal surface if you reuse existing helpers.

- [ ] **Step 6: Re-run MCP provider tests**

Run:

```bash
npm --prefix mcp test -- src/tools/registry.test.ts src/cbxConfig/serviceConfig.test.ts src/tools/configTools.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit the provider integration**

```bash
git add \
  mcp/src/gateway/types.ts \
  mcp/src/gateway/config.ts \
  mcp/src/gateway/manager.ts \
  mcp/src/upstream/passthrough.ts \
  mcp/src/server.ts \
  mcp/src/tools/registry.ts \
  mcp/src/tools/registry.test.ts \
  mcp/src/tools/mcpGateway.ts \
  mcp/src/cbxConfig/types.ts \
  mcp/src/cbxConfig/reader.ts \
  mcp/src/cbxConfig/serviceConfig.ts
git commit -m "feat(mcp): add mobile mcp provider support"
```

### Task 4: Expose `mobile-mcp` through the root CLI and MCP docs

**Files:**
- Modify: `src/cli/mcp/commands.ts`
- Modify: `src/cli/core.ts`
- Modify: `mcp/README.md`
- Modify: `docs/superpowers/handoffs/2026-03-26-foundry-v2-plan-a-handoff.md`
- Modify: `docs/superpowers/plans/2026-03-28-foundry-v2-realignment-plan.md`
- Modify: `docs/superpowers/specs/2026-03-28-foundry-v2-realignment-spec.md`

- [ ] **Step 1: Write the failing CLI/help expectation**

Add or extend a CLI test to assert `mobile` appears in the MCP service surfaces where appropriate:

```ts
expect(helpText).toContain("postman|stitch|mobile|all");
```

- [ ] **Step 2: Run the CLI help or command test to verify it fails**

Run:

```bash
npm run test:cli -- src/cli/commands/register.test.ts
```

Expected: FAIL until the CLI option text and command logic are updated.

- [ ] **Step 3: Update root CLI MCP command surfaces**

Required updates:

- `src/cli/mcp/commands.ts`
- any `runMcp...` service parsing in `src/cli/core.ts`

The service lists should admit `mobile` wherever upstream provider inspection/config/status flows are intended to support it.

- [ ] **Step 4: Rewrite MCP documentation around the new runtime story**

Update `mcp/README.md` to document:

- Playwright MCP as canonical browser runtime
- `mobile-mcp` as the preferred semantic mobile runtime
- CLI-first Android/iOS tooling as fallback
- expected heavy setup on iOS

- [ ] **Step 5: Sync active realignment docs**

Record in the active spec/plan/handoff that:

- `mobile-mcp` is now a first-class MCP provider
- Android and iOS testing are dual-path
- web stays Playwright-first

- [ ] **Step 6: Run doc/CLI verification**

Run:

```bash
npm run test:cli-help
node dist/cli/index.js mcp --help
```

Expected: PASS, and help text includes the new mobile provider where relevant.

- [ ] **Step 7: Commit the CLI/docs integration**

```bash
git add \
  src/cli/mcp/commands.ts \
  src/cli/core.ts \
  mcp/README.md \
  docs/superpowers/handoffs/2026-03-26-foundry-v2-plan-a-handoff.md \
  docs/superpowers/plans/2026-03-28-foundry-v2-realignment-plan.md \
  docs/superpowers/specs/2026-03-28-foundry-v2-realignment-spec.md
git commit -m "docs(foundry): record mobile mcp testing path"
```

### Task 5: Upgrade Android and iOS testing skills to dual-path guidance

**Files:**
- Modify: `foundry/modules/android-emulator-testing/SKILL.md`
- Modify: `foundry/modules/ios-simulator-testing/SKILL.md`
- Add: `foundry/modules/android-emulator-testing/references/mobile-mcp.md`
- Add: `foundry/modules/ios-simulator-testing/references/mobile-mcp.md`
- Add: `foundry/modules/ios-simulator-testing/references/mobile-mcp-setup.md`

- [ ] **Step 1: Write the failing content assertions**

Add focused assertions:

```ts
expect(skill("foundry/modules/android-emulator-testing/SKILL.md")).toContain("mobile-mcp");
expect(skill("foundry/modules/ios-simulator-testing/SKILL.md")).toContain("WebDriverAgent");
expect(skill("foundry/modules/ios-simulator-testing/SKILL.md")).toContain("fallback");
```

- [ ] **Step 2: Run the skill test to verify it fails**

Run:

```bash
npm run test:cli -- src/cli/catalog/ui-skills.test.ts
```

Expected: FAIL until the mobile skills are updated.

- [ ] **Step 3: Rewrite `android-emulator-testing/SKILL.md`**

The final skill must explicitly define:

```md
- preferred path: mobile-mcp
- fallback path: adb + emulator + uiautomator + screenshots + logcat
- when to choose semantic MCP interaction vs deterministic CLI evidence
```

- [ ] **Step 4: Rewrite `ios-simulator-testing/SKILL.md`**

The final skill must explicitly define:

```md
- preferred path: mobile-mcp
- fallback path: simctl + xcodebuild + Python helpers
- iOS setup caveats: WebDriverAgent, simulator readiness, heavier environment assumptions
```

- [ ] **Step 5: Add sidecar references for `mobile-mcp` usage**

Create concise references covering:

- Android mobile-mcp flow
- iOS mobile-mcp flow
- iOS setup/troubleshooting

- [ ] **Step 6: Re-run the focused content test**

Run:

```bash
npm run test:cli -- src/cli/catalog/ui-skills.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit the mobile skill rewrite**

```bash
git add \
  foundry/modules/android-emulator-testing/SKILL.md \
  foundry/modules/ios-simulator-testing/SKILL.md \
  foundry/modules/android-emulator-testing/references/mobile-mcp.md \
  foundry/modules/ios-simulator-testing/references/mobile-mcp.md \
  foundry/modules/ios-simulator-testing/references/mobile-mcp-setup.md \
  src/cli/catalog/ui-skills.test.ts
git commit -m "feat(foundry): add dual-path mobile testing skills"
```

### Task 6: Full verification and final cleanup

**Files:**
- Verify only

- [ ] **Step 1: Build the CLI and MCP packages**

Run:

```bash
npm run build:cli
```

Expected: PASS.

- [ ] **Step 2: Run the focused CLI tests**

Run:

```bash
npm run test:cli -- src/cli/catalog/catalog.test.ts src/cli/catalog/ui-skills.test.ts src/cli/compiler/compiler.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run the MCP test suite slices touched by this work**

Run:

```bash
npm --prefix mcp test -- src/tools/skillTools.test.ts src/tools/registry.test.ts src/tools/configTools.test.ts src/cbxConfig/serviceConfig.test.ts
```

Expected: PASS.

- [ ] **Step 4: Run the TypeScript no-emit check**

Run:

```bash
npx tsc -p tsconfig.cli.json --noEmit
```

Expected: PASS.

- [ ] **Step 5: Validate and rebuild the catalog**

Run:

```bash
node dist/cli/index.js catalog validate
node dist/cli/index.js catalog build
```

Expected:

```text
Catalog is valid.
```

and all five platforms compile successfully.

- [ ] **Step 6: Capture proof that the upgraded surfaces are live**

Run:

```bash
rg -n "visual thesis|interaction thesis|full-bleed|user-visible behavior|mobile-mcp|WebDriverAgent" \
  foundry/modules/design \
  foundry/modules/web-ui-design \
  foundry/modules/mobile-ui-design \
  foundry/modules/web-testing \
  foundry/modules/android-emulator-testing \
  foundry/modules/ios-simulator-testing
```

Expected: concrete hits in the rewritten canonical skills and references.

- [ ] **Step 7: Commit the final verification checkpoint**

```bash
git add .
git commit -m "feat(foundry): upgrade ui skills and mobile testing runtime"
```
