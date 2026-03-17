---
name: java-best-practices
description: "Use when writing, refactoring, or reviewing modern Java (21+) code. Covers records, sealed classes, pattern matching, virtual threads, structured concurrency, and production testing with JUnit 5. Replaces java-pro."
license: MIT
metadata:
  author: cubis-foundry
  version: "3.0"
compatibility: Claude Code, Codex, GitHub Copilot
---
# Java Best Practices

## Purpose

Production-grade guidance for modern Java development using JDK 21+ features including records, sealed classes, pattern matching with switch expressions, virtual threads (Project Loom), and the structured concurrency API. Covers domain modeling, concurrency architecture, API design, build system configuration, and testing strategies for high-throughput backend services.

## When to Use

- Building new Java services or libraries targeting JDK 21+.
- Migrating legacy Java code to use modern language features (records, sealed types, pattern matching).
- Adopting virtual threads for I/O-heavy workloads.
- Designing domain models with algebraic data types using sealed hierarchies.
- Establishing testing, build, and CI practices for Java projects.
- Improving concurrency safety and throughput in existing services.

## Instructions

1. **Confirm the JDK baseline before choosing features** because records (JDK 16), sealed classes (JDK 17), pattern matching in switch (JDK 21), and virtual threads (JDK 21) have different minimum versions. Check the project's `java.toolchain.languageVersion` in Gradle or `maven.compiler.release` in Maven. Do not use preview features in production unless the team has explicitly opted in.

2. **Use records for immutable data carriers** because they eliminate boilerplate for DTOs, API responses, events, and value objects. Records provide `equals()`, `hashCode()`, `toString()`, and a canonical constructor automatically. Use compact constructors for validation (`public MyRecord { Objects.requireNonNull(name); }`). Do not use records for entities with mutable state or identity semantics because records are value types.

3. **Model closed domain hierarchies with sealed classes and interfaces** because they enable exhaustive pattern matching and make illegal states unrepresentable. Define the permitted subtypes in the `permits` clause. Use records as the leaf types for data-carrying variants. Combine with switch pattern matching to eliminate visitor pattern and instanceof chains.

4. **Use pattern matching in switch expressions for type-safe dispatch** because it replaces unsafe casting and nested instanceof checks with compiler-verified exhaustiveness. Use guarded patterns (`case Rectangle r when r.area() > 100`) for conditional logic. Always handle the default case or ensure exhaustiveness via sealed types. Do not mix pattern matching with null checks outside the switch because `case null` is supported directly.

5. **Adopt virtual threads for blocking I/O workloads** because they allow millions of concurrent tasks without the memory overhead of platform threads. Use `Executors.newVirtualThreadPerTaskExecutor()` for HTTP clients, database queries, and file I/O. Do not use virtual threads for CPU-bound computation because they share carrier threads and cause starvation. Replace `synchronized` blocks with `ReentrantLock` in virtual-thread code because `synchronized` pins the carrier thread.

6. **Use structured concurrency for task lifecycle management** because it ensures child tasks are joined, cancelled, and error-propagated deterministically. Use `StructuredTaskScope.ShutdownOnFailure` when any subtask failure should cancel siblings. Use `StructuredTaskScope.ShutdownOnSuccess` for first-success racing. Always call `scope.join()` followed by `scope.throwIfFailed()` inside a try-with-resources.

7. **Handle nulls explicitly at API boundaries** because null pointer exceptions are the most common Java runtime error. Use `Optional<T>` for return types that may legitimately have no value. Never use `Optional` as a field type or method parameter because it wastes memory and complicates serialization. Use `@Nullable` and `@NonNull` annotations from JSpecify. Fail fast with `Objects.requireNonNull()` at public method entry points.

8. **Separate domain, service, and infrastructure layers** because tight coupling between HTTP transport, business logic, and persistence makes testing and evolution expensive. Define domain types as records and sealed interfaces. Keep service interfaces free of framework annotations. Map between transport DTOs and domain types at controller boundaries. Never expose JPA entities directly in API responses.

9. **Design APIs with clear contracts and defensive boundaries** because internal implementation changes should not break consumers. Use `List.of()`, `Map.of()`, and `Set.of()` factory methods for unmodifiable collections in API returns. Document nullability in Javadoc. Use `@JsonProperty` only when the serialized name differs from the field name. Version APIs explicitly in the URL path or header.

10. **Write tests with JUnit 5 idioms and real dependencies where feasible** because mocking everything hides integration bugs. Use `@ParameterizedTest` with `@MethodSource` or `@CsvSource` for data-driven testing. Use Testcontainers for database and message broker integration tests. Use `@Nested` classes to group related test scenarios. Test sealed hierarchies exhaustively by writing cases for every permitted subtype.

11. **Configure builds for reproducibility and speed** because flaky or slow builds erode developer productivity. In Gradle, use version catalogs (`libs.versions.toml`) for dependency management. Enable build cache and configuration cache. In Maven, use `maven-enforcer-plugin` to pin dependency versions. Lock dependency versions in CI with `--write-locks` (Gradle) or `dependency:resolve` (Maven). Run `jdeps` to detect split packages and illegal reflective access.

12. **Profile and tune with JDK tooling before optimizing code** because premature optimization obscures intent. Use `jcmd <pid> JFR.start` for production-safe flight recording. Use `async-profiler` for CPU and allocation flame graphs. Use `-Xlog:gc*` for GC diagnostics. Prefer G1GC for general workloads and ZGC for latency-sensitive services. Right-size heap with `-Xmx` based on profiling data, not guessing.

13. **Use the Stream API for declarative collection processing** because it expresses intent more clearly than manual loops and enables parallel execution. Prefer method references over lambdas when unambiguous. Use `Collectors.toUnmodifiableList()` for immutable results. Use `Stream.toList()` (JDK 16+) for the common case. Do not use parallel streams for I/O-bound work or small collections because the overhead exceeds the benefit.

14. **Adopt text blocks and string templates for readability** because multi-line string literals with concatenation are error-prone. Use text blocks (`"""..."""`) for SQL queries, JSON templates, and log messages. Align the closing `"""` to control indentation stripping. Use `String.formatted()` or `MessageFormat` for parameterized strings.

15. **Enforce code quality in CI with static analysis** because catching issues at compile time is cheaper than in production. Use ErrorProne for bug detection at compile time. Use SpotBugs or PMD for additional static checks. Use Checkstyle or the Google Java Format plugin for consistent style. Run `javac` with `-Xlint:all` to catch deprecation and unchecked warnings.

16. **Log structurally with correlation IDs** because grep-based log analysis breaks at scale. Use SLF4J with Logback or Log4j2 as the backend. Include request/trace IDs via MDC (Mapped Diagnostic Context). Use structured JSON logging in production. Do not log sensitive data (passwords, tokens, PII). Do not use `System.out.println` or `e.printStackTrace()` because they bypass the logging framework.

## Output Format

Produces Java code using records, sealed types, pattern matching switch expressions, and virtual threads where applicable. Code follows explicit null handling with Optional returns, layer-separated architecture, and JUnit 5 test patterns. Includes structured logging and defensive API boundaries.

## References

| File | Load when |
| --- | --- |
| `references/modern-java.md` | Records, sealed classes, pattern matching, text blocks, or new JDK API usage needs detail. |
| `references/concurrency.md` | Virtual threads, structured concurrency, carrier pinning, or thread pool migration. |
| `references/testing.md` | JUnit 5 patterns, parameterized tests, Testcontainers, or test architecture decisions. |
| `references/build-systems.md` | Gradle or Maven configuration, dependency management, or CI build optimization. |
| `references/api-design.md` | REST API contracts, DTO mapping, versioning, or serialization strategy. |

## Copilot Platform Notes

- Custom agents are defined in `.github/agents/*.md` with YAML frontmatter: `name`, `description`, `tools`, `model`, `handoffs`.
- Agent `handoffs` field enables guided workflow transitions (e.g., `@project-planner` → `@orchestrator`).
- Skill files are stored under `.github/skills/` (skill markdown) and `.github/prompts/` (prompt files).
- Path-scoped instructions in `.github/instructions/*.instructions.md` provide file-pattern-targeted guidance via `applyTo` frontmatter.
- User arguments are provided as natural language input in the prompt, not through a `$ARGUMENTS` variable.
- Frontmatter keys `context: fork` and `allowed-tools` are not natively supported; guidance is advisory.
- Reference files can be included via `#file:references/<name>.md` syntax in Copilot Chat.
- MCP configuration lives in `.vscode/mcp.json`. MCP skill tools are available when configured.
- Rules file: `.github/copilot-instructions.md` — broad and stable, not task-specific.
