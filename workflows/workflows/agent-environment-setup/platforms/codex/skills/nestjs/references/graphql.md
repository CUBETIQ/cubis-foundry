# GraphQL

## Code-First vs. Schema-First

| Approach | When to Use | Tradeoff |
|----------|-------------|----------|
| Code-First | TypeScript-native teams, rapid iteration | Schema is generated from decorators; no manual SDL maintenance |
| Schema-First | Schema-driven contracts, cross-team APIs | SDL is the source of truth; TypeScript types are generated from it |

NestJS supports both. Code-first is recommended for most projects because it eliminates schema-code drift.

## Code-First Setup

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      context: ({ req }) => ({ req }),  // Pass request to resolvers for auth
    }),
  ],
})
export class AppModule {}
```

## Object Types

```typescript
import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class Product {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Float)
  price: number;

  @Field(() => Int)
  stockQuantity: number;

  @Field()
  createdAt: Date;

  @Field(() => [Review], { nullable: 'items' })
  reviews?: Review[];
}

@ObjectType()
export class Review {
  @Field(() => ID)
  id: string;

  @Field(() => Int, { description: 'Rating from 1 to 5' })
  rating: number;

  @Field({ nullable: true })
  comment?: string;

  @Field()
  authorName: string;
}
```

## Input Types

```typescript
import { InputType, Field, Float, Int } from '@nestjs/graphql';
import { IsString, MinLength, MaxLength, IsPositive, IsOptional, Min, Max } from 'class-validator';

@InputType()
export class CreateProductInput {
  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @Field(() => Float)
  @IsPositive()
  price: number;

  @Field(() => Int)
  @IsPositive()
  stockQuantity: number;
}

@InputType()
export class ProductFilterInput {
  @Field({ nullable: true })
  nameContains?: string;

  @Field(() => Float, { nullable: true })
  minPrice?: number;

  @Field(() => Float, { nullable: true })
  maxPrice?: number;

  @Field(() => Int, { defaultValue: 20 })
  @Min(1)
  @Max(100)
  limit: number;

  @Field({ nullable: true })
  cursor?: string;
}
```

## Resolvers

```typescript
import { Resolver, Query, Mutation, Args, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Product } from './product.type';
import { CreateProductInput, ProductFilterInput } from './product.input';
import { ProductService } from './product.service';
import { ReviewService } from '../reviews/review.service';

@Resolver(() => Product)
export class ProductResolver {
  constructor(
    private readonly productService: ProductService,
    private readonly reviewService: ReviewService,
  ) {}

  @Query(() => [Product], { name: 'products' })
  async findAll(@Args('filter', { nullable: true }) filter?: ProductFilterInput) {
    return this.productService.findAll(filter);
  }

  @Query(() => Product, { name: 'product' })
  async findOne(@Args('id') id: string) {
    return this.productService.findOne(id);
  }

  @Mutation(() => Product)
  @UseGuards(GqlAuthGuard)
  async createProduct(
    @Args('input') input: CreateProductInput,
    @CurrentUser() user: any,
  ) {
    return this.productService.create(input, user.id);
  }

  // Resolve reviews field lazily to avoid N+1
  @ResolveField(() => [Review])
  async reviews(@Parent() product: Product) {
    return this.reviewService.findByProductId(product.id);
  }
}
```

## DataLoader for N+1 Prevention

The `@ResolveField` above causes one database query per product when resolving reviews. DataLoader batches these into a single query.

```typescript
// reviews/reviews.loader.ts
import * as DataLoader from 'dataloader';
import { Injectable, Scope } from '@nestjs/common';
import { ReviewService } from './review.service';
import { Review } from './review.entity';

@Injectable({ scope: Scope.REQUEST })
export class ReviewsLoader {
  constructor(private readonly reviewService: ReviewService) {}

  readonly batchByProductId = new DataLoader<string, Review[]>(
    async (productIds: readonly string[]) => {
      const reviews = await this.reviewService.findByProductIds([...productIds]);
      const reviewMap = new Map<string, Review[]>();
      for (const review of reviews) {
        const list = reviewMap.get(review.productId) || [];
        list.push(review);
        reviewMap.set(review.productId, list);
      }
      return productIds.map((id) => reviewMap.get(id) || []);
    },
  );
}

// In resolver:
@ResolveField(() => [Review])
async reviews(@Parent() product: Product) {
  return this.reviewsLoader.batchByProductId.load(product.id);
}
```

DataLoader must be REQUEST-scoped to prevent cache leakage across requests.

## GraphQL Authentication Guard

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class GqlAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return false;

    try {
      req.user = await this.jwtService.verifyAsync(token);
      return true;
    } catch {
      return false;
    }
  }
}
```

## Subscriptions

```typescript
import { Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';

const pubSub = new PubSub();

@Resolver()
export class NotificationResolver {
  @Subscription(() => Product, {
    filter: (payload, variables) =>
      payload.productUpdated.id === variables.productId,
  })
  productUpdated(@Args('productId') productId: string) {
    return pubSub.asyncIterableIterator('productUpdated');
  }
}

// In service, publish events:
await pubSub.publish('productUpdated', { productUpdated: updatedProduct });
```

For production, replace `PubSub` with a distributed implementation like `graphql-redis-subscriptions`.

## Pagination Pattern

```typescript
@ObjectType()
export class ProductConnection {
  @Field(() => [ProductEdge])
  edges: ProductEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;
}

@ObjectType()
export class ProductEdge {
  @Field(() => Product)
  node: Product;

  @Field()
  cursor: string;
}

@ObjectType()
export class PageInfo {
  @Field()
  hasNextPage: boolean;

  @Field({ nullable: true })
  endCursor?: string;
}
```

Relay-style cursor pagination is the recommended pattern for GraphQL APIs. It provides stable pagination under concurrent writes.

## Testing GraphQL Resolvers

```typescript
import { Test } from '@nestjs/testing';
import { ProductResolver } from './product.resolver';
import { ProductService } from './product.service';

describe('ProductResolver', () => {
  let resolver: ProductResolver;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProductResolver,
        {
          provide: ProductService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([{ id: '1', name: 'Widget' }]),
            findOne: jest.fn().mockResolvedValue({ id: '1', name: 'Widget' }),
            create: jest.fn().mockResolvedValue({ id: '1', name: 'Widget' }),
          },
        },
        {
          provide: ReviewService,
          useValue: { findByProductId: jest.fn().mockResolvedValue([]) },
        },
      ],
    }).compile();

    resolver = module.get(ProductResolver);
  });

  it('returns all products', async () => {
    const result = await resolver.findAll();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Widget');
  });
});
```
