import type { Command } from "commander";
import type { WorkflowDoctorAction } from "../types.js";

export interface DoctorCommandDeps {
  runDoctor: WorkflowDoctorAction;
}

export function registerDoctorCommands(
  program: Command,
  deps: DoctorCommandDeps,
): void {
  program
    .command("doctor [platform]")
    .description("Produce a health report for installed workflow assets")
    .option("--scope <scope>", "target scope: project|global", "project")
    .option("--json", "output JSON")
    .action(deps.runDoctor);
}
