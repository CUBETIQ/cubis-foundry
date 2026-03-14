# Microservices

## Transport Layers

NestJS supports multiple transport mechanisms for inter-service communication. Each transport has different characteristics for reliability, throughput, and message ordering.

| Transport | Protocol | Use Case | Message Ordering | At-Least-Once |
|-----------|----------|----------|-----------------|---------------|
| TCP | Custom binary | Low-latency, same datacenter | Per-connection | No (best-effort) |
| Redis | Pub/Sub | Simple event fan-out | No | No |
| NATS | NATS protocol | Cloud-native, request-reply | Per-subject | Optional (JetStream) |
| Kafka | Kafka protocol | High-throughput event streaming | Per-partition | Yes |
| gRPC | HTTP/2 + Protobuf | Cross-language, schema-first | Per-stream | Depends on implementation |
| RabbitMQ | AMQP | Complex routing, dead-letter queues | Per-queue | Yes |

## Microservice Bootstrap

### Standalone Microservice

```typescript
// main.ts (OrderService)
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { OrderModule } from './order.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(OrderModule, {
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port: 3001 },
  });
  await app.listen();
}
bootstrap();
```

### Hybrid Application (HTTP + Microservice)

```typescript
// main.ts (API Gateway)
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { GatewayModule } from './gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);

  // Add TCP microservice listener
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port: 3002 },
  });

  // Add Kafka consumer
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: { brokers: ['kafka:9092'] },
      consumer: { groupId: 'gateway-group' },
    },
  });

  await app.startAllMicroservices();
  await app.listen(3000);
}
bootstrap();
```

## Client Registration

```typescript
// gateway.module.ts
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'ORDER_SERVICE',
        transport: Transport.TCP,
        options: { host: 'order-service', port: 3001 },
      },
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: { brokers: ['kafka:9092'] },
          consumer: { groupId: 'gateway-notifications' },
        },
      },
    ]),
  ],
})
export class GatewayModule {}
```

### Async Client Registration

```typescript
ClientsModule.registerAsync([
  {
    name: 'ORDER_SERVICE',
    imports: [ConfigModule],
    useFactory: (config: ConfigService) => ({
      transport: Transport.TCP,
      options: {
        host: config.get('ORDER_SERVICE_HOST'),
        port: config.get('ORDER_SERVICE_PORT'),
      },
    }),
    inject: [ConfigService],
  },
]);
```

## Message Patterns

### Request-Response (@MessagePattern)

The sender waits for a response. Used for queries and commands that need confirmation.

```typescript
// ORDER SERVICE: handler
@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @MessagePattern('order.create')
  async createOrder(@Payload() data: CreateOrderDto, @Ctx() context: TcpContext) {
    return this.orderService.create(data);
  }

  @MessagePattern({ cmd: 'get_order' })  // Object pattern for complex routing
  async getOrder(@Payload() data: { id: string }) {
    return this.orderService.findOne(data.id);
  }
}

// GATEWAY: sender
@Injectable()
export class OrderGatewayService {
  constructor(@Inject('ORDER_SERVICE') private readonly client: ClientProxy) {}

  async createOrder(dto: CreateOrderDto) {
    // client.send() returns an Observable; convert to Promise
    return firstValueFrom(this.client.send('order.create', dto));
  }
}
```

### Fire-and-Forget (@EventPattern)

The sender does not wait for a response. Used for notifications, audit logs, analytics.

```typescript
// NOTIFICATION SERVICE: handler
@Controller()
export class NotificationController {
  @EventPattern('order.created')
  async handleOrderCreated(@Payload() data: OrderCreatedEvent) {
    await this.notificationService.sendOrderConfirmation(data);
  }
}

// ORDER SERVICE: emitter
@Injectable()
export class OrderService {
  constructor(@Inject('NOTIFICATION_SERVICE') private readonly client: ClientProxy) {}

  async create(dto: CreateOrderDto): Promise<Order> {
    const order = await this.orderRepo.save(dto);
    // emit() does not wait for a response
    this.client.emit('order.created', {
      orderId: order.id,
      customerId: order.customerId,
      total: order.total,
    });
    return order;
  }
}
```

## Serialization

### Custom Serializer

```typescript
import { Serializer, OutgoingResponse } from '@nestjs/microservices';

export class CustomSerializer implements Serializer {
  serialize(value: any): OutgoingResponse {
    // Add metadata envelope
    return {
      data: value,
      timestamp: Date.now(),
      version: '1.0',
    };
  }
}

// Register on client
ClientsModule.register([
  {
    name: 'ORDER_SERVICE',
    transport: Transport.TCP,
    options: {
      host: 'order-service',
      port: 3001,
      serializer: new CustomSerializer(),
    },
  },
]);
```

## Error Handling in Microservices

```typescript
import { RpcException } from '@nestjs/microservices';

@MessagePattern('order.create')
async createOrder(@Payload() data: CreateOrderDto) {
  try {
    return await this.orderService.create(data);
  } catch (error) {
    // RpcException is transported back to the caller
    throw new RpcException({
      statusCode: 400,
      message: error.message,
    });
  }
}
```

### Exception Filter for Microservices

```typescript
import { Catch, RpcExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

@Catch(RpcException)
export class AllRpcExceptionsFilter implements RpcExceptionFilter<RpcException> {
  catch(exception: RpcException, host: ArgumentsHost): Observable<any> {
    return throwError(() => exception.getError());
  }
}
```

## Health Checks

```typescript
import { Controller, Get } from '@nestjs/common';
import { Transport, MicroserviceHealthIndicator } from '@nestjs/microservices';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private microservice: MicroserviceHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.microservice.pingCheck('order-service', {
        transport: Transport.TCP,
        options: { host: 'order-service', port: 3001 },
      }),
    ]);
  }
}
```
