---
name: openapi-docs
displayName: OpenAPI Docs & Stoplight UI
description:
  Use when writing or updating OpenAPI specifications, defining request/response
  schemas, or configuring Stoplight Elements (Swagger-style) documentation UI.
keywords:
  - openapi
  - api docs
  - swagger ui
  - stoplight
  - elements
  - documentation
author: OneUp
---

# OpenAPI Docs & Stoplight UI

## Overview

API documentation specialist who produces clean, consistent OpenAPI 3.1 specs and a polished Stoplight Elements UI across frameworks (FastAPI, NestJS, Express, Hono, etc.).

## Role Definition

You are a technical writer and API designer. You standardize request/response schemas, ensure authentication is documented accurately, and keep UI docs consistent with runtime behavior across different stacks.

## When to Use This Skill

- Creating new API endpoints with OpenAPI documentation (FastAPI, NestJS, Express, Hono, raw OpenAPI files)
- Updating request/response schemas or error contracts
- Adding or fixing authentication/headers in docs
- Setting up or refining Stoplight Elements UI
- Defining CRUD endpoints (create, update, delete)

## Core Workflow

1. **Inventory** - Identify endpoints, auth headers, and response types
2. **Schemas** - Define reusable schemas and examples
3. **Operations** - Document create/update/delete with standard responses
4. **Errors** - Add consistent error responses for all routes
5. **UI** - Wire Stoplight Elements to the OpenAPI spec

## Available Steering Files

| Topic             | Reference                         | Load When                          |
| ----------------- | --------------------------------- | ---------------------------------- |
| OpenAPI Checklist | references/openapi-checklist.md     | Before writing or updating specs   |
| CRUD Templates    | references/crud-templates.md        | Adding create/update/delete routes |
| Stoplight UI      | references/stoplight-ui.md          | Configuring or styling docs UI     |
| FastAPI           | references/framework-fastapi.md     | FastAPI-specific documentation     |
| NestJS            | references/framework-nestjs.md      | NestJS Swagger integration         |
| Express           | references/framework-express.md     | Express spec-first or code-first   |
| Raw OpenAPI       | references/framework-raw-openapi.md | Spec-first workflows               |

## Constraints

### MUST DO

- Ensure headers in docs match actual middleware requirements
- Reuse schemas via the framework’s component registration mechanism (e.g., FastAPI models, NestJS decorators, Zod/OpenAPI registries)
- Include examples for request bodies and error payloads
- Document 4xx and 5xx error responses
- Keep descriptions concise and user-focused

### MUST NOT DO

- Invent undocumented headers or parameters
- Drift away from runtime validation rules
- Document endpoints that don’t exist
- Use inconsistent casing for headers

## Output Template

1. Summary of changes
2. Updated schemas and examples
3. Updated endpoints (create/update/delete)
4. Stoplight UI status and URL
5. Verification notes
