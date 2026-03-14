import { checkbox, confirm, password, select } from "@inquirer/prompts";
import type {
  InitMcpId,
  InitMcpRuntime,
  InitPlatformId,
  InitPostmanMode,
  InitSkillProfile,
} from "./types.js";

export async function promptInitBundle({
  bundleIds,
  defaultBundle,
}: {
  bundleIds: string[];
  defaultBundle: string;
}) {
  return select({
    message: "Select workflow bundle:",
    default: defaultBundle,
    choices: bundleIds.map((bundleId) => ({
      name: bundleId,
      value: bundleId,
    })),
  });
}

export async function promptInitPlatforms({
  defaultPlatforms,
}: {
  defaultPlatforms: InitPlatformId[];
}) {
  return checkbox<InitPlatformId>({
    message: "Select target platform(s):",
    required: true,
    choices: [
      {
        name: "Codex",
        value: "codex",
        checked: defaultPlatforms.includes("codex"),
      },
      {
        name: "Antigravity",
        value: "antigravity",
        checked: defaultPlatforms.includes("antigravity"),
      },
      {
        name: "GitHub Copilot",
        value: "copilot",
        checked: defaultPlatforms.includes("copilot"),
      },
      {
        name: "Claude Code",
        value: "claude",
        checked: defaultPlatforms.includes("claude"),
      },
      {
        name: "Gemini CLI",
        value: "gemini",
        checked: defaultPlatforms.includes("gemini"),
      },
    ],
  });
}

export async function promptInitSkillProfile(
  defaultSkillProfile: InitSkillProfile,
) {
  return select<InitSkillProfile>({
    message: "Select skills install profile:",
    default: defaultSkillProfile,
    choices: [
      { name: "core", value: "core" },
      { name: "web-backend", value: "web-backend" },
      { name: "full", value: "full" },
    ],
  });
}

export async function promptInitMcpSelection(defaultMcps: InitMcpId[]) {
  return checkbox<InitMcpId>({
    message: "Select which MCP integrations to configure:",
    choices: [
      {
        name: "Cubis Foundry",
        value: "cubis-foundry",
        checked: defaultMcps.includes("cubis-foundry"),
      },
      {
        name: "Postman",
        value: "postman",
        checked: defaultMcps.includes("postman"),
      },
      {
        name: "Stitch",
        value: "stitch",
        checked: defaultMcps.includes("stitch"),
      },
      {
        name: "Playwright",
        value: "playwright",
        checked: defaultMcps.includes("playwright"),
      },
    ],
  });
}

export async function promptInitPostmanMode(defaultMode: InitPostmanMode) {
  return select<InitPostmanMode>({
    message: "Select Postman installation mode:",
    default: defaultMode,
    choices: [
      { name: "full", value: "full" },
      { name: "minimal", value: "minimal" },
    ],
  });
}

export async function promptInitMcpRuntime({
  defaultRuntime,
  defaultBuildLocal,
}: {
  defaultRuntime: InitMcpRuntime;
  defaultBuildLocal: boolean;
}) {
  const defaultChoice =
    defaultRuntime === "docker"
      ? defaultBuildLocal
        ? "docker-build-local"
        : "docker-pull"
      : "local";

  const choice = await select<"local" | "docker-pull" | "docker-build-local">({
    message: "Select MCP runtime mode:",
    default: defaultChoice,
    choices: [
      {
        name: "Local command server (cbx mcp serve)",
        value: "local",
      },
      {
        name: "Docker runtime (pull image)",
        value: "docker-pull",
      },
      {
        name: "Docker runtime (build image locally)",
        value: "docker-build-local",
      },
    ],
  });

  return {
    mcpRuntime: choice === "local" ? "local" : ("docker" as const),
    mcpBuildLocal: choice === "docker-build-local",
  };
}

export async function promptOptionalSecret(message: string) {
  const value = await password({
    message,
    mask: "*",
  });
  const normalized = String(value || "").trim();
  return normalized || null;
}

export async function promptInitApplyConfirmation(summary: string) {
  return confirm({
    message: `${summary}\n\nApply this installation plan?`,
    default: true,
  });
}
