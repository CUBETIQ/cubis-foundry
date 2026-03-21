import { describe, expect, it } from "vitest";
import {
  applyStitchDefaultArguments,
  buildPassthroughAliasName,
  buildUpstreamToolInfo,
  findMatchingStitchProject,
  getUpstreamRequestOptions,
  resolveStitchToken,
} from "./passthrough.js";

describe("upstream passthrough aliasing", () => {
  it("builds deterministic underscore aliases for postman tools", () => {
    expect(buildPassthroughAliasName("postman", "runCollection")).toBe(
      "postman_run_collection",
    );
    expect(buildPassthroughAliasName("postman", "get-workspaces")).toBe(
      "postman_get_workspaces",
    );
  });

  it("maps upstream tools to namespaced + alias registrations", () => {
    const info = buildUpstreamToolInfo("stitch", {
      name: "list_tools",
      description: "List available tools",
    });

    expect(info).toMatchObject({
      name: "list_tools",
      namespacedName: "stitch.list_tools",
      aliasNames: ["stitch_list_tools"],
      description: "List available tools",
    });
  });

  it("defaults stitch generation and edit tools to Gemini 3.1 Pro", () => {
    expect(
      applyStitchDefaultArguments("generate_screen_from_text", {
        projectId: "123",
        prompt: "Build a mobile dashboard",
      }),
    ).toMatchObject({
      projectId: "123",
      prompt: "Build a mobile dashboard",
      modelId: "GEMINI_3_1_PRO",
    });

    expect(
      applyStitchDefaultArguments("edit_screens", {
        projectId: "123",
        selectedScreenIds: ["abc"],
        prompt: "Refine spacing",
      }),
    ).toMatchObject({
      modelId: "GEMINI_3_1_PRO",
    });
  });

  it("preserves explicit stitch model choices", () => {
    expect(
      applyStitchDefaultArguments("generate_screen_from_text", {
        projectId: "123",
        prompt: "Fast draft",
        modelId: "GEMINI_3_FLASH",
      }),
    ).toMatchObject({
      modelId: "GEMINI_3_FLASH",
    });
  });

  it("uses longer request timeouts for long-running stitch tools", () => {
    expect(getUpstreamRequestOptions("stitch", "generate_screen_from_text")).toMatchObject({
      timeout: 480000,
      maxTotalTimeout: 480000,
      resetTimeoutOnProgress: true,
    });
    expect(getUpstreamRequestOptions("stitch", "list_projects")).toBeUndefined();
    expect(getUpstreamRequestOptions("postman", "run_collection")).toBeUndefined();
  });

  it("falls back across stitch env var aliases", () => {
    expect(
      resolveStitchToken("STITCH_API_KEY_PROD", {
        STITCH_API_KEY_DEFAULT: "default-token",
      } as NodeJS.ProcessEnv),
    ).toEqual({
      envVar: "STITCH_API_KEY_DEFAULT",
      token: "default-token",
    });

    expect(
      resolveStitchToken("STITCH_API_KEY_PROD", {
        STITCH_API_KEY: "legacy-token",
      } as NodeJS.ProcessEnv),
    ).toEqual({
      envVar: "STITCH_API_KEY",
      token: "legacy-token",
    });
  });

  it("reuses an existing stitch project on exact title match", () => {
    expect(
      findMatchingStitchProject(
        [
          { name: "projects/1", title: "Mobile Habit App" },
          { name: "projects/2", title: "Marketing Site" },
        ],
        "mobile habit app",
      ),
    ).toEqual({
      name: "projects/1",
      title: "Mobile Habit App",
    });
  });
});
