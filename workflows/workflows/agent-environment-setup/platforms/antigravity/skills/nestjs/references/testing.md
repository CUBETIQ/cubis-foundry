# Testing

## Testing Pyramid in NestJS

| Layer | Tool | Scope | Speed |
|-------|------|-------|-------|
| Unit | `Test.createTestingModule()` + Jest mocks | Single provider in isolation | < 50ms |
| Integration | `Test.createTestingModule()` with real providers | Module with real DB/cache | 100-500ms |
| E2E | `supertest` + compiled app | Full HTTP pipeline | 500ms-2s |

## Unit Testing with TestingModule

### Service Unit Test

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('returns a user when found', async () => {
      const user = { id: '1', email: 'test@example.com', name: 'Test User' };
      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.findOne('1');

      expect(result).toEqual(user);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow('User not found');
    });
  });
});
```

### Guard Unit Test

```typescript
import { Test } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: JwtService;

  const mockExecutionContext = (headers: Record<string, string> = {}): ExecutionContext => ({
    switchToHttp: () => ({
      getRequest: () => ({ headers, user: undefined }),
    }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as any);

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
        { provide: Reflector, useValue: { getAllAndOverride: jest.fn().mockReturnValue(false) } },
      ],
    }).compile();

    guard = module.get(JwtAuthGuard);
    jwtService = module.get(JwtService);
  });

  it('throws UnauthorizedException when no token is provided', async () => {
    const context = mockExecutionContext({});
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('allows request with valid token', async () => {
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({ sub: '1', email: 'test@test.com' });
    const context = mockExecutionContext({ authorization: 'Bearer valid-token' });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });
});
```

## E2E Testing with Supertest

### Full Application E2E Test

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Products (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    // Obtain auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'password' });
    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /products creates a product', () => {
    return request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Widget', sku: 'WDG-001', price: 9.99, quantity: 100 })
      .expect(201)
      .expect((res) => {
        expect(res.body.name).toBe('Widget');
        expect(res.body.id).toBeDefined();
      });
  });

  it('POST /products without auth returns 401', () => {
    return request(app.getHttpServer())
      .post('/products')
      .send({ name: 'Widget', sku: 'WDG-001', price: 9.99, quantity: 100 })
      .expect(401);
  });

  it('POST /products with invalid data returns 400', () => {
    return request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: '', price: -1 })
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toEqual(expect.arrayContaining([
          expect.stringContaining('name'),
        ]));
      });
  });

  it('GET /products returns all products', () => {
    return request(app.getHttpServer())
      .get('/products')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });
});
```

## Testing Microservice Handlers

```typescript
import { Test } from '@nestjs/testing';
import { ClientProxy, ClientsModule, Transport } from '@nestjs/microservices';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

describe('OrderController (microservice)', () => {
  let controller: OrderController;
  let service: OrderService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: {
            create: jest.fn().mockResolvedValue({ id: '1', status: 'PENDING' }),
            findOne: jest.fn().mockResolvedValue({ id: '1', status: 'PENDING' }),
          },
        },
      ],
    }).compile();

    controller = module.get(OrderController);
    service = module.get(OrderService);
  });

  it('handles create_order message pattern', async () => {
    const dto = { customerId: 'c-1', items: [{ productId: 'p-1', quantity: 2 }] };
    const result = await controller.createOrder(dto);

    expect(result).toEqual({ id: '1', status: 'PENDING' });
    expect(service.create).toHaveBeenCalledWith(dto);
  });
});
```

## Database Testing Strategies

### In-Memory SQLite for Fast Tests

```typescript
TypeOrmModule.forRoot({
  type: 'sqlite',
  database: ':memory:',
  entities: [User, Product],
  synchronize: true,
  dropSchema: true,
})
```

### Testcontainers for Realistic Tests

```typescript
import { PostgreSqlContainer } from '@testcontainers/postgresql';

let container: any;

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:16').start();

  const module = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'postgres',
        host: container.getHost(),
        port: container.getMappedPort(5432),
        username: container.getUsername(),
        password: container.getPassword(),
        database: container.getDatabase(),
        entities: [User, Product],
        synchronize: true,
      }),
    ],
  }).compile();
});

afterAll(async () => {
  await container.stop();
});
```

## Mocking Strategies

| What to Mock | How | When |
|--------------|-----|------|
| Repository | `useValue: { find: jest.fn(), ... }` | Unit tests isolating business logic |
| External HTTP | `HttpModule` with `nock` or mock `HttpService` | Testing services that call external APIs |
| ConfigService | `useValue: { get: jest.fn().mockReturnValue(...) }` | Testing config-dependent behavior |
| ClientProxy | `useValue: { send: jest.fn().mockReturnValue(of(result)) }` | Testing microservice clients |
| Guards | `overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })` | E2E tests where auth is not the focus |
