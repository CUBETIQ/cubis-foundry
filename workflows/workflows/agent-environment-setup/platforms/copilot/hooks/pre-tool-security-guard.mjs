#!/usr/bin/env node

const buffers = [];
for await (const chunk of process.stdin) buffers.push(chunk);
const raw = Buffer.concat(buffers).toString("utf8");
let parsed = {};
try {
  parsed = JSON.parse(raw || "{}");
} catch {
  parsed = {};
}

const toolName = String(parsed.toolName || "");
let toolArgs = parsed.toolArgs;
if (typeof toolArgs === 'string') {
  try {
    toolArgs = JSON.parse(toolArgs);
  } catch {
    toolArgs = {};
  }
}
if (!toolArgs || typeof toolArgs !== 'object') toolArgs = {};

const command = String(toolArgs.command || toolArgs.cmd || toolArgs.commandLine || '');
const shellLikeTool = /^(bash|shell|run_shell_command)$/i.test(toolName) || command.length > 0;
if (!shellLikeTool) {
  process.stdout.write("{}");
  process.exit(0);
}

const deniedPatterns = [
  {
    reason: "destructive filesystem wipe",
    test: /(\brm\s+-rf\s+\/\b|\brm\s+-rf\s+~\/|\bsudo\s+rm\s+-rf\b)/i,
  },
  {
    reason: "destructive git reset",
    test: /\bgit\s+reset\s+--hard\b/i,
  },
  {
    reason: "history-rewriting checkout",
    test: /\bgit\s+checkout\s+--\b/i,
  },
  {
    reason: "remote pipe-to-shell execution",
    test: /\b(curl|wget)\b[^\n|]*\|\s*(sh|bash|zsh)\b/i,
  },
];

const match = deniedPatterns.find((entry) => entry.test.test(command));
if (!match) {
  process.stdout.write("{}");
  process.exit(0);
}

process.stdout.write(
  JSON.stringify({
    permissionDecision: "deny",
    permissionDecisionReason: `Security policy: blocked ${match.reason}.`,
  }),
);