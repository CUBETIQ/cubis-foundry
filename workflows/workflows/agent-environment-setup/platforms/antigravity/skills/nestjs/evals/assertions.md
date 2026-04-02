# NestJS Skill Assertions

## Eval 1: Modular API with Guards

| # | Assertion | Type | Expected Value | Rationale |
|---|-----------|------|----------------|-----------|
| 1 | Uses @Module() decorator | contains | `@Module(` | NestJS applications must define feature modules with explicit imports, providers, controllers, and exports arrays for dependency injection scoping. |
| 2 | Implements CanActivate | contains | `CanActivate` | Authentication and authorization guards must implement the CanActivate interface to integrate with the NestJS guard lifecycle. |
| 3 | Applies @UseGuards() | contains | `@UseGuards(` | Guards must be attached to controllers or handlers via @UseGuards() to execute before the route handler in the request pipeline. |
| 4 | Uses ValidationPipe | contains | `ValidationPipe` | The global ValidationPipe activates class-validator decorators on DTOs, providing runtime type safety that TypeScript alone cannot enforce. |
| 5 | Marks with @Injectable() | contains | `@Injectable()` | All providers (services, guards, interceptors) must be decorated with @Injectable() to participate in the dependency injection container. |

## Eval 2: Microservice Communication

| # | Assertion | Type | Expected Value | Rationale |
|---|-----------|------|----------------|-----------|
| 1 | Uses ClientsModule | contains | `ClientsModule` | Microservice clients must be registered via ClientsModule to configure transport, connection options, and serialization for inter-service communication. |
| 2 | Uses @MessagePattern() | contains | `@MessagePattern(` | Request-response microservice handlers must use @MessagePattern() so the transport layer knows to wait for and forward the response. |
| 3 | Uses @EventPattern() | contains | `@EventPattern(` | Event-driven handlers must use @EventPattern() to signal fire-and-forget semantics; mixing with @MessagePattern() causes acknowledgment mismatches. |
| 4 | Specifies Transport enum | contains | `Transport.` | The transport layer (TCP, Redis, NATS, Kafka) must be explicitly specified to configure connection parameters and serialization strategy. |
| 5 | Calls connectMicroservice() | contains | `connectMicroservice` | Hybrid applications serving both HTTP and microservice traffic must call connectMicroservice() to bind the transport listener alongside the HTTP server. |
