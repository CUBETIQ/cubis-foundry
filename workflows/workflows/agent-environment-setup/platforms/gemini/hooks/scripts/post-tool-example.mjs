#!/usr/bin/env node

const output = process.argv.slice(2).join(" ").trim();

if (/password|secret|api[_-]?key/i.test(output)) {
  console.error("Possible secret-like output detected. Review before sharing.");
  process.exit(1);
}

process.stdout.write("post-tool hook passed\n");
