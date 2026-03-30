#!/usr/bin/env node

const input = process.argv.slice(2).join(" ").trim();

if (/git\s+reset\s+--hard/.test(input) || /rm\s+-rf\s+\//.test(input)) {
  console.error("Blocked destructive command. Ask for explicit confirmation first.");
  process.exit(1);
}

process.stdout.write("pre-tool hook passed\n");
