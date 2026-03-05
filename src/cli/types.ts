import type { Command } from "commander";

export type AnyOptions = Record<string, unknown>;

export type WorkflowAction = (options: AnyOptions) => Promise<void> | void;
export type WorkflowTargetAction = (
  target: string,
  options: AnyOptions,
) => Promise<void> | void;
export type WorkflowDoctorAction = (
  platform: string | undefined,
  options: AnyOptions,
) => Promise<void> | void;

export type CommandDecorator = (command: Command) => Command;
