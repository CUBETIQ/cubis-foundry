import path from "node:path";
import { z } from "zod";
import type { ToolRuntimeContext } from "./registry.js";
import {
  callUpstreamTool,
  findMatchingStitchProject,
} from "../upstream/passthrough.js";
import {
  createExecutionTrace,
  finishExecutionTrace,
  persistExecutionTrace,
} from "../runtime/executionTrace.js";
import { inspectDesignState } from "../runtime/designState.js";

const stitchExecuteModeSchema = z.enum(["auto", "generate", "edit", "variants"]);

interface StitchProjectSummary {
  name?: string;
  title?: string;
}

interface StitchScreenSummary {
  name?: string;
  title?: string;
}

interface ParsedToolResult {
  raw: Record<string, unknown> | null;
  text: string | null;
}

export const stitchExecuteName = "stitch_execute";

export const stitchExecuteDescription =
  "Run a guarded Stitch execution flow with design gating, project reuse, screen reuse, timeout recovery, and persisted execution traces.";

export const stitchExecuteSchema = z.object({
  mode: stitchExecuteModeSchema.default("auto"),
  prompt: z.string().min(1).describe("Design-ready Stitch prompt or edit brief."),
  projectTitle: z.string().optional(),
  projectId: z.string().optional(),
  screenTitle: z.string().optional(),
  scope: z
    .enum(["auto", "global", "project"])
    .optional()
    .describe("Config scope to read. Default: auto."),
});

function textResult(data: Record<string, unknown>) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

function parseCallToolTextResult(
  result: Awaited<ReturnType<typeof callUpstreamTool>>,
): ParsedToolResult {
  const text =
    result.content.find((item) => item.type === "text")?.text?.trim() || null;
  if (!text) {
    return { raw: null, text: null };
  }
  try {
    return { raw: JSON.parse(text) as Record<string, unknown>, text };
  } catch {
    return { raw: null, text };
  }
}

function parseProjects(result: Awaited<ReturnType<typeof callUpstreamTool>>): StitchProjectSummary[] {
  const parsed = parseCallToolTextResult(result);
  const projects = parsed.raw?.projects;
  return Array.isArray(projects) ? (projects as StitchProjectSummary[]) : [];
}

function parseScreens(result: Awaited<ReturnType<typeof callUpstreamTool>>): StitchScreenSummary[] {
  const parsed = parseCallToolTextResult(result);
  const screens = parsed.raw?.screens;
  return Array.isArray(screens) ? (screens as StitchScreenSummary[]) : [];
}

function findMatchingScreen(
  screens: StitchScreenSummary[],
  title: string,
): StitchScreenSummary | null {
  const normalized = title.trim().toLowerCase();
  if (!normalized) return null;
  return (
    screens.find((screen) => {
      const candidates = [screen.title, screen.name]
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim().toLowerCase());
      return candidates.includes(normalized);
    }) || null
  );
}

async function ensureProjectId({
  projectId,
  projectTitle,
  scope,
  trace,
}: {
  projectId?: string;
  projectTitle?: string;
  scope: "auto" | "global" | "project";
  trace: ReturnType<typeof createExecutionTrace>;
}): Promise<{ projectId: string; reusedProject: boolean }> {
  if (projectId?.trim()) {
    return { projectId: projectId.trim(), reusedProject: true };
  }

  const title = projectTitle?.trim();
  if (!title) {
    throw new Error("stitch_execute requires projectId or projectTitle.");
  }

  trace.toolCalls.push({
    name: "stitch.list_projects",
    phase: "preflight",
    outcome: "planned",
    arguments: {},
  });
  const projectsResult = await callUpstreamTool({
    service: "stitch",
    name: "list_projects",
    argumentsValue: {},
    scope,
  });
  trace.toolCalls[trace.toolCalls.length - 1].outcome = "success";
  const existingProject = findMatchingStitchProject(parseProjects(projectsResult), title);
  if (existingProject?.name) {
    return { projectId: existingProject.name, reusedProject: true };
  }

  trace.toolCalls.push({
    name: "stitch.create_project",
    phase: "execute",
    outcome: "planned",
    arguments: { title },
  });
  const createdResult = await callUpstreamTool({
    service: "stitch",
    name: "create_project",
    argumentsValue: { title },
    scope,
  });
  const parsed = parseCallToolTextResult(createdResult);
  trace.toolCalls[trace.toolCalls.length - 1].outcome = "success";
  const createdProjectId =
    typeof parsed.raw?.name === "string" && parsed.raw.name.trim()
      ? parsed.raw.name.trim()
      : "";
  if (!createdProjectId) {
    throw new Error("Stitch create_project did not return a project identifier.");
  }
  return { projectId: createdProjectId, reusedProject: false };
}

async function listProjectScreens({
  projectId,
  scope,
  trace,
}: {
  projectId: string;
  scope: "auto" | "global" | "project";
  trace: ReturnType<typeof createExecutionTrace>;
}): Promise<StitchScreenSummary[]> {
  trace.toolCalls.push({
    name: "stitch.list_screens",
    phase: "preflight",
    outcome: "planned",
    arguments: { projectId },
  });
  const screensResult = await callUpstreamTool({
    service: "stitch",
    name: "list_screens",
    argumentsValue: { projectId },
    scope,
  });
  trace.toolCalls[trace.toolCalls.length - 1].outcome = "success";
  return parseScreens(screensResult);
}

export function createStitchExecuteHandler(ctx: ToolRuntimeContext) {
  return async function handleStitchExecute(
    args: z.infer<typeof stitchExecuteSchema>,
  ) {
    const scope = args.scope ?? "auto";
    const trace = createExecutionTrace(stitchExecuteName, {
      mode: args.mode,
      prompt: args.prompt,
      projectTitle: args.projectTitle ?? null,
      projectId: args.projectId ?? null,
      screenTitle: args.screenTitle ?? null,
      scope,
    });
    trace.selectedSkills.push("stitch-design-orchestrator");
    trace.selectedReferences.push(
      "workflows/skills/stitch-design-orchestrator/references/tool-selection.md",
      "workflows/skills/stitch-design-orchestrator/references/anti-abuse.md",
    );

    const gatewayStatus = ctx.gatewayManager.getStatus();
    const stitchEnabledTools = ctx.gatewayManager.listEnabledTools("stitch");
    trace.gates.push({
      name: "gateway_initialized",
      passed: Boolean(gatewayStatus.providers.stitch),
      detail: gatewayStatus.providers.stitch?.lastError ?? "Gateway loaded.",
    });
    trace.gates.push({
      name: "stitch_enabled_tools",
      passed: Boolean(stitchEnabledTools.available),
      detail:
        stitchEnabledTools.available
          ? `Enabled tools: ${stitchEnabledTools.enabledCount}`
          : String(stitchEnabledTools.lastError || "Stitch upstream unavailable."),
    });

    const designState = await inspectDesignState(process.cwd());
    trace.selectedReferences.push(...designState.referencePaths.map((filePath) => path.relative(process.cwd(), filePath)));
    trace.gates.push({
      name: "design_state_ready",
      passed: designState.ready,
      detail: designState.detail,
      action: designState.ready
        ? undefined
        : "Run the design route first and create docs/foundation/DESIGN.md or design overlay docs before Stitch generation.",
    });

    if (!designState.ready) {
      const blockedResult = {
        status: "blocked",
        recoveredAfterTimeout: false,
        projectId: args.projectId ?? null,
        reusedProject: false,
        reusedScreen: false,
        artifactSummary: {
          designReferences: designState.referencePaths.map((filePath) =>
            path.relative(process.cwd(), filePath),
          ),
        },
        nextSuggestedAction:
          "Run the design route first, then rerun stitch_execute once design artifacts exist.",
      };
      const tracePath = await persistExecutionTrace(
        finishExecutionTrace(trace, blockedResult),
      );
      return textResult({ ...blockedResult, tracePath });
    }

    try {
      const resolvedProject = await ensureProjectId({
        projectId: args.projectId,
        projectTitle: args.projectTitle,
        scope,
        trace,
      });
      const screens = await listProjectScreens({
        projectId: resolvedProject.projectId,
        scope,
        trace,
      });
      const matchedScreen = args.screenTitle
        ? findMatchingScreen(screens, args.screenTitle)
        : null;
      const effectiveMode =
        args.mode === "auto"
          ? matchedScreen
            ? "edit"
            : "generate"
          : args.mode;

      let toolName = "generate_screen_from_text";
      let toolArgs: Record<string, unknown> = {
        projectId: resolvedProject.projectId,
        prompt: args.prompt,
      };

      if (effectiveMode === "edit") {
        if (!matchedScreen?.name) {
          throw new Error(
            "stitch_execute mode=edit requires an existing screen title in the target project.",
          );
        }
        toolName = "edit_screens";
        toolArgs = {
          projectId: resolvedProject.projectId,
          selectedScreenIds: [matchedScreen.name],
          prompt: args.prompt,
        };
      } else if (effectiveMode === "variants") {
        if (!matchedScreen?.name) {
          throw new Error(
            "stitch_execute mode=variants requires an existing screen title in the target project.",
          );
        }
        toolName = "generate_variants";
        toolArgs = {
          projectId: resolvedProject.projectId,
          selectedScreenIds: [matchedScreen.name],
          prompt: args.prompt,
        };
      } else if (args.screenTitle?.trim()) {
        toolArgs.title = args.screenTitle.trim();
      }

      trace.toolCalls.push({
        name: `stitch.${toolName}`,
        phase: "execute",
        outcome: "planned",
        arguments: toolArgs,
      });
      const mutationResult = await callUpstreamTool({
        service: "stitch",
        name: toolName,
        argumentsValue: toolArgs,
        scope,
      });
      const parsedMutationResult = parseCallToolTextResult(mutationResult);
      const recoveredAfterTimeout = Boolean(
        parsedMutationResult.raw?.recoveredAfterTimeout,
      );
      trace.toolCalls[trace.toolCalls.length - 1].outcome = "success";
      trace.toolCalls[trace.toolCalls.length - 1].detail = recoveredAfterTimeout
        ? "Recovered after upstream timeout."
        : "Mutation completed.";

      const result = {
        status: recoveredAfterTimeout
          ? "recovered_after_timeout"
          : "success",
        projectId: resolvedProject.projectId,
        reusedProject: resolvedProject.reusedProject,
        reusedScreen: Boolean(matchedScreen),
        recoveredAfterTimeout,
        artifactSummary: {
          designReferences: designState.referencePaths.map((filePath) =>
            path.relative(process.cwd(), filePath),
          ),
          existingScreens: screens
            .map((screen) => screen.title || screen.name)
            .filter(Boolean),
          selectedScreen: matchedScreen?.title || matchedScreen?.name || null,
        },
        nextSuggestedAction:
          effectiveMode === "generate"
            ? "Use stitch_execute mode=edit for refinements once the new screen is visible."
            : "Inspect the updated screen set and continue with targeted edits if needed.",
        mutation: parsedMutationResult.raw ?? parsedMutationResult.text,
      };

      const tracePath = await persistExecutionTrace(
        finishExecutionTrace(trace, result),
      );
      return textResult({ ...result, tracePath });
    } catch (error) {
      trace.errors.push({ message: String(error) });
      const failedResult = {
        status: "failed",
        recoveredAfterTimeout: false,
        projectId: args.projectId ?? null,
        reusedProject: false,
        reusedScreen: false,
        artifactSummary: {
          designReferences: designState.referencePaths.map((filePath) =>
            path.relative(process.cwd(), filePath),
          ),
        },
        error: String(error),
      };
      const tracePath = await persistExecutionTrace(
        finishExecutionTrace(trace, failedResult),
      );
      return textResult({ ...failedResult, tracePath });
    }
  };
}

export const handleStitchExecute = createStitchExecuteHandler;
