# Modules and Dependency Injection

## Module Architecture

NestJS applications are organized as a tree of modules. Each module encapsulates a cohesive set of providers, controllers, and imports.

### Module Definition Pattern

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([User])],  // Other modules this module depends on
  controllers: [UsersController],                // Request handlers registered in this module
  providers: [UsersService, UsersRepository],    // Injectable providers scoped to this module
  exports: [UsersService],                       // Providers available to importing modules
})
export class UsersModule {}
```

- Only exported providers are visible outside the module. Attempting to inject a non-exported provider from another module causes a runtime error.
- Controllers are never exported. They are automatically registered with the HTTP adapter.

### Module Types

| Type | Created With | Use Case |
|------|-------------|----------|
| Feature Module | `@Module({...})` | Encapsulate a domain feature (users, orders, products) |
| Dynamic Module | `static forRoot()` / `forRootAsync()` | Configurable modules with runtime options (database, config) |
| Global Module | `@Global()` + `@Module({...})` | Shared utilities available everywhere without importing |

### Dynamic Module Pattern

```typescript
@Module({})
export class DatabaseModule {
  static forRoot(options: DatabaseOptions): DynamicModule {
    return {
      module: DatabaseModule,
      global: true,
      providers: [
        { provide: 'DATABASE_OPTIONS', useValue: options },
        DatabaseService,
      ],
      exports: [DatabaseService],
    };
  }

  static forRootAsync(options: DatabaseAsyncOptions): DynamicModule {
    return {
      module: DatabaseModule,
      global: true,
      imports: options.imports || [],
      providers: [
        {
          provide: 'DATABASE_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        DatabaseService,
      ],
      exports: [DatabaseService],
    };
  }
}
```

## Dependency Injection

### Provider Types

```typescript
// Standard class provider
{ provide: UsersService, useClass: UsersService }  // shorthand: just list UsersService

// Value provider
{ provide: 'API_KEY', useValue: process.env.API_KEY }

// Factory provider
{
  provide: 'ASYNC_CONNECTION',
  useFactory: async (configService: ConfigService) => {
    const config = configService.get('database');
    return createConnection(config);
  },
  inject: [ConfigService],
}

// Alias provider
{ provide: 'LOGGER', useExisting: WinstonLoggerService }
```

### Injection Scopes

| Scope | Lifecycle | Use Case |
|-------|-----------|----------|
| `DEFAULT` (Singleton) | Created once, shared across all requests | Stateless services, database connections |
| `REQUEST` | New instance per HTTP request | Request-specific state, multi-tenant context |
| `TRANSIENT` | New instance per injection | Stateful utility classes, unique logger instances |

```typescript
@Injectable({ scope: Scope.REQUEST })
export class RequestContextService {
  constructor(@Inject(REQUEST) private readonly request: Request) {}
}
```

- REQUEST-scoped providers bubble up: if ServiceA (singleton) depends on ServiceB (request-scoped), ServiceA also becomes request-scoped.
- Avoid request scope unless necessary. It disables singleton caching and increases GC pressure.

### Circular Dependency Resolution

```typescript
// PREFERRED: refactor to eliminate the cycle
// Extract shared logic into a third service that both depend on

// LAST RESORT: forward reference
@Injectable()
export class CatsService {
  constructor(
    @Inject(forwardRef(() => DogsService))
    private readonly dogsService: DogsService,
  ) {}
}
```

Forward references should be temporary. Refactor circular dependencies by extracting a shared module or using events.

## Async Module Initialization

```typescript
// Modules can implement OnModuleInit for async setup
@Module({ providers: [CacheService] })
export class CacheModule implements OnModuleInit {
  constructor(private readonly cacheService: CacheService) {}

  async onModuleInit() {
    await this.cacheService.connect();
  }
}
```

## ConfigModule Integration

```typescript
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().uri().required(),
        JWT_SECRET: Joi.string().min(32).required(),
        PORT: Joi.number().default(3000),
      }),
      validationOptions: { abortEarly: true },
    }),
  ],
})
export class AppModule {}
```

- `isGlobal: true` makes ConfigService available in all modules without importing ConfigModule.
- Validation runs at bootstrap. Missing or invalid variables crash the app immediately with a descriptive error.
