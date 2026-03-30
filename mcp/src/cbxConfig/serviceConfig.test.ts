import { describe, expect, it } from "vitest";
import {
  parseMobileState,
  parsePostmanState,
  parseStitchState,
} from "./serviceConfig.js";

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

  it("normalizes mobile profile arrays", () => {
    const state = parseMobileState({
      mobile: {
        mcpUrl: "https://mobile.example.com/mcp",
        activeProfileName: "team-a",
        profiles: [
          {
            name: "team-a",
            url: "https://team-a.mobile.example.com/mcp",
            command: "npx",
            args: ["-y", "@mobilenext/mobile-mcp@latest"],
          },
        ],
      },
    });

    expect(state.activeProfileName).toBe("team-a");
    expect(state.mcpUrl).toBe("https://mobile.example.com/mcp");
    expect(state.activeProfile?.url).toBe(
      "https://team-a.mobile.example.com/mcp",
    );
    expect(state.activeProfile?.command).toBe("npx");
    expect(state.activeProfile?.args).toEqual([
      "-y",
      "@mobilenext/mobile-mcp@latest",
    ]);
  });

  it("treats an empty mobile config as disabled", () => {
    const state = parseMobileState({
      mobile: {},
    });

    expect(state.enabled).toBe(false);
    expect(state.mcpUrl).toBeNull();
    expect(state.activeProfileName).toBeNull();
    expect(state.activeProfile).toBeNull();
    expect(state.profiles).toEqual([]);
  });

  it("enables mobile when top-level args are provided", () => {
    const state = parseMobileState({
      mobile: {
        args: ["-y", "@mobilenext/mobile-mcp@latest", "--profile", "ios"],
      },
    });

    expect(state.enabled).toBe(true);
    expect(state.activeProfileName).toBe("default");
    expect(state.activeProfile?.command).toBe("npx");
    expect(state.activeProfile?.args).toEqual([
      "-y",
      "@mobilenext/mobile-mcp@latest",
      "--profile",
      "ios",
    ]);
  });
});
