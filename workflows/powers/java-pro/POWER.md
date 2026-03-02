````markdown
---
inclusion: manual
name: "java-pro"
description: "Use for modern Java backend and platform engineering with Java 25-era language/runtime practices."
license: MIT
metadata:
  version: "1.0.0"
  domain: "language"
  role: "specialist"
  stack: "java"
  baseline: "Java SE 25"
---

# Java Pro

## When to use

- Building or modernizing Java backend services.
- Designing JVM architecture for high-throughput systems.
- Improving reliability, observability, and maintainability.

## Core workflow

1. Clarify runtime target and deployment constraints.
2. Define module boundaries and API contracts.
3. Implement with clear domain/service/infrastructure separation.
4. Add tests and performance checks for critical paths.

## Baseline standards

- Use current LTS/JDK baseline approved by project policy.
- Prefer records/sealed hierarchies where they simplify modeling.
- Keep null-handling explicit; avoid silent NPE pathways.
- Use structured logging and trace propagation.
- Enforce dependency and API compatibility checks in CI.

## Avoid

- Monolithic service classes with mixed responsibilities.
- Reflection-heavy magic when explicit code is clearer.
- Leaking persistence entities directly into API contracts.
````
