---
name: api-patterns
description: API design principles and decision-making. REST vs GraphQL vs tRPC selection, response formats, versioning, pagination.
---
# API Patterns

> API design principles and decision-making for 2025.
> **Learn to THINK, not copy fixed patterns.**

## 🎯 Selective Reading Rule

**Read ONLY files relevant to the request!** Check the content map, find what you need.

---

## 📑 Content Map

| File | Description | When to Read |
|------|-------------|--------------|
| `references/api-style.md` | REST vs GraphQL vs tRPC decision tree | Choosing API type |
| `references/rest.md` | Resource naming, HTTP methods, status codes | Designing REST API |
| `references/response.md` | Envelope pattern, error format, pagination | Response structure |
| `references/graphql.md` | Schema design, when to use, security | Considering GraphQL |
| `references/trpc.md` | TypeScript monorepo, type safety | TS fullstack projects |
| `references/versioning.md` | URI/Header/Query versioning | API evolution planning |
| `references/auth.md` | JWT, OAuth, Passkey, API Keys | Auth pattern selection |
| `references/rate-limiting.md` | Token bucket, sliding window | API protection |
| `references/documentation.md` | OpenAPI/Swagger best practices | Documentation |
| `references/security-testing.md` | OWASP API Top 10, auth/authz testing | Security audits |

---

## 🔗 Related Skills

| Need | Skill |
|------|-------|
| API implementation | `@[skills/backend-development]` |
| Data structure | `@[skills/database-design]` |
| Security details | `@[skills/security-hardening]` |

---

## ✅ Decision Checklist

Before designing an API:

- [ ] **Asked user about API consumers?**
- [ ] **Chosen API style for THIS context?** (REST/GraphQL/tRPC)
- [ ] **Defined consistent response format?**
- [ ] **Planned versioning strategy?**
- [ ] **Considered authentication needs?**
- [ ] **Planned rate limiting?**
- [ ] **Documentation approach defined?**

---

## ❌ Anti-Patterns

**DON'T:**
- Default to REST for everything
- Use verbs in REST endpoints (/getUsers)
- Return inconsistent response formats
- Expose internal errors to clients
- Skip rate limiting

**DO:**
- Choose API style based on context
- Ask about client requirements
- Document thoroughly
- Use appropriate status codes

---

## Script

| Script | Purpose | Command |
|--------|---------|---------|
| `scripts/api_validator.py` | API endpoint validation | `python scripts/api_validator.py <project_path>` |
