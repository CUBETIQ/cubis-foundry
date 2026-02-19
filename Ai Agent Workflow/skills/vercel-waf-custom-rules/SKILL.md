---
name: vercel-waf-custom-rules
description: "Author and tune custom WAF rules for exploit and abuse patterns."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0.0"
  domain: vercel
  triggers: vercel, security, waf, custom, rules
  role: specialist
  scope: implementation
  output-format: checklist
  related-skills: security-reviewer, secure-code-guardian, devops-engineer
---

# Vercel WAF Custom Rules

## Purpose
Author and tune custom WAF rules for exploit and abuse patterns.

## When To Use
- Vercel platform changes in the `security` domain.
- Tasks requiring production-safe rollout and verification evidence.
- Work that needs explicit Vercel-specific constraints and guardrails.

## Operating Checklist
1. Model threat paths and required controls before enabling policy changes.
2. Roll out security controls gradually with monitoring and safe bypass process.
3. Validate policy behavior with legitimate and malicious traffic patterns.
4. Document ownership, escalation, and audit expectations.

## Output Contract
- Proposed implementation choices and tradeoffs
- Required config, code, and environment changes
- Validation evidence and rollback notes
- Residual risks and follow-up actions
