---
name: vercel-cli
description: "Vercel CLI mastery: core commands, flags, MCP integration, microfrontend management, and project/domain/environment variable operations from the command line."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0.0"
  domain: vercel
  triggers: vercel cli, vercel command, npx vercel, vercel dev, vercel deploy, vercel env, vercel domains cli, vercel pull, vercel link, vercel mcp, vercel microfrontends cli
  role: specialist
  scope: implementation
  output-format: checklist
  related-skills: devops-engineer, wrangler, vercel-deployments, vercel-domains
  consolidates: vercel-cli-core, vercel-cli-flags, vercel-cli-mcp, vercel-cli-microfrontends, vercel-cli-project-domain-env
---

# Vercel CLI

## Purpose

Use the Vercel CLI for local development, deployments, environment management, domain operations, microfrontend orchestration, and MCP-based automation workflows.

## When To Use

- Running `vercel dev` for local development with edge function support.
- Deploying with `vercel --prod` or `vercel deploy` from CI/CD.
- Managing environment variables with `vercel env add/pull/rm`.
- Managing domains and DNS with `vercel domains`.
- Linking, inspecting, and managing project config with `vercel link`.
- Using the Vercel MCP for agent-based CLI automation.
- Managing microfrontend apps from the CLI.

## Domain Areas

### Core Commands

| Command                    | Purpose                                    |
| -------------------------- | ------------------------------------------ |
| `vercel` / `vercel deploy` | Deploy current directory                   |
| `vercel --prod`            | Deploy to production                       |
| `vercel dev`               | Local dev server with edge emulation       |
| `vercel build`             | Build locally (mirrors Vercel cloud build) |
| `vercel inspect <url>`     | Inspect deployment details                 |
| `vercel rollback`          | Instant rollback to previous deployment    |
| `vercel link`              | Link local directory to Vercel project     |
| `vercel pull`              | Pull project settings and env vars locally |

### Flags

- `--env`, `--build-env`, `--token`, `--scope`, `--yes`, `--no-wait`.
- `--regions` for targeted regional deployment.
- `--archive=tgz` for artifact-based deployments.

### Project / Domain / Env

- `vercel env add/pull/rm` — manage environment variables.
- `vercel domains add/rm/inspect` — domain management.
- `vercel alias set <url> <alias>` — assign deployment aliases.

### MCP Integration

- Use Vercel MCP server for agent-driven CLI automation.
- Query deployment state, logs, and project config programmatically.

### Microfrontends

- `vercel microfrontends` commands for app group management.
- Register and route microfrontend applications from CLI.

## Operating Checklist

1. Authenticate with `vercel login` and verify scope with `vercel whoami`.
2. Link project with `vercel link` before running local commands.
3. Pull env vars with `vercel env pull .env.local` for local dev.
4. Use `vercel build` to validate build output before deploying.
5. Automate deployments in CI with `--token` and `--yes` flags.
6. Use `vercel rollback` as the immediate incident response action.

## Output Contract

- CLI authentication and project linking steps
- Environment variable management workflow
- CI/CD pipeline CLI integration commands
- Relevant flags and flags rationale
- Rollback procedure and verification steps
