import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { compile, compileModule, needsRecompile } from "./index.js";

const REPO_ROOT = resolve(import.meta.dirname, "../../..");

describe("compiler", () => {
  describe("compile()", () => {
    it("compiles for a specific platform", async () => {
      const results = await compile(REPO_ROOT, "claude");
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0]?.platform).toBe("claude");
      expect(results[0]?.assets).toBeInstanceOf(Array);
      expect(results[0]?.durationMs).toBeGreaterThanOrEqual(0);
    });

    it("compiles for all platforms when platform is omitted", async () => {
      const results = await compile(REPO_ROOT);
      expect(results).toBeInstanceOf(Array);
      // The catalog fixture has 5 platforms.
      expect(results.length).toBeGreaterThanOrEqual(1);
      for (const result of results) {
        expect(result.assets).toBeInstanceOf(Array);
        expect(result.durationMs).toBeGreaterThanOrEqual(0);
      }
    });

    it("throws when given an unknown platform", async () => {
      await expect(compile(REPO_ROOT, "unknown-platform")).rejects.toThrow(
        /not found|unknown/i,
      );
    });
  });

  describe("compileModule()", () => {
    it("returns an empty array (not yet implemented)", async () => {
      const results = await compileModule(REPO_ROOT, "rules-core", "claude");
      expect(results).toEqual([]);
    });
  });

  describe("needsRecompile()", () => {
    it("returns an empty array (not yet implemented)", async () => {
      const reasons = await needsRecompile(REPO_ROOT, "claude");
      expect(reasons).toEqual([]);
    });
  });
});
