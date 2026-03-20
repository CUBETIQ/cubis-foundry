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
  overwrite,
  target,
}: {
  selections: InitWizardSelections;
  dryRun: boolean;
  overwrite: boolean;
  target?: string;
}): InitExecutionPlan {
  const planItems: InitExecutionPlanItem[] = [];
  const wantsPostman = hasMcpSelection(selections.selectedMcps, "postman");
  const wantsStitch = hasMcpSelection(selections.selectedMcps, "stitch");
  const wantsFoundry = hasMcpSelection(
    selections.selectedMcps,
    "cubis-foundry",
  );
  const wantsPlaywright = hasMcpSelection(
    selections.selectedMcps,
    "playwright",
  );
  const wantsAndroid = hasMcpSelection(selections.selectedMcps, "android");

  for (const platform of selections.platforms) {
    const stitchEnabled = wantsStitch;
    const hasAnyMcp =
      wantsPostman ||
      stitchEnabled ||
      wantsFoundry ||
      wantsPlaywright ||
      wantsAndroid;
    const warnings: string[] = [];

    const installOptions: Record<string, unknown> = {
      platform,
      scope: selections.skillsScope,
      bundle: selections.bundleId,
      skillProfile: selections.skillProfile,
      allSkills: selections.skillProfile === "full",
      dryRun,
      overwrite,
      yes: true,
      target,
      postman: wantsPostman,
      stitch: stitchEnabled,
      playwright: wantsPlaywright,
      android: wantsAndroid,
      stitchDefaultForAntigravity: false,
      mcpScope: selections.mcpScope,
      mcpToolSync: wantsPostman || stitchEnabled,
      mcpRuntime: hasAnyMcp ? selections.mcpRuntime : "local",
      mcpFallback: "local",
      mcpBuildLocal: hasAnyMcp ? selections.mcpBuildLocal : false,
      postmanMode: wantsPostman ? selections.postmanMode : undefined,
      postmanWorkspaceId: wantsPostman
        ? selections.postmanWorkspaceId
        : undefined,
      initWizardMode: true,
    };
    if (wantsFoundry) {
      installOptions.foundryMcp = true;
    }

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
    `- MCP runtime: ${selections.mcpRuntime}${selections.mcpRuntime === "docker" ? (selections.mcpBuildLocal ? " (build local image)" : " (pull image)") : ""}`,
    `- MCP selections: ${selections.selectedMcps.length > 0 ? selections.selectedMcps.join(", ") : "(none)"}`,
    `- Postman mode: ${postmanSelected ? selections.postmanMode : "(not selected)"}`,
    `- Postman workspace: ${postmanSelected ? (selections.postmanWorkspaceId === null ? "null" : selections.postmanWorkspaceId) : "(not selected)"}`,
  ].join("\n");
}
