import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { packageRoot } from "./pathing.js";

describe("package files", () => {
  it("ships foundry skill catalogs and modules required by packaged installs", () => {
    const packageJson = JSON.parse(
      readFileSync(join(packageRoot(), "package.json"), "utf8"),
    );
    const files = Array.isArray(packageJson.files) ? packageJson.files : [];

    expect(files).toContain("foundry/catalogs");
    expect(files).toContain("foundry/modules");
  });
});
