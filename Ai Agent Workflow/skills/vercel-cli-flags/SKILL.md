---
name: vercel-cli-flags
description: "Manage Vercel Flags lifecycle through CLI-driven workflows."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0.0"
  domain: vercel
  triggers: vercel, cli, flags
  role: specialist
  scope: implementation
  output-format: checklist
  related-skills: powershell-windows, bash-linux, devops-engineer
---

# Vercel Cli Flags

## Purpose
Manage Vercel Flags lifecycle through CLI-driven workflows.

## When To Use
- Vercel platform changes in the `cli` domain.
- Tasks requiring production-safe rollout and verification evidence.
- Work that needs explicit Vercel-specific constraints and guardrails.

## Operating Checklist
1. Authenticate with least-privilege credentials for automation context.
2. Use idempotent command patterns and explicit environment targeting.
3. Capture machine-readable output for CI validation and alerting.
4. Validate failure-path handling and retry behavior.

## Output Contract
- Proposed implementation choices and tradeoffs
- Required config, code, and environment changes
- Validation evidence and rollback notes
- Residual risks and follow-up actions
