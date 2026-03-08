---
name: "php-pro"
description: "Use for modern PHP 8.4-era backend and application engineering with strict typing, framework-aware architecture, testing, and operational safety."
metadata:
  category: "languages"
  layer: "languages"
  canonical: true
  maturity: "stable"
  tags: ["php", "backend", "language", "strict-types", "composer"]
---

# PHP Pro

## When to Use

- Building or refactoring PHP services and applications.
- Tightening typing, dependency boundaries, and package hygiene.
- Improving request handling, background jobs, and test structure.

## When Not to Use

- Framework-specific work where the framework skill should lead.
- Database tuning with no PHP changes.
- Frontend-only or infrastructure-only tasks.

## Core workflow

1. Confirm runtime, framework, and PHP version baseline.
2. Enable strict typing and explicit contracts at module boundaries.
3. Keep service, controller, and persistence responsibilities separate.
4. Prefer deterministic Composer and test workflows.
5. Validate with targeted tests and static analysis where available.
