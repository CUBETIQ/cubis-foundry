# Example: CRUD Module with Authentication Guard

## Scenario

A team is building an inventory management API with NestJS 11. They need a ProductsModule with full CRUD operations, JWT-based authentication, DTO validation, and proper module organization. Only authenticated users can access the endpoints, and products belong to an organization determined by the JWT claims.

## Prompt

"Create a NestJS ProductsModule with CRUD endpoints. Products have a name, SKU, price, and quantity. Use a JWT AuthGuard to protect all endpoints. Validate incoming data with class-validator DTOs. Scope products by the user's organizationId from the JWT token."

## Expected Output

### DTOs

```typescript
// src/products/dto/create-product.dto.ts
import { IsString, IsNumber, IsPositive, MinLength, MaxLength } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @IsString()
  @MinLength(3)
  @MaxLength(50)
  sku: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @IsNumber()
  @IsPositive()
  quantity: number;
}
```

```typescript
// src/products/dto/update-product.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
```

### Auth Guard

```typescript
// src/auth/guards/jwt-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

### Service

```typescript
// src/products/products.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async findAll(organizationId: string): Promise<Product[]> {
    return this.productRepo.find({ where: { organizationId } });
  }

  async findOne(id: string, organizationId: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id, organizationId },
    });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }

  async create(dto: CreateProductDto, organizationId: string): Promise<Product> {
    const product = this.productRepo.create({ ...dto, organizationId });
    return this.productRepo.save(product);
  }

  async update(id: string, dto: UpdateProductDto, organizationId: string): Promise<Product> {
    const product = await this.findOne(id, organizationId);
    Object.assign(product, dto);
    return this.productRepo.save(product);
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const product = await this.findOne(id, organizationId);
    await this.productRepo.remove(product);
  }
}
```

### Controller

```typescript
// src/products/products.controller.ts
import {
  Controller, Get, Post, Put, Delete,
  Param, Body, UseGuards, Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Request() req) {
    return this.productsService.findAll(req.user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.productsService.findOne(id, req.user.organizationId);
  }

  @Post()
  create(@Body() dto: CreateProductDto, @Request() req) {
    return this.productsService.create(dto, req.user.organizationId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @Request() req) {
    return this.productsService.update(id, dto, req.user.organizationId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.productsService.remove(id, req.user.organizationId);
  }
}
```

### Module

```typescript
// src/products/products.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), AuthModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
```

## Key Decisions

- **Organization scoping via JWT claims** -- avoids passing organizationId as a URL parameter, which would be trivially forgeable.
- **PartialType for update DTO** -- reuses validation rules from CreateProductDto but makes all fields optional for partial updates.
- **Guard at controller level** -- protects all routes without repeating @UseGuards() on each handler.
- **Service throws NotFoundException** -- centralizes not-found checks so the controller stays thin and the error response is consistent.
