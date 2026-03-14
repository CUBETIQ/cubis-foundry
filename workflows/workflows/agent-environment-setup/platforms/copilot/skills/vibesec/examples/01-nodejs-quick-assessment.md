# Example 1: Quick Security Vibe Check on a Next.js Project

## User Prompt

> Run a vibe check on our Next.js e-commerce project. Here is what I can tell you:
> - Next.js 13.4, React 18, TypeScript
> - Using NextAuth with Google and GitHub providers
> - Prisma ORM with PostgreSQL
> - Stripe for payments
> - Docker Compose for local dev, Vercel for production
> - Last dependency update was 5 months ago
> - .env.local is gitignored but .env.example contains real API key patterns
> - No CSP headers configured
> - Images uploaded to S3 with public-read ACL

## Expected Response

### VibeSec Report

### Overall Vibe: YELLOW

This project has a reasonable foundation (typed language, ORM, managed auth) but has several configuration-level gaps that could be exploited. No showstoppers, but action needed before the next release.

### Quick Stats

- Hardcoded secrets found: 0 committed, 1 risky pattern (.env.example)
- Vulnerable dependencies: Likely (5 months without updates)
- Config issues: 3 (CSP, S3 ACL, .env.example)
- Missing security headers: CSP, Permissions-Policy

### Top 5 Issues (Fix These First)

1. **Missing Content-Security-Policy header** — Without CSP, any XSS vulnerability can load arbitrary scripts, exfiltrate data, and hijack sessions. Add a strict CSP in `next.config.js` or middleware. This is the highest-leverage fix.

2. **S3 public-read ACL on image uploads** — Public-read means anyone with the URL can access uploaded images. If users upload sensitive documents or if S3 keys are guessable, this is a data exposure risk. Switch to private ACL with signed URLs for access.

3. **Stale dependencies (5 months)** — Run `npm audit` immediately. Next.js, Prisma, and NextAuth have all had security patches in the last 5 months. Especially check for Next.js server-action vulnerabilities.

4. **.env.example with real API key patterns** — If `.env.example` contains keys that look like real keys (even expired ones), contributors may accidentally commit real keys thinking it is safe. Use clearly fake placeholder values like `sk_test_REPLACE_ME`.

5. **No Permissions-Policy header** — Without this header, embedded content can access camera, microphone, geolocation, and payment APIs. Add `Permissions-Policy: camera=(), microphone=(), geolocation=()` at minimum.

### Secrets Scan

- `.env.local` — properly gitignored
- `.env.example` — contains patterns resembling real API keys. Replace with obvious placeholders
- Source code — no hardcoded secrets detected in a surface scan
- **Recommendation:** Add `gitleaks` as a pre-commit hook

### Dependency Health

- **Last updated:** 5 months ago — likely has known vulnerabilities
- **Action:** Run `npm audit --production` and address critical/high findings
- **Ongoing:** Enable Dependabot or Renovate for automated dependency PRs

### Configuration Review

| Config | Status | Issue |
|--------|--------|-------|
| NextAuth | OK | Standard OAuth providers, verify callback URLs are restricted |
| Prisma | OK | ORM prevents SQL injection by default |
| Docker Compose | Check | Verify no ports exposed beyond localhost |
| Vercel | Check | Verify environment variables are set as secrets, not plaintext |
| S3 | Issue | Public-read ACL on uploads |

### Header & Transport Check

| Header | Status |
|--------|--------|
| HTTPS | OK (Vercel enforces) |
| HSTS | OK (Vercel default) |
| CSP | Missing |
| X-Frame-Options | Check — may need explicit config |
| Permissions-Policy | Missing |
| X-Content-Type-Options | Check |

### Recommendation

**No full audit needed yet**, but address the top 5 issues before the next release. Schedule a focused review of the S3 upload flow and NextAuth callback configuration. Set up automated dependency updates.
