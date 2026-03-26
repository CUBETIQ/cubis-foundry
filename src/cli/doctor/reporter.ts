import type { DoctorReport } from "./types.js";

export function formatDoctorReport(report: DoctorReport): string {
  const lines: string[] = [];
  lines.push(`Platform: ${report.platform}`);
  lines.push(`Scope: ${report.scope}`);
  lines.push("");
  lines.push("Rule file:");
  lines.push(`- Active: ${report.ruleFileStatus.active || "(missing)"}`);
  lines.push(`- Preferred: ${report.ruleFileStatus.preferred || "(missing)"}`);
  lines.push("");
  lines.push("Paths:");
  lines.push(
    `- Workflows: ${report.paths.workflows.path} : ${report.paths.workflows.exists ? "exists" : "missing"}`,
  );
  if (report.paths.agents.enabled === false) {
    lines.push(`- Agents: ${report.paths.agents.path} : disabled`);
  } else {
    lines.push(
      `- Agents: ${report.paths.agents.path} : ${report.paths.agents.exists ? "exists" : "missing"}`,
    );
  }
  lines.push(
    `- Skills: ${report.paths.skills.path} : ${report.paths.skills.exists ? "exists" : "missing"}`,
  );
  if (report.paths.commands.enabled === false) {
    lines.push("- Commands: (disabled)");
  } else {
    lines.push(
      `- Commands: ${report.paths.commands.path} : ${report.paths.commands.exists ? "exists" : "missing"}`,
    );
  }
  if (report.paths.prompts.enabled === false) {
    lines.push("- Prompts: (disabled)");
  } else {
    lines.push(
      `- Prompts: ${report.paths.prompts.path} : ${report.paths.prompts.exists ? "exists" : "missing"}`,
    );
  }
  lines.push("");
  lines.push("Managed block:");
  lines.push(`- Status: ${report.managedBlockStatus}`);
  lines.push(
    `- Markers: start=${report.managedBlockCounts.starts}, end=${report.managedBlockCounts.ends}`,
  );

  if (report.terminalIntegration) {
    lines.push("");
    lines.push("Terminal integration:");
    lines.push(`- Path: ${report.terminalIntegration.path}`);
    lines.push(`- Exists: ${report.terminalIntegration.exists ? "yes" : "no"}`);
    lines.push(`- Config: ${report.terminalIntegration.configPath}`);
    lines.push(
      `- Config present: ${report.terminalIntegration.configExists ? "yes" : "no"}`,
    );
    lines.push(`- Provider: ${report.terminalIntegration.provider || "(unknown)"}`);
    lines.push(`- Rule block status: ${report.terminalIntegration.ruleBlockStatus}`);
  }

  if (report.warnings.length > 0) {
    lines.push("");
    lines.push("Warnings:");
    for (const warning of report.warnings) {
      lines.push(`- ${warning}`);
    }
  }

  lines.push("");
  lines.push("Recommendations:");
  if (report.recommendations.length === 0) {
    lines.push("- No issues detected.");
  } else {
    for (const recommendation of report.recommendations) {
      lines.push(`- ${recommendation}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

export function printDoctorReport(report: DoctorReport): void {
  process.stdout.write(formatDoctorReport(report));
}
