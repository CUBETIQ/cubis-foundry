# Spring Boot Skill Assertions

## Eval 1: Secure REST API with Spring Security

| # | Assertion | Type | Expected Value | Rationale |
|---|-----------|------|----------------|-----------|
| 1 | Defines SecurityFilterChain | contains | `SecurityFilterChain` | Spring Security 6 requires a SecurityFilterChain bean with the lambda DSL; the removed WebSecurityConfigurerAdapter pattern will not compile. |
| 2 | Uses Java records | contains | `record ` | DTO types must use Java records for immutability, automatic equals/hashCode/toString, and clear signaling that the type carries data without behavior. |
| 3 | Uses @PreAuthorize | contains | `@PreAuthorize` | Method-level authorization must use @PreAuthorize with SpEL expressions for domain-level access rules that URL-pattern matching cannot express. |
| 4 | Uses MockMvc | contains | `MockMvc` | Controller tests must use MockMvc to exercise the full filter chain including security, content negotiation, and exception handling. |
| 5 | Uses @WebMvcTest | contains | `@WebMvcTest` | Slice tests must use @WebMvcTest to load only the web layer, avoiding the startup cost and complexity of the full application context. |

## Eval 2: Reactive WebFlux Endpoint

| # | Assertion | Type | Expected Value | Rationale |
|---|-----------|------|----------------|-----------|
| 1 | Returns Flux | contains | `Flux<` | Streaming reactive endpoints must return Flux to emit multiple values over time, enabling Server-Sent Events and backpressure-aware data flow. |
| 2 | Uses WebClient | contains | `WebClient` | Non-blocking HTTP calls to external services must use WebClient, which integrates with the reactive pipeline without blocking carrier threads. |
| 3 | Defines SecurityWebFilterChain | contains | `SecurityWebFilterChain` | Reactive applications must use SecurityWebFilterChain instead of the servlet-based SecurityFilterChain for compatibility with the Netty runtime. |
| 4 | Uses WebTestClient | contains | `WebTestClient` | Reactive endpoint tests must use WebTestClient, which supports streaming assertions and reactive security testing that MockMvc cannot handle. |
| 5 | Produces TEXT_EVENT_STREAM | contains | `TEXT_EVENT_STREAM` | SSE endpoints must declare the TEXT_EVENT_STREAM media type so clients receive a proper event stream with keep-alive semantics. |
