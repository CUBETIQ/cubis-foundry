import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = resolve(import.meta.dirname, "../../..");

function readSkill(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), "utf8");
}

describe("canonical UI skill content", () => {
  it("keeps frontend-design as the public umbrella without sending users back to the helper stack", () => {
    const content = readSkill("foundry/modules/frontend-design/SKILL.md");

    expect(content).toContain("public umbrella entrypoint");
    expect(content).toContain("style contract");
    expect(content).toContain("visual thesis");
    expect(content).toContain("interaction thesis");
    expect(content).toContain("../design/SKILL.md");
    expect(content).toContain("../design-system/SKILL.md");
    expect(content).toContain("../web-ui-design/SKILL.md");
    expect(content).toContain("../mobile-ui-design/SKILL.md");
    expect(content).toContain("../desktop-ui-design/SKILL.md");
    expect(content).toContain("Keep the legacy `frontend-design-*` helper stack out of the recommended path");
    expect(content).not.toContain("frontend-design-core");
    expect(content).not.toContain("frontend-design-style-selector");
  });

  it("requires the design router to demand visual thesis and interaction thesis", () => {
    const content = readSkill("foundry/modules/design/SKILL.md");
    expect(content).toContain("style contract");
    expect(content).toContain("visual thesis");
    expect(content).toContain("interaction thesis");
    expect(content).toContain("content plan");
    expect(content).toContain("../frontend-design/SKILL.md");
    expect(content).toContain("../design-system/SKILL.md");
    expect(content).toContain("../web-ui-design/SKILL.md");
    expect(content).toContain("../mobile-ui-design/SKILL.md");
    expect(content).toContain("../desktop-ui-design/SKILL.md");
    expect(content).toContain("references/foundation.md");
    expect(content).toContain("references/responsive-adaptive-systems.md");
    expect(content).toContain("Route-First Constraints");
  });

  it("requires browser UI design to reject generic SaaS card-grid first impressions", () => {
    const content = readSkill("foundry/modules/web-ui-design/SKILL.md");
    expect(content).toContain("generic SaaS card-grid first impressions");
    expect(content).toContain("full-bleed hero rule");
    expect(content).toContain("2-3 intentional motions");
    expect(content).toContain("image-led hierarchy");
    expect(content).toContain("utility-copy mode");
    expect(content).toContain("Do not route or critique the task from this surface");
  });

  it("requires web testing to foreground user-visible behavior and isolated flow execution", () => {
    const content = readSkill("foundry/modules/web-testing/SKILL.md");
    expect(content).toContain("Playwright MCP first");
    expect(content).toContain("user-visible behavior");
    expect(content).toContain("isolated flow execution");
    expect(content).toContain("role, label, placeholder, test id, text, CSS last");
    expect(content).toContain("artifact capture at key transitions");
    expect(content).toContain("console errors and failed requests as first-class findings");
    expect(content).not.toContain("playwright-interactive");
  });

  it("requires mobile UI design to emphasize thumb reach and safe areas", () => {
    const content = readSkill("foundry/modules/mobile-ui-design/SKILL.md");
    expect(content).toContain("thumb reach");
    expect(content).toContain("safe areas");
    expect(content).toContain("mobile-native state transitions");
    expect(content).toContain("no desktop compression disguised as mobile design");
    expect(content).toContain("mobile-feasible patterns over browser habits");
    expect(content).toContain("phone-to-tablet adaptation");
  });

  it("adds a desktop UI design surface for multi-pane and keyboard-first work", () => {
    const content = readSkill("foundry/modules/desktop-ui-design/SKILL.md");
    expect(content).toContain("desktop is not a blown-up mobile app");
    expect(content).toContain("multi-pane structure");
    expect(content).toContain("keyboard");
    expect(content).toContain("persistent context");
    expect(content).toContain("../design/references/responsive-adaptive-systems.md");
  });

  it("keeps the design-system contract out of screen execution and preserves downstream refresh rules", () => {
    const skillContent = readSkill("foundry/modules/design-system/SKILL.md");
    const templateContent = readSkill("foundry/modules/design-system/templates/claude.j2");
    const contractContent = readSkill("foundry/modules/design/references/execution-contract.md");

    for (const content of [skillContent, templateContent]) {
      expect(content).toContain("style contract");
      expect(content).toContain("thesis set");
      expect(content).toContain("token language");
      expect(content).toContain("typography system");
      expect(content).toContain("interaction/state language");
      expect(content).toContain("Keep screen execution out of this surface");
      expect(content).toContain("web, mobile, and desktop");
      expect(content).toContain("semantic aliases");
      expect(content).toContain("do and do not guidance");
      expect(content).toContain("downstream surfaces should consume the refresh");
      expect(content).not.toContain(".stitch/DESIGN.md");
    }

    expect(contractContent).toContain("frontend-design");
    expect(contractContent).toContain("design-system");
    expect(contractContent).toContain("browser execution surface");
    expect(contractContent).toContain("mobile execution surface");
    expect(contractContent).toContain("desktop execution surface");
    expect(contractContent).toContain("typography system");
    expect(contractContent).toContain("interaction/state language");
    expect(contractContent).toContain("docs/foundation/DESIGN.md");
  });

  it("keeps Stitch docs aligned to the modern design-first route instead of the helper stack", () => {
    const orchestrator = readSkill("foundry/modules/stitch-design-orchestrator/SKILL.md");
    const compatibility = readSkill("foundry/modules/stitch/SKILL.md");

    expect(orchestrator).toContain("Start with `frontend-design`");
    expect(orchestrator).toContain("Use `design` to choose the owning execution surface");
    expect(orchestrator).toContain("run `design-system` first");
    expect(orchestrator).not.toContain("frontend-design-core");
    expect(orchestrator).not.toContain("frontend-design-style-selector");
    expect(orchestrator).not.toContain("frontend-design-screen-brief");

    expect(compatibility).toContain("1. `frontend-design`");
    expect(compatibility).toContain("2. `design`");
    expect(compatibility).toContain("3. `design-system`");
  });

  it("requires Android and iOS testing skills to describe the mobile-mcp-first dual-path model", () => {
    const android = readSkill("foundry/modules/android-emulator-testing/SKILL.md");
    const ios = readSkill("foundry/modules/ios-simulator-testing/SKILL.md");

    expect(android).toContain("mobile-mcp");
    expect(android).toContain("preferred path");
    expect(android).toContain("fallback path");
    expect(android).toContain("semantic MCP interaction");

    expect(ios).toContain("mobile-mcp");
    expect(ios).toContain("WebDriverAgent");
    expect(ios).toContain("preferred path");
    expect(ios).toContain("fallback path");
  });

  it("keeps runtime testing metadata aligned with the canonical web and mobile testing surfaces", () => {
    const workflow = readSkill("foundry/modules/workflows/test/workflow.md");
    const androidModule = readSkill("foundry/modules/android-emulator-testing/module.yaml");
    const iosModule = readSkill("foundry/modules/ios-simulator-testing/module.yaml");
    const webModule = readSkill("foundry/modules/web-testing/module.yaml");

    expect(workflow).toContain("primarySkills:");
    expect(workflow).toContain("  - unit-testing");
    expect(workflow).toContain("  - integration-testing");
    expect(workflow).toContain("Route browser QA to `web-testing`.");
    expect(workflow).toContain("Route Android emulator work to `android-emulator-testing`.");
    expect(workflow).toContain("Route iOS simulator work to `ios-simulator-testing`.");

    expect(androidModule).toContain("Canonical dual-path skill");
    expect(androidModule).toContain("mobile-mcp as the preferred path");
    expect(androidModule).toContain("routeHints:");
    expect(androidModule).toContain("  - mobile testing");

    expect(iosModule).toContain("Canonical dual-path skill");
    expect(iosModule).toContain("mobile-mcp as the preferred path");
    expect(iosModule).toContain("routeHints:");
    expect(iosModule).toContain("  - mobile testing");

    expect(webModule).toContain("routeHints:");
    expect(webModule).toContain("  - web");
    expect(webModule).toContain("  - browser");
    expect(webModule).toContain("    - web");
  });
});
