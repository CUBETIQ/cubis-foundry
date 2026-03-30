import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const connectMock = vi.fn();
const listToolsMock = vi.fn().mockResolvedValue({ tools: [] });
const callToolMock = vi.fn().mockResolvedValue({ content: [] });
const closeMock = vi.fn().mockResolvedValue(undefined);
const stdioCtorMock = vi.fn();
const httpCtorMock = vi.fn();

vi.mock("@modelcontextprotocol/sdk/client/index.js", () => ({
  Client: class MockClient {
    async connect(transport: unknown) {
      return connectMock(transport);
    }
    async listTools() {
      return listToolsMock();
    }
    async callTool(args: unknown) {
      return callToolMock(args);
    }
    async close() {
      return closeMock();
    }
  },
}));

vi.mock("@modelcontextprotocol/sdk/client/stdio.js", () => ({
  StdioClientTransport: class MockStdioClientTransport {
    constructor(options: unknown) {
      stdioCtorMock(options);
    }
  },
}));

vi.mock("@modelcontextprotocol/sdk/client/streamableHttp.js", () => ({
  StreamableHTTPClientTransport: class MockStreamableHttpClientTransport {
    constructor(url: unknown, options: unknown) {
      httpCtorMock(url, options);
    }
  },
}));

describe("SdkUpstreamClientFactory", () => {
  const originalPath = process.env.PATH;

  beforeEach(() => {
    connectMock.mockClear();
    listToolsMock.mockClear();
    callToolMock.mockClear();
    closeMock.mockClear();
    stdioCtorMock.mockClear();
    httpCtorMock.mockClear();
    process.env.PATH = "/tmp/test-path";
  });

  afterEach(() => {
    if (originalPath === undefined) {
      delete process.env.PATH;
    } else {
      process.env.PATH = originalPath;
    }
  });

  it("inherits the parent environment for stdio upstream providers", async () => {
    const { SdkUpstreamClientFactory } = await import("./upstreamClient.js");
    const factory = new SdkUpstreamClientFactory();

    await factory.connect({
      transport: "stdio",
      command: "npx",
      args: ["-y", "@mobilenext/mobile-mcp@latest"],
    });

    expect(stdioCtorMock).toHaveBeenCalledTimes(1);
    const [options] = stdioCtorMock.mock.calls[0]!;
    expect(options).toMatchObject({
      command: "npx",
      args: ["-y", "@mobilenext/mobile-mcp@latest"],
      cwd: process.cwd(),
      stderr: "pipe",
    });
    expect(options.env.PATH).toBe("/tmp/test-path");
  });

  it("merges custom env overrides over the parent environment", async () => {
    const { SdkUpstreamClientFactory } = await import("./upstreamClient.js");
    const factory = new SdkUpstreamClientFactory();

    await factory.connect({
      transport: "stdio",
      command: "npx",
      args: ["-y", "@mobilenext/mobile-mcp@latest"],
      env: {
        PATH: "/custom/path",
        MOBILE_MCP_PROFILE: "ios",
      },
    });

    const [options] = stdioCtorMock.mock.calls[0]!;
    expect(options.env.PATH).toBe("/custom/path");
    expect(options.env.MOBILE_MCP_PROFILE).toBe("ios");
  });
});
