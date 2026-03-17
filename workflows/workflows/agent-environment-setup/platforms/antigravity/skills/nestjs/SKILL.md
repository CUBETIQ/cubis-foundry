---
name: nestjs
description: "Use when building NestJS 11+ applications with TypeScript decorators, dependency injection, modular architecture, guards, interceptors, pipes, microservices, and GraphQL integration."
---
# NestJS

## Purpose

Guide the design and implementation of production-grade NestJS 11+ applications using TypeScript decorators, hierarchical dependency injection, modular architecture, guards, interceptors, pipes, microservices communication patterns, and GraphQL federation. Every instruction prioritizes type safety, testability, and clean separation of concerns across the NestJS module graph.

## When to Use

- Scaffolding a new NestJS application or adding feature modules to an existing one.
- Designing controllers, services, and providers with proper dependency injection scoping.
- Implementing authentication and authorization with guards, interceptors, and custom decorators.
- Building microservice architectures with NestJS transport layers (TCP, Redis, NATS, gRPC, Kafka).
- Adding GraphQL resolvers with code-first or schema-first approaches.
- Reviewing NestJS code for circular dependencies, provider scope issues, or guard bypass risks.

## Instructions

1. **Confirm the NestJS major version and platform adapter before generating code** because NestJS 11 introduced SWC compilation by default, new decorator metadata handling, and breaking changes in platform adapters that invalidate patterns from earlier versions.

2. **Organize the application into feature modules with explicit `imports`, `providers`, `controllers`, and `exports` arrays** because NestJS uses module boundaries as the DI container scope, and implicit cross-module access causes runtime resolution failures that TypeScript cannot catch at compile time.

3. **Register providers at the narrowest possible module scope and export only what consumers need** because globally registered providers create hidden coupling, make testing harder, and increase memory usage in request-scoped scenarios.

4. **Use constructor injection exclusively and avoid `@Inject(forwardRef(...))` unless breaking a verified circular dependency** because forward references defeat static analysis, obscure the dependency graph, and are the leading cause of `undefined` provider errors at startup.

5. **Create custom decorators by composing `applyDecorators()` from `@nestjs/common`** because decorator composition keeps authorization metadata, validation rules, and API documentation co-located on the route handler where they are auditable.

6. **Implement authentication with a guard that extends `CanActivate` and attach it via `@UseGuards()` or globally with `APP_GUARD`** because guards run before interceptors and pipes in the NestJS request lifecycle, ensuring unauthenticated requests are rejected at the earliest possible stage.

7. **Use interceptors for cross-cutting concerns like logging, caching, response transformation, and timeout enforcement** because interceptors wrap the execution stream with RxJS observables, giving access to both the request and the response without modifying controller logic.

8. **Validate all incoming DTOs with `class-validator` decorators and activate the global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true`** because unvalidated payloads bypass TypeScript's compile-time guarantees and are the most common injection vector in NestJS APIs.

9. **Prefer `class-transformer` with `@Exclude()` and `ClassSerializerInterceptor` for response shaping** because manual `delete` or spread-based field stripping is error-prone and silently leaks sensitive fields when new properties are added to entities.

10. **Define custom exception filters for domain-specific error types and register them with `@Catch()`** because unhandled exceptions default to a generic 500 response, hiding actionable error context from API consumers and monitoring systems.

11. **Configure microservice transports through `ClientsModule.register()` with explicit serialization and retry options** because default transport settings use JSON serialization without retry, which silently drops messages under network partitions.

12. **Use the `@MessagePattern()` decorator for request-response and `@EventPattern()` for event-driven communication between microservices** because mixing patterns causes message acknowledgment mismatches that lead to duplicate processing or lost events.

13. **Build GraphQL APIs with the code-first approach using `@ObjectType()`, `@Field()`, and `@Resolver()` decorators** because code-first generates the SDL schema from TypeScript types, eliminating schema-code drift and enabling IDE autocompletion on resolver arguments.

14. **Write unit tests with `Test.createTestingModule()` and mock providers using `jest.fn()` or custom factory providers** because NestJS DI container isolation in tests prevents cross-test state leakage and verifies that each module resolves its own dependencies correctly.

15. **Write e2e tests with `supertest` against the compiled application and seed test data in `beforeAll` hooks** because e2e tests exercise the full middleware, guard, pipe, and interceptor chain that unit tests on isolated services do not cover.

16. **Use `ConfigModule.forRoot()` with Joi or Zod validation schemas for environment variables** because unvalidated environment access with `process.env` produces `undefined` values that fail silently at runtime instead of at application bootstrap.

## Output Format

Provide implementation code, module definitions, decorator usage, configuration snippets, and architectural guidance as appropriate. Include file paths relative to the `src/` directory. When generating modules, always show the `@Module()` decorator with complete `imports`, `providers`, `controllers`, and `exports` arrays.

## References

| File | Load when |
| --- | --- |
| `references/modules-di.md` | You need module organization, provider scoping, dynamic modules, or circular dependency resolution guidance. |
| `references/guards-interceptors.md` | You need authentication guards, role-based authorization, interceptor patterns, or custom decorator composition. |
| `references/microservices.md` | You need transport layer configuration, message patterns, hybrid applications, or inter-service communication. |
| `references/testing.md` | You need unit test setup with `TestingModule`, e2e test patterns, mocking strategies, or test database configuration. |
| `references/graphql.md` | You need code-first resolvers, schema federation, DataLoader integration, or subscription setup. |

## Antigravity Platform Notes

- Skills are stored under `.agents/skills/<skill-id>/SKILL.md` (shared Agent Skills standard path).
- TOML command files in `.gemini/commands/` provide slash-command entry points for workflows and agent routes.
- Rules file: `.agents/rules/GEMINI.md`.
- Use Agent Manager for parallel agent coordination and multi-specialist delegation (equivalent to `@orchestrator`).
- Specialist routes are compiled into `.gemini/commands/agent-*.toml` command files — not project-local agent markdown.
- Reference files are loaded relative to the skill directory under `.agents/skills/<skill-id>/`.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available when Cubis Foundry MCP is configured.
- User arguments are passed as natural language via `{{args}}` in TOML command prompts.
