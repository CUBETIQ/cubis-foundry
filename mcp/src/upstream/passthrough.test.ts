import { describe, expect, it } from "vitest";
import {
  buildPassthroughAliasName,
  buildUpstreamToolInfo,
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
});
