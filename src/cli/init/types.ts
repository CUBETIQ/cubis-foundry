export type InitScope = "project" | "global";
export type InitSkillProfile = "core" | "web-backend" | "full";
export type InitMcpId = "cubis-foundry" | "postman" | "stitch";
export type InitPostmanMode = "full" | "minimal";
export type InitPlatformId = "codex" | "antigravity" | "copilot" | "claude";
export type InitMcpRuntime = "local" | "docker";

export interface InitWizardSelections {
  bundleId: string;
  platforms: InitPlatformId[];
  skillProfile: InitSkillProfile;
  skillsScope: InitScope;
  mcpScope: InitScope;
  mcpRuntime: InitMcpRuntime;
  mcpBuildLocal: boolean;
  selectedMcps: InitMcpId[];
  postmanMode: InitPostmanMode;
  postmanWorkspaceId: string | null;
  postmanApiKey: string | null;
  stitchApiKey: string | null;
}

export interface InitExecutionPlanItem {
  platform: InitPlatformId;
  installOptions: Record<string, unknown>;
  warnings: string[];
}

export interface InitExecutionPlan {
  items: InitExecutionPlanItem[];
}

export interface PerPlatformInitResult {
  platform: InitPlatformId;
  status: "success" | "failed";
  warnings: string[];
  error?: string;
}

export interface InitWarnings {
  global: string[];
  perPlatform: Record<string, string[]>;
}
