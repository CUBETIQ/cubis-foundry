---
name: docker-compose-dev
description: "Use when building or maintaining Docker Compose development environments: multi-service orchestration, volume mounts for hot reload, custom networking, debugging containers, health checks, and production-parity configuration."
---
# Docker Compose for Development Environments

## Purpose

Guide the design and implementation of Docker Compose configurations that provide fast, reliable, and production-parity development environments. Every instruction prioritizes developer experience (fast startup, hot reload, easy debugging), environment reproducibility across team members, and minimal divergence between development and production runtime behavior.

## When to Use

- Setting up a new multi-service development environment with Docker Compose.
- Adding hot-reload support for application code inside containers.
- Configuring networking between services (API, database, cache, message queue).
- Debugging container startup failures, networking issues, or volume mount problems.
- Designing Compose configurations that minimize drift between dev and production.
- Optimizing Compose startup time, image build speed, or resource consumption.

## Instructions

1. **Use Compose profiles to separate always-on services from optional tooling** because developers rarely need every service running simultaneously, and profiles let each team member activate only the services relevant to their current task without maintaining separate Compose files.

2. **Mount source directories as bind volumes with explicit host-to-container paths** so that code changes on the host are immediately visible inside the container, enabling hot reload without requiring a container rebuild for every edit.

3. **Use multi-stage Dockerfiles with a dedicated development target stage** because the development image needs compilers, debuggers, and dev dependencies that must be excluded from production images, and a single Dockerfile with named stages keeps both configurations in sync.

4. **Configure health checks for every service dependency** so that dependent services wait for actual readiness (not just port availability) before starting, eliminating race conditions where the app container starts before the database accepts connections.

5. **Create a dedicated Docker network with service aliases matching production DNS names** because hardcoded `localhost` references break when services run in separate containers, and matching production DNS names reduces configuration drift.

6. **Use `.env` files with Compose variable interpolation for environment-specific values** so that secrets, ports, and feature flags are configurable per developer without modifying the tracked Compose file, and sensitive values stay out of version control.

7. **Configure named volumes for database data and package manager caches** because anonymous volumes are garbage-collected unpredictably and bind mounts for database storage cause permission issues on Linux, while named volumes persist across container restarts and are managed by Docker.

8. **Pin base image versions to specific tags (not `latest`)** because floating tags cause different developers to build different images from the same Dockerfile, producing "works on my machine" bugs that are impossible to reproduce.

9. **Add a `docker-compose.override.yml` for personal developer customizations** so that individual port mappings, extra volume mounts, or debugging configurations do not pollute the shared Compose file and are excluded from version control via `.gitignore`.

10. **Configure container resource limits (CPU and memory) to match production constraints** because an application that works with unlimited local resources will exhibit different behavior (OOM kills, CPU throttling) when deployed to resource-constrained production pods.

11. **Use `depends_on` with `condition: service_healthy` for startup ordering** because the default `depends_on` only waits for the container to start (not for the service inside it to be ready), and without health-based ordering, application containers crash on startup when their dependencies are not yet accepting connections.

12. **Expose debugger ports in the development Compose configuration** so that developers can attach IDE debuggers (VS Code, IntelliJ) to running containers without restarting or rebuilding, enabling breakpoint-driven debugging identical to local development.

13. **Implement a `make` or shell script wrapper for common Compose operations** because raw `docker compose` commands with profile flags, build arguments, and environment files are error-prone to type repeatedly, and a thin wrapper standardizes the team's development workflow.

14. **Configure log drivers and log aggregation for multi-service debugging** because reading interleaved `docker compose logs` output across five or more services is unmanageable without structured logging, service-name prefixes, and optional log forwarding to a local observability stack.

15. **Use BuildKit with cache mounts for package manager layers** because package installation is the slowest Dockerfile step, and BuildKit cache mounts persist the package manager cache across builds, reducing rebuild time from minutes to seconds when only application code changes.

16. **Test the Compose configuration in CI to prevent environment drift** because a Compose file that works locally but fails in CI indicates an undocumented host dependency, and running `docker compose up --wait` in CI catches these issues before they affect other developers.

## Output Format

Provide complete `docker-compose.yml` and `Dockerfile` content with inline comments explaining non-obvious decisions. Include file paths relative to the project root. When showing multi-stage Dockerfiles, clearly label each stage's purpose. For networking configurations, include a diagram comment showing service connectivity.

## References

| File                                    | Load when                                                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `references/compose-patterns.md`        | Designing multi-service Compose files, using profiles, overrides, or extends patterns.                 |
| `references/networking.md`              | Configuring custom networks, DNS resolution, or cross-service communication.                           |
| `references/volumes.md`                 | Setting up bind mounts, named volumes, cache mounts, or resolving permission issues.                   |
| `references/debugging.md`              | Attaching debuggers, inspecting containers, diagnosing startup failures, or reading container logs.     |
| `references/production-parity.md`       | Minimizing dev/prod drift, configuring resource limits, or testing Compose in CI.                       |

## Codex Platform Notes

- Codex supports native subagents via `.codex/agents/*.toml` files with `name`, `description`, and `developer_instructions`.
- Each subagent TOML can specify `model` and `model_reasoning_effort` to optimize cost per task difficulty:
  - Light tasks (exploration, docs): `model = "gpt-5.3-codex-spark"`, `model_reasoning_effort = "medium"`
  - Heavy tasks (security audit, orchestration): `model = "gpt-5.4"`, `model_reasoning_effort = "high"`
  - Standard tasks (implementation): inherit parent model (omit `model` field).
- Built-in agents: `default`, `worker`, `explorer`. Custom agents extend these via TOML definitions.
- Codex operates under network restrictions — skills should not assume outbound HTTP access.
- Use `$ARGUMENTS` to access user-provided arguments when the skill is invoked.
- All skill guidance executes within the sandbox; file I/O is confined to the workspace.
- Skills are installed at `.agents/skills/<skill-id>/SKILL.md`. Workflow skills can also be compiled to `.agents/skills/<workflow-id>/SKILL.md` as `generatedSkills`.
- Codex supports three autonomy levels: `suggest`, `auto-edit`, `full-auto`.
- MCP skill tools are available when the Cubis Foundry MCP server is connected.
