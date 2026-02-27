# NestJS OpenAPI Guidance

## Core Patterns

- Use `@nestjs/swagger` decorators for schemas and routes
- Use DTO classes with `@ApiProperty()`
- Set `@ApiTags()` per controller
- Use `@ApiBearerAuth()` or `@ApiSecurity()` for API keys

## Example Checklist

- Create DTOs for create/update responses
- Add `@ApiResponse()` for 200/201/400/401/403/404/500
- Use `@ApiHeader()` for required headers
- Generate spec via `SwaggerModule.createDocument()`

## Notes

- Keep DTO validation (class-validator) aligned with docs
- Export `/openapi.json` and mount UI (Stoplight or Swagger)
