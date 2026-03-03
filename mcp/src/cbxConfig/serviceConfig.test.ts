import { describe, expect, it } from "vitest";
import { parsePostmanState, parseStitchState } from "./serviceConfig.js";

describe("service config normalization", () => {
  it("normalizes postman profile arrays", () => {
    const state = parsePostmanState({
      postman: {
        mcpUrl: "https://mcp.postman.com/code",
        activeProfileName: "team-a",
        profiles: [
          {
            name: "team-a",
            apiKeyEnvVar: "POSTMAN_API_KEY_TEAM_A",
            workspaceId: "ws_123",
          },
        ],
      },
    });

    expect(state.mcpUrl).toBe("https://mcp.postman.com/code");
    expect(state.activeProfileName).toBe("team-a");
    expect(state.activeProfile?.apiKeyEnvVar).toBe("POSTMAN_API_KEY_TEAM_A");
  });

  it("normalizes legacy stitch profile maps", () => {
    const state = parseStitchState({
      stitch: {
        activeProfileName: "prod",
        profiles: {
          prod: {
            url: "https://stitch.googleapis.com/mcp",
            apiKeyEnvVar: "STITCH_API_KEY_PROD",
          },
        },
      },
    });

    expect(state.activeProfileName).toBe("prod");
    expect(state.activeProfile?.url).toBe("https://stitch.googleapis.com/mcp");
    expect(state.activeProfile?.apiKeyEnvVar).toBe("STITCH_API_KEY_PROD");
  });
});
