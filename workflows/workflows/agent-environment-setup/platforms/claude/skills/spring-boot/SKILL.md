---
name: spring-boot
description: "Use when building Spring Boot 3.4+ applications with Java records, virtual threads, Spring Security 6, Spring Data JPA, reactive WebFlux patterns, and production-grade testing strategies."
allowed-tools: Read Grep Glob Bash Edit Write
user-invocable: true
argument-hint: "Spring Boot controller, service, or configuration to work on"
---

# Spring Boot

## Purpose

Guide the design and implementation of production-grade Spring Boot 3.4+ applications using Java 21+ features (records, sealed classes, virtual threads), Spring Security 6 with the lambda DSL, Spring Data JPA with query derivation and projections, reactive WebFlux endpoints, and comprehensive testing with `@SpringBootTest`, `MockMvc`, and `WebTestClient`. Every instruction prioritizes type safety, minimal configuration, and secure-by-default behavior.

## When to Use

- Scaffolding a new Spring Boot application or adding feature modules to an existing one.
- Designing REST controllers, service layers, and repository interfaces with Spring Data JPA.
- Implementing authentication and authorization with Spring Security 6 filter chains and method security.
- Building reactive endpoints with WebFlux and `Mono`/`Flux` return types.
- Configuring virtual threads for high-concurrency blocking I/O workloads.
- Reviewing Spring Boot code for security misconfigurations, N+1 queries, or bean scope issues.

## Instructions

1. **Confirm the Spring Boot version and Java baseline before generating code** because Spring Boot 3.4 requires Java 17+ and defaults to Jakarta EE 10 namespaces, and patterns from Spring Boot 2.x using `javax.*` imports and the deprecated `WebSecurityConfigurerAdapter` will not compile.

2. **Use Java records for DTOs, request bodies, and response payloads** because records are immutable by construction, generate `equals`/`hashCode`/`toString` automatically, and signal to reviewers that the type carries data without behavior.

3. **Define `@RestController` classes with constructor injection and avoid field injection with `@Autowired`** because constructor injection makes dependencies explicit, enables final fields, and allows instantiation in tests without a Spring context.

4. **Organize the application into feature packages with `@Service`, `@Repository`, and `@Controller` stereotypes** because component scanning respects package boundaries, and cross-package access should go through explicit `@Bean` configuration rather than implicit scanning.

5. **Use Spring Data JPA repository interfaces with derived query methods and `@Query` for complex cases** because derived queries are compile-time verified against the entity model, and JPQL `@Query` methods surface syntax errors at startup rather than at call time.

6. **Apply `@Transactional` on service methods that perform multiple writes and configure `readOnly = true` for read-only transactions** because missing transaction boundaries cause partial writes on failure, and `readOnly` enables Hibernate flush-mode optimizations that reduce query overhead.

7. **Configure Spring Security 6 with the `SecurityFilterChain` bean and lambda DSL instead of extending `WebSecurityConfigurerAdapter`** because the adapter was removed in Spring Security 6, and the lambda DSL produces a more readable, composable filter chain configuration.

8. **Use `@PreAuthorize` and `@PostAuthorize` with SpEL expressions for method-level authorization** because URL-pattern matching in the filter chain cannot express domain-level rules like "only the resource owner can update this entity," and method security evaluates after the arguments are resolved.

9. **Enable virtual threads with `spring.threads.virtual.enabled=true` for blocking I/O workloads** because virtual threads eliminate the thread-per-request bottleneck by multiplexing millions of lightweight threads onto a small carrier pool, dramatically improving throughput for database and HTTP client calls.

10. **Use `WebClient` for non-blocking HTTP calls and `RestClient` for synchronous calls in virtual-thread contexts** because `RestTemplate` is in maintenance mode, `WebClient` integrates with the reactive pipeline, and `RestClient` provides a modern fluent API for imperative code.

11. **Build reactive endpoints with `@RestController` returning `Mono<T>` and `Flux<T>` when the entire call chain is non-blocking** because mixing blocking calls inside a reactive pipeline exhausts the limited Netty event-loop threads and produces worse throughput than a servlet-based approach.

12. **Write entity classes with `@Entity`, `@Id`, and explicit `@Column` mappings, and mark lazy associations with `@ManyToOne(fetch = LAZY)`** because Hibernate defaults `@ManyToOne` to `EAGER`, which silently triggers N+1 queries that dominate response time in list endpoints.

13. **Use `@DataJpaTest` for repository tests and `@WebMvcTest` for controller tests to avoid loading the full application context** because slice tests start in under two seconds, isolate the layer under test, and auto-configure only the relevant beans.

14. **Write integration tests with `@SpringBootTest` and `@Testcontainers` for database-dependent tests** because in-memory H2 diverges from PostgreSQL/MySQL behavior in areas like JSON columns, window functions, and locking, and Testcontainers provides a real database with zero manual setup.

15. **Externalize configuration with `@ConfigurationProperties` bound to a record and validated with `@Validated`** because `@Value` injection scatters configuration across the codebase, lacks validation, and cannot be tested without a running Spring context.

16. **Configure structured logging with `spring.application.name`, correlation IDs, and JSON output for production** because unstructured text logs are unparseable by observability platforms, and correlation IDs are required to trace requests across microservice boundaries.

## Output Format

Provide implementation code, configuration properties, bean definitions, and architectural guidance as appropriate. Include file paths relative to `src/main/java/` and `src/test/java/`. When generating controllers, always show the record DTOs, service interface, and security configuration alongside the endpoint.

## References

| File | Load when |
| --- | --- |
| `references/dependency-injection.md` | You need bean scoping, `@ConfigurationProperties`, profiles, conditional beans, or constructor injection patterns. |
| `references/security.md` | You need Spring Security 6 filter chain configuration, JWT authentication, method security, or CORS setup. |
| `references/data-access.md` | You need Spring Data JPA repositories, query derivation, projections, specifications, or Hibernate tuning. |
| `references/testing.md` | You need `@SpringBootTest`, `@WebMvcTest`, `@DataJpaTest`, Testcontainers, or `MockMvc`/`WebTestClient` patterns. |
| `references/reactive.md` | You need WebFlux endpoints, `Mono`/`Flux` patterns, `WebClient`, R2DBC, or reactive security configuration. |

## Claude Platform Notes

- Use `$ARGUMENTS` to access user-provided arguments passed when the skill is invoked.
- Reference skill-local files with `${CLAUDE_SKILL_DIR}/references/<file>` for portable paths.
- When `context: fork` is set, the skill runs in an isolated subagent context; the `agent` field names the fork target.
- Custom subagents live under `../../agents/` relative to the mirrored skill directory and support YAML frontmatter: `name`, `description`, `tools`, `model`, `maxTurns`, `memory`, `handoffs`.
- Use `model` field in agent frontmatter to select model per subagent (e.g., `model: opus` for complex analysis).
- Set `maxTurns` to prevent runaway iterations (default: 25, orchestrator: 30).
- Current project-memory agents are `orchestrator` and `planner`; use them for durable project context.
- Hook templates in `.claude/hooks/` provide lifecycle event integration at `UserPromptSubmit` and other events.
- Path-scoped rules live under `../../rules/` with `paths:` frontmatter for targeted guidance.
- MCP skill tools (`skill_search`, `skill_get`, `skill_validate`, `skill_get_reference`) are available for dynamic skill discovery and loading.
- Use `allowed-tools` in frontmatter to restrict tool access for security-sensitive skills.
- Workflow skills can be compiled to `.claude/skills/<workflow-id>/SKILL.md` as `generatedSkills`.
