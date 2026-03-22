import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export interface ExecutionGate {
  name: string;
  passed: boolean;
  detail?: string;
  action?: string;
}

export interface ExecutionToolCall {
  name: string;
  phase: "preflight" | "execute" | "recovery";
  arguments?: Record<string, unknown>;
  outcome: "planned" | "success" | "blocked" | "failed";
  detail?: string;
}

export interface ExecutionArtifact {
  kind: string;
  path: string;
  description?: string;
}

export interface ExecutionTrace {
  flow: string;
  inputs: Record<string, unknown>;
  gates: ExecutionGate[];
  selectedSkills: string[];
  selectedReferences: string[];
  toolCalls: ExecutionToolCall[];
  retries: Array<Record<string, unknown>>;
  artifacts: ExecutionArtifact[];
  result: Record<string, unknown> | null;
  errors: Array<Record<string, unknown>>;
  startedAt: string;
  finishedAt: string | null;
}

export function createExecutionTrace(
  flow: string,
  inputs: Record<string, unknown>,
): ExecutionTrace {
  return {
    flow,
    inputs,
    gates: [],
    selectedSkills: [],
    selectedReferences: [],
    toolCalls: [],
    retries: [],
    artifacts: [],
    result: null,
    errors: [],
    startedAt: new Date().toISOString(),
    finishedAt: null,
  };
}

export function finishExecutionTrace(
  trace: ExecutionTrace,
  result: Record<string, unknown>,
): ExecutionTrace {
  trace.result = result;
  trace.finishedAt = new Date().toISOString();
  return trace;
}

export async function persistExecutionTrace(
  trace: ExecutionTrace,
  options?: {
    workspaceRoot?: string;
    timestamp?: Date;
  },
): Promise<string> {
  const workspaceRoot = options?.workspaceRoot ?? process.cwd();
  const now = options?.timestamp ?? new Date();
  const stamp = now.toISOString().replace(/[:.]/g, "-");
  const filename = `${stamp}-${trace.flow}.json`;
  const traceDir = path.join(workspaceRoot, "artifacts", "foundry-traces");
  const tracePath = path.join(traceDir, filename);
  await mkdir(traceDir, { recursive: true });
  await writeFile(tracePath, `${JSON.stringify(trace, null, 2)}\n`, "utf8");
  return tracePath;
}
