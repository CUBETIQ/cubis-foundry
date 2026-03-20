#!/usr/bin/env node

const buffers = [];
for await (const chunk of process.stdin) buffers.push(chunk);
const raw = Buffer.concat(buffers).toString("utf8");
let prompt = "";
try {
  const parsed = JSON.parse(raw || "{}");
  prompt = String(parsed.prompt || "");
} catch {
  prompt = "";
}

const normalized = prompt.toLowerCase();
const reminders = [];

if (/(^|\s)(\/[-a-z0-9]+|@[a-z0-9_-]+)/i.test(prompt)) {
  reminders.push("Explicit route detected. Honor the named workflow or agent directly unless it is invalid.");
}

if (/(^|[^a-z0-9-])(deep-research|stitch|stitch-design-orchestrator|stitch-prompt-enhancement|stitch-design-system|stitch-implementation-handoff|skill-creator|frontend-design|api-design|database-design)([^a-z0-9-]|$)/i.test(normalized)) {
  reminders.push("Named skill detected. Load the exact skill first and skip broad rerouting when it already matches.");
}

if (/(research|latest|compare|comparison|verify|official docs|reddit|community)/i.test(normalized)) {
  reminders.push("Research trigger detected. Inspect the repo first, use official docs as primary evidence, and label community sources as secondary evidence.");
}

const payload = reminders.length > 0
  ? {
      hookSpecificOutput: {
        hookEventName: "BeforeAgent",
        additionalContext: reminders.join(" "),
      },
    }
  : {};

process.stdout.write(JSON.stringify(payload));