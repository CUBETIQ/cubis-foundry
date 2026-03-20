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

const toolName = String(parsed.tool_name || "");
if (toolName !== "run_shell_command") {
  process.stdout.write(JSON.stringify({ decision: "allow" }));
  process.exit(0);
}

const toolInput = parsed.tool_input && typeof parsed.tool_input === 'object' ? parsed.tool_input : {};
const command = String(toolInput.command || toolInput.cmd || toolInput.commandLine || '');
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
  process.stdout.write(JSON.stringify({ decision: "allow" }));
  process.exit(0);
}

process.stdout.write(
  JSON.stringify({
    decision: "deny",
    reason: `Security policy: blocked ${match.reason}.`,
    systemMessage: "Preflight security guard blocked a destructive shell command.",
  }),
);