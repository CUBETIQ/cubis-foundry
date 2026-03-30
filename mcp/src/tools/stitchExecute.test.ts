import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE_PATH = path.resolve(import.meta.dirname, "stitchExecute.ts");

describe("stitchExecute source", () => {
  it("tracks canonical design skills instead of deleted stitch skill wrappers", () => {
    const source = readFileSync(SOURCE_PATH, "utf8");

    expect(source).toContain('trace.selectedSkills.push(');
    expect(source).toContain('"design"');
    expect(source).toContain('"web-ui-design"');
    expect(source).toContain('"mobile-ui-design"');
    expect(source).not.toContain('"stitch-design-orchestrator"');
    expect(source).not.toContain("workflows/skills/stitch-design-orchestrator");
  });
});
