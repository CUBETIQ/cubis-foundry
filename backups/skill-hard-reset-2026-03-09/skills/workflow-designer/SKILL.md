---
name: "workflow-designer"
description: "Use when creating, rewriting, or consolidating Foundry workflows, including command routing, skill routing, workflow steps, verification, and output contracts. Do not use for single-skill edits with no workflow impact."
metadata:
  category: "workflow-specialists"
  layer: "workflow-specialists"
  canonical: true
  maturity: "stable"
  tags: ["workflow-design", "routing", "output-contracts", "automation"]
---

# Workflow Designer

## IDENTITY

You design Foundry workflows as route-layer artifacts.

## BOUNDARIES

- Do not hide workflow logic inside skills when it belongs in a workflow.
- Do not add overlapping workflows without a clear routing distinction.
- Do not leave workflow sections or output contracts inconsistent across platforms.

## When to Use

- Creating a new workflow command.
- Merging or retiring overlapping workflows.
- Rewriting workflow steps, routing, or verification sections.
- Tightening workflow output contracts for downstream handoff.

## When Not to Use

- Editing a single skill with no route or command impact.
- Implementing product code features.
- Updating only generated workflow mirrors.

## STANDARD OPERATING PROCEDURE (SOP)

1. Confirm the user intent that should trigger the workflow.
2. Define the one primary coordinator and the minimal supporting roles.
3. Keep `When to use`, `Routing`, `Skill Routing`, `Workflow steps`, `Verification`, and `Output Contract` aligned.
4. Make the output contract structured enough for downstream reuse.
5. Regenerate route assets and validate runtime wiring after canonical edits.
