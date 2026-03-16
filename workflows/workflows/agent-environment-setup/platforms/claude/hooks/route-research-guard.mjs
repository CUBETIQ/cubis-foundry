#!/usr/bin/env node

const buffers = [];
for await (const chunk of process.stdin) buffers.push(chunk);
const raw = Buffer.concat(buffers).toString("utf8");
let prompt = "";
try {
  const parsed = JSON.parse(raw || "{}");
  prompt = String(parsed.prompt || parsed.userPrompt || parsed.message || "");
} catch {
  prompt = "";
}

const normalized = prompt.toLowerCase();
const reminders = [];

if (/(^|\s)(\/[-a-z0-9]+|@[a-z0-9_-]+)/i.test(prompt)) {
  reminders.push(
    "Explicit route detected. Honor the named workflow or agent directly unless it is invalid."
  );
}

if (/(^|[^a-z0-9-])(deep-research|stitch|skill-creator|frontend-design|api-design|database-design)([^a-z0-9-]|$)/i.test(normalized)) {
  reminders.push(
    "Named skill detected. Run skill_validate on the exact skill ID first and skip route_resolve when it validates."
  );
}

if (/(research|latest|compare|comparison|verify|official docs|reddit|community)/i.test(normalized)) {
  reminders.push(
    "Research trigger detected. Inspect the repo first, use official docs as primary evidence, and treat Reddit/community sources as labeled secondary evidence."
  );
}

const payload = reminders.length > 0
  ? { continue: true, systemMessage: reminders.join(" ") }
  : { continue: true };

process.stdout.write(JSON.stringify(payload));