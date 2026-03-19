---
name: owasp-security-review
description: "Use when performing OWASP-aligned security reviews, including vulnerability analysis, secure code review, threat modeling, and SAST/DAST integration."
allowed-tools: Read Grep Glob Bash
context: fork
agent: security-auditor
user-invocable: true
argument-hint: "Application, endpoint, or codebase to audit"
---

# OWASP Security Review

## Purpose

Perform structured, OWASP-standards-based security reviews of application code and architecture. This skill drives systematic vulnerability identification using the OWASP Top 10 (2025) as the primary framework, combining automated SAST/DAST patterns with manual code review and lightweight threat modeling.

## When to Use

- Auditing a web application or API against OWASP Top 10 categories
- Reviewing pull requests for security regressions
- Building or refining a threat model for a feature or service
- Evaluating whether SAST/DAST tooling covers critical vulnerability classes
- Preparing for a penetration test by identifying likely attack surfaces
- Assessing third-party code or open-source dependencies for security posture

## Instructions

1. **Identify the review scope and application context** — Determine which components, endpoints, or modules are in scope so the review stays focused and avoids wasted effort on unrelated code paths.

2. **Gather architecture artifacts** — Collect data-flow diagrams, deployment topology, authentication mechanisms, and trust boundaries because threat modeling requires understanding how data moves through the system.

3. **Map the attack surface** — Enumerate all external inputs (HTTP parameters, file uploads, API bodies, headers, cookies, WebSocket messages) because every untrusted input is a potential injection vector.

4. **Evaluate against OWASP Top 10 (2025) categories systematically** — Walk through each category (Broken Access Control, Cryptographic Failures, Injection, Insecure Design, Security Misconfiguration, Vulnerable Components, Authentication Failures, Data Integrity Failures, Logging Failures, SSRF) because structured enumeration prevents coverage gaps.

5. **Review authentication and session management** — Inspect login flows, token issuance, session expiry, MFA implementation, and credential storage because authentication bypasses are consistently the highest-impact vulnerabilities.

6. **Analyze authorization and access control logic** — Trace every privileged operation to its authorization check, looking for IDOR, privilege escalation, and missing function-level access control because broken access control is the number-one OWASP category.

7. **Inspect input validation and output encoding** — Verify that all user-controlled data is validated on input and encoded on output, checking for SQL injection, XSS, command injection, and path traversal because injection remains a top attack class.

8. **Assess cryptographic implementations** — Check key lengths, algorithm choices, IV/nonce handling, certificate validation, and secret storage because weak cryptography silently undermines all other security controls.

9. **Evaluate error handling and logging** — Confirm that errors do not leak stack traces or internal state, and that security-relevant events are logged with sufficient detail for incident response because poor logging delays breach detection.

10. **Run or simulate SAST patterns** — Apply static analysis rules (Semgrep, CodeQL, ESLint security plugins) against the codebase to catch known vulnerability patterns because automated tools find issues that manual review misses at scale.

11. **Run or simulate DAST patterns** — Identify runtime-testable vulnerabilities (CSRF, CORS misconfiguration, header injection, open redirects) that require an executing application because some flaws only manifest at runtime.

12. **Build a lightweight threat model** — Using STRIDE or PASTA, identify threats for each trust boundary crossing, rank them by likelihood and impact, and document residual risk because threat models connect code-level findings to business-level risk.

13. **Classify each finding by severity** — Assign Critical/High/Medium/Low using CVSS v4 base scores contextualized by exploitability and business impact because consistent severity drives correct prioritization.

14. **Write remediation guidance for each finding** — Provide specific, actionable fix instructions (code snippets, configuration changes, library recommendations) because findings without remediation create work without progress.

15. **Verify that SAST/DAST tool coverage matches OWASP categories** — Cross-reference the toolchain rules against all ten categories to identify detection gaps because uncovered categories represent blind spots in continuous security.

16. **Produce the final review report** — Consolidate scope, methodology, findings table, detailed findings, threat model summary, and prioritized recommendations into a single document because a structured report enables stakeholder action.

## Output Format

```
## OWASP Security Review Report

### Scope
[Components, endpoints, and modules reviewed]

### Methodology
[OWASP Top 10 (2025) categories evaluated, tools used]

### Executive Summary
[Risk posture: critical/high/medium/low counts, top risks]

### Threat Model Summary
[Trust boundaries, STRIDE threats, residual risk]

### Findings

| # | Title | OWASP Category | Severity | CVSS | Location | Status |
|---|-------|----------------|----------|------|----------|--------|
| 1 | ...   | A01:2025       | Critical | 9.1  | file:line| Open   |

### Detailed Findings
[For each: description, evidence, impact, remediation, references]

### SAST/DAST Coverage Matrix
[Category vs. tool coverage with gaps highlighted]

### Recommendations
[Priority-ordered action items]
```

## References

| Topic | Reference | Load When |
|-------|-----------|-----------|
| OWASP Top 10 (2025) | `references/owasp-top-10.md` | Reviewing against OWASP categories |
| Code Review Checklist | `references/code-review-checklist.md` | Performing manual code review |
| Threat Modeling | `references/threat-modeling.md` | Building or updating a threat model |
| SAST/DAST Patterns | `references/sast-dast.md` | Configuring or running security scanners |
| Remediation Playbook | `references/remediation.md` | Writing fix guidance for findings |

## Claude Platform Notes

- Use `$ARGUMENTS` to access user-provided arguments passed when the skill is invoked.
- Reference skill-local files with `${CLAUDE_SKILL_DIR}/references/<file>` for portable paths.
- When `context: fork` is set, the skill runs in an isolated subagent context; the `agent` field names the fork target.
- Custom subagents live under `../../agents/` relative to the mirrored skill directory and support YAML frontmatter: `name`, `description`, `tools`, `model`, `maxTurns`, `memory`, `handoffs`.
- Use `model` field in agent frontmatter to select model per subagent (e.g., `model: opus` for complex analysis).
- Set `maxTurns` to prevent runaway iterations (default: 25, orchestrator: 30).
- Key agents support `memory: project` for cross-session learning (orchestrator, debugger, researcher, project-planner).
- Hook templates in `.claude/hooks/` provide lifecycle event integration at `UserPromptSubmit` and other events.
- Path-scoped rules live under `../../rules/` with `paths:` frontmatter for targeted guidance.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available for dynamic skill discovery and loading.
- Use `allowed-tools` in frontmatter to restrict tool access for security-sensitive skills.
- Workflow skills can be compiled to `.claude/skills/<workflow-id>/SKILL.md` as `generatedSkills`.
