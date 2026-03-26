import { describe, expect, it } from "vitest";
import { projectCodexAgent } from "./codex-agent.js";
import { projectGeminiCommand } from "./gemini-command.js";
import { projectCopilotAgent } from "./copilot-agent.js";

describe("compiler projectors", () => {
  it("projects a codex agent TOML document", () => {
    const raw = `---
name: reviewer
description: Review code changes and highlight risk.
model: sonnet
priority: high
sandbox_mode: read-only
---

# Reviewer

Inspect code carefully.
`;

    const projected = projectCodexAgent(raw, "reviewer");
    expect(projected).toContain('name = "reviewer"');
    expect(projected).toContain('model = "gpt-5.4"');
    expect(projected).toContain('model_reasoning_effort = "high"');
    expect(projected).toContain('developer_instructions = """');
  });

  it("projects a gemini command TOML document", () => {
    const raw = `---
name: plan
command: "/plan"
description: Produce a structured implementation plan.
---

# Plan

Review the repo and write a plan.
`;

    const projected = projectGeminiCommand(raw, "plan");
    expect(projected).toContain('description = "Produce a structured implementation plan."');
    expect(projected).toContain("prompt = '''");
    expect(projected).toContain("Review the repo and write a plan.");
  });

  it("sanitizes a copilot agent markdown document", () => {
    const raw = `---
name: implementer
description: Build the requested change.
model: sonnet
priority: high
sandbox_mode: workspace-write
---

# Implementer

Execute the change carefully.
`;

    const projected = projectCopilotAgent(raw);
    expect(projected).toContain("name: implementer");
    expect(projected).toContain("model: sonnet");
    expect(projected).not.toContain("priority:");
    expect(projected).not.toContain("sandbox_mode:");
  });
});
