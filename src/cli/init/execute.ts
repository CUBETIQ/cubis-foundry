import type {
  InitExecutionPlan,
  InitExecutionPlanItem,
  InitMcpId,
  InitWizardSelections,
} from "./types.js";

function hasMcpSelection(selectedMcps: InitMcpId[], mcpId: InitMcpId) {
  return selectedMcps.includes(mcpId);
}

export function buildInitExecutionPlan({
  selections,
  dryRun,
  target,
}: {
  selections: InitWizardSelections;
  dryRun: boolean;
  target?: string;
}): InitExecutionPlan {
  const planItems: InitExecutionPlanItem[] = [];
  const wantsPostman = hasMcpSelection(selections.selectedMcps, "postman");
  const wantsStitch = hasMcpSelection(selections.selectedMcps, "stitch");
  const wantsFoundry = hasMcpSelection(selections.selectedMcps, "cubis-foundry");

  for (const platform of selections.platforms) {
    const stitchSupported = platform === "antigravity";
    const stitchEnabled = wantsStitch && stitchSupported;
    const warnings: string[] = [];
    if (wantsStitch && !stitchSupported) {
      warnings.push(
        `Stitch is not supported on '${platform}'. It will be skipped for this platform.`,
      );
    }

    const installOptions: Record<string, unknown> = {
      platform,
      scope: selections.skillsScope,
      bundle: selections.bundleId,
      skillProfile: selections.skillProfile,
      allSkills: selections.skillProfile === "full",
      dryRun,
      yes: true,
      target,
      postman: wantsPostman,
      stitch: stitchEnabled,
      stitchDefaultForAntigravity: false,
      mcpScope: selections.mcpScope,
      foundryMcp: wantsFoundry,
      mcpToolSync: wantsPostman || stitchEnabled,
      mcpRuntime: wantsPostman || stitchEnabled ? selections.mcpRuntime : "local",
      mcpFallback: "local",
      mcpBuildLocal:
        wantsPostman || stitchEnabled ? selections.mcpBuildLocal : false,
      postmanMode: wantsPostman ? selections.postmanMode : undefined,
      postmanWorkspaceId: wantsPostman
        ? selections.postmanWorkspaceId
        : undefined,
      initWizardMode: true,
    };

    planItems.push({
      platform,
      installOptions,
      warnings,
    });
  }

  return {
    items: planItems,
  };
}

export function formatInitSummary(selections: InitWizardSelections) {
  const postmanSelected = selections.selectedMcps.includes("postman");
  return [
    "Init plan summary:",
    `- Bundle: ${selections.bundleId}`,
    `- Platforms: ${selections.platforms.join(", ")}`,
    `- Skill profile: ${selections.skillProfile}`,
    `- Skills scope: ${selections.skillsScope}`,
    `- MCP scope: ${selections.mcpScope}`,
    `- MCP runtime: ${selections.mcpRuntime}${selections.mcpRuntime === "docker" ? selections.mcpBuildLocal ? " (build local image)" : " (pull image)" : ""}`,
    `- MCP selections: ${selections.selectedMcps.length > 0 ? selections.selectedMcps.join(", ") : "(none)"}`,
    `- Postman mode: ${postmanSelected ? selections.postmanMode : "(not selected)"}`,
    `- Postman workspace: ${postmanSelected ? selections.postmanWorkspaceId === null ? "null" : selections.postmanWorkspaceId : "(not selected)"}`,
  ].join("\n");
}
