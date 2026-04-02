# Example: Microservice with Event-Driven Communication and GraphQL Gateway

## Scenario

A team is building an e-commerce platform with NestJS microservices. The API Gateway serves GraphQL to the frontend and communicates with an OrderService over TCP transport. When an order is created, OrderService emits an `order_created` event that a NotificationService consumes. The gateway needs to aggregate data from multiple services in a single GraphQL query.

## Prompt

"Set up a NestJS microservices architecture with a GraphQL API Gateway, an OrderService using TCP transport, and event-driven notification. The gateway should proxy order creation to OrderService and aggregate order data in a GraphQL resolver. OrderService should emit events for created orders. Show the hybrid application bootstrap, transport configuration, and GraphQL resolver."

## Expected Output

### API Gateway Bootstrap (Hybrid Application)

```typescript
// apps/gateway/src/main.ts
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { GatewayModule } from './gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);

  // Connect microservice transport for receiving events
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port: 3001 },
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  await app.startAllMicroservices();
  await app.listen(3000);
}
bootstrap();
```

### Gateway Module with ClientsModule

```typescript
// apps/gateway/src/gateway.module.ts
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OrderResolver } from './resolvers/order.resolver';
import { OrderGatewayService } from './services/order-gateway.service';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: process.env.NODE_ENV !== 'production',
    }),
    ClientsModule.register([
      {
        name: 'ORDER_SERVICE',
        transport: Transport.TCP,
        options: { host: 'order-service', port: 3002 },
      },
    ]),
  ],
  providers: [OrderResolver, OrderGatewayService],
})
export class GatewayModule {}
```

### GraphQL Types and Resolver

```typescript
// apps/gateway/src/resolvers/order.resolver.ts
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { OrderGatewayService } from '../services/order-gateway.service';
import { OrderType } from '../types/order.type';
import { CreateOrderInput } from '../inputs/create-order.input';

@Resolver(() => OrderType)
@UseGuards(GqlAuthGuard)
export class OrderResolver {
  constructor(private readonly orderService: OrderGatewayService) {}

  @Query(() => [OrderType], { name: 'orders' })
  async findAll(): Promise<OrderType[]> {
    return this.orderService.findAll();
  }

  @Query(() => OrderType, { name: 'order' })
  async findOne(@Args('id') id: string): Promise<OrderType> {
    return this.orderService.findOne(id);
  }

  @Mutation(() => OrderType)
  async createOrder(@Args('input') input: CreateOrderInput): Promise<OrderType> {
    return this.orderService.create(input);
  }
}
```

```typescript
// apps/gateway/src/types/order.type.ts
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
export class OrderType {
  @Field(() => ID)
  id: string;

  @Field()
  customerId: string;

  @Field(() => Float)
  total: number;

  @Field()
  status: string;

  @Field()
  createdAt: Date;
}
```

### Gateway Service (ClientProxy Communication)

```typescript
// apps/gateway/src/services/order-gateway.service.ts
import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateOrderInput } from '../inputs/create-order.input';

@Injectable()
export class OrderGatewayService implements OnModuleInit {
  constructor(@Inject('ORDER_SERVICE') private readonly client: ClientProxy) {}

  async onModuleInit() {
    await this.client.connect();
  }

  async findAll() {
    return firstValueFrom(this.client.send('order.find_all', {}));
  }

  async findOne(id: string) {
    return firstValueFrom(this.client.send('order.find_one', { id }));
  }

  async create(input: CreateOrderInput) {
    return firstValueFrom(this.client.send('order.create', input));
  }
}
```

### OrderService Message Handlers

```typescript
// apps/order-service/src/orders/orders.controller.ts
import { Controller } from '@nestjs/common';
import { MessagePattern, EventPattern, Payload, Ctx, TcpContext } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('order.find_all')
  async findAll() {
    return this.ordersService.findAll();
  }

  @MessagePattern('order.find_one')
  async findOne(@Payload() data: { id: string }) {
    return this.ordersService.findOne(data.id);
  }

  @MessagePattern('order.create')
  async create(@Payload() data: CreateOrderDto) {
    const order = await this.ordersService.create(data);
    // Emit event for downstream consumers
    this.ordersService.emitOrderCreated(order);
    return order;
  }

  @EventPattern('order_created')
  async handleOrderCreated(@Payload() data: any) {
    // This handler exists on services that consume the event
    console.log('Order created event received:', data.id);
  }
}
```

### OrderService with Event Emission

```typescript
// apps/order-service/src/orders/orders.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy,
  ) {}

  async findAll(): Promise<Order[]> {
    return this.orderRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Order> {
    return this.orderRepo.findOneOrFail({ where: { id } });
  }

  async create(dto: CreateOrderDto): Promise<Order> {
    const order = this.orderRepo.create(dto);
    return this.orderRepo.save(order);
  }

  emitOrderCreated(order: Order): void {
    this.notificationClient.emit('order_created', {
      id: order.id,
      customerId: order.customerId,
      total: order.total,
      createdAt: order.createdAt,
    });
  }
}
```

### Unit Test for Gateway Service

```typescript
// apps/gateway/src/services/order-gateway.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { OrderGatewayService } from './order-gateway.service';

describe('OrderGatewayService', () => {
  let service: OrderGatewayService;
  const mockClientProxy = {
    connect: jest.fn(),
    send: jest.fn(),
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderGatewayService,
        { provide: 'ORDER_SERVICE', useValue: mockClientProxy },
      ],
    }).compile();

    service = module.get<OrderGatewayService>(OrderGatewayService);
  });

  it('should send create message and return order', async () => {
    const input = { customerId: 'cust-1', items: [{ productId: 'p-1', quantity: 2 }] };
    const expected = { id: 'order-1', ...input, status: 'PENDING' };
    mockClientProxy.send.mockReturnValue(of(expected));

    const result = await service.create(input as any);

    expect(mockClientProxy.send).toHaveBeenCalledWith('order.create', input);
    expect(result).toEqual(expected);
  });
});
```

## Key Decisions

- **Hybrid application** -- the gateway serves HTTP/GraphQL and also connects a microservice transport for receiving events from other services.
- **`firstValueFrom` for ClientProxy** -- converts the Observable returned by `client.send()` into a Promise, making it compatible with async/await in resolvers.
- **`@MessagePattern` for request-response, `@EventPattern` for fire-and-forget** -- ensures message acknowledgment semantics match the communication intent.
- **GraphQL code-first with `autoSchemaFile: true`** -- generates the SDL from TypeScript decorators, keeping types and schema in sync.
- **Service-level event emission** -- the service emits events after database persistence, not the controller, ensuring events are only sent for successfully saved orders.
