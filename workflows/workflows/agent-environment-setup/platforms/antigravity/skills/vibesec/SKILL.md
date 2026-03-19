---
name: vibesec
description: "Perform a lightweight security vibe check on codebases, configurations, and dependencies. Quick assessment of common security pitfalls, dependency health, and configuration hygiene without a full audit."
---
# VibeSec — Lightweight Security Vibe Check

## Purpose

Deliver a fast, opinionated security assessment that catches the most common and impactful issues in minutes rather than days. VibeSec is not a replacement for a full security audit; it is a triage pass that identifies the biggest risks so teams can prioritize deeper review where it matters most.

## When to Use

- Quick security sanity check before a release or PR merge
- Onboarding onto an unfamiliar codebase and need a security first impression
- Auditing dependency health and known vulnerabilities
- Reviewing configuration files for security misconfigurations
- Assessing whether a project needs a full security audit
- Checking for hardcoded secrets, weak defaults, and missing security headers

## Instructions

1. **Scan for hardcoded secrets and credentials** — Search for API keys, passwords, tokens, and private keys in source code, config files, and environment templates because leaked secrets are the fastest path to a breach.

2. **Check dependency health** — Run `npm audit`, `pip-audit`, `cargo audit`, or the ecosystem equivalent and review the output because vulnerable dependencies are the most common real-world attack vector.

3. **Review dependency age and maintenance** — Flag dependencies that have not been updated in 12+ months or have known maintainer abandonment because unmaintained packages accumulate vulnerabilities silently.

4. **Inspect environment and configuration files** — Check `.env`, `docker-compose.yml`, `nginx.conf`, cloud IAM policies, and similar files for overly permissive settings, debug modes left on, and default credentials because misconfigurations are exploitable without any code vulnerability.

5. **Verify HTTPS and TLS configuration** — Confirm that all external communications use TLS, certificates are valid, and insecure protocol fallbacks are disabled because cleartext transport exposes all other security measures.

6. **Check authentication defaults** — Verify that default passwords are changed, admin endpoints are protected, MFA is available, and session timeouts are reasonable because weak authentication defaults are low-effort, high-impact targets.

7. **Look for common injection points** — Spot-check user input handling for SQL concatenation, unsanitized HTML rendering, command string building, and path concatenation because injection vulnerabilities have the highest exploitability.

8. **Review CORS and CSP headers** — Check for `Access-Control-Allow-Origin: *`, missing Content-Security-Policy, and absent X-Frame-Options because permissive headers enable cross-origin attacks.

9. **Assess logging and error exposure** — Verify that stack traces are not exposed to users, sensitive data is not logged, and security events are captured because information leaks aid attackers and missing logs delay incident response.

10. **Check for exposed debug endpoints** — Search for `/debug`, `/actuator`, `/phpinfo`, `/__debug__`, GraphQL introspection, and similar endpoints because debug interfaces provide reconnaissance information and sometimes direct code execution.

11. **Evaluate Docker and container security** — Check for containers running as root, unscanned base images, exposed ports, and secrets mounted as environment variables because container misconfigurations amplify application vulnerabilities.

12. **Produce a vibe check summary with risk rating** — Assign an overall vibe (Green/Yellow/Orange/Red) and list the top 5 issues to fix first because a clear, prioritized summary drives immediate action.

13. **Recommend whether a full audit is needed** — Based on findings, state whether the codebase needs a comprehensive security review, a targeted deep-dive on specific areas, or is reasonably healthy because this guides resource allocation decisions.

## Output Format

```
## VibeSec Report

### Overall Vibe: [GREEN / YELLOW / ORANGE / RED]

### Quick Stats
- Hardcoded secrets found: [count]
- Vulnerable dependencies: [critical/high/medium/low]
- Config issues: [count]
- Missing security headers: [list]

### Top 5 Issues (Fix These First)
1. [Issue — why it matters — how to fix]
2. ...

### Secrets Scan
[Results or clean bill]

### Dependency Health
[Vulnerability counts, outdated packages, unmaintained deps]

### Configuration Review
[Findings per config file]

### Header & Transport Check
[Missing headers, TLS issues]

### Recommendation
[Full audit needed? Targeted review? Ship it?]
```

## References

| Topic | Reference | Load When |
|-------|-----------|-----------|
| Quick Security Checks | `references/quick-checks.md` | Running the initial scan pass |
| Dependency Audit Guide | `references/dependency-audit.md` | Assessing dependency health |
| Configuration Review | `references/config-review.md` | Inspecting config files |
| Common Security Pitfalls | `references/common-pitfalls.md` | Identifying frequent mistakes |

## Antigravity Platform Notes

- Skills are stored under `.agents/skills/<skill-id>/SKILL.md` (shared Agent Skills standard path).
- TOML command files in `.gemini/commands/` provide slash-command entry points for workflows and agent routes.
- Rules file relative to the mirrored skill directory: `../../rules/GEMINI.md`.
- Use Agent Manager for parallel agent coordination and multi-specialist delegation (equivalent to `@orchestrator`).
- Specialist routes are compiled into `.gemini/commands/agent-*.toml` command files — not project-local agent markdown.
- Reference files are loaded relative to the skill directory under `.agents/skills/<skill-id>/`.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available when Cubis Foundry MCP is configured.
- User arguments are passed as natural language via `{{args}}` in TOML command prompts.
