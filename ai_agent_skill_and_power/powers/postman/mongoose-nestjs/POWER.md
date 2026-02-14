---
name: mongoose-nestjs
displayName: Mongoose NestJS
description: Mongoose integration with NestJS including schema design, repository pattern, transactions, migrations, and multi-tenancy. Use for MongoDB database layer implementation.
keywords:
  - Mongoose
  - MongoDB
  - NestJS Mongoose
  - schema
  - repository pattern
  - transactions
  - ODM
author: OneUp
---

# Mongoose NestJS

## Overview

Expert guidance for integrating Mongoose with NestJS applications. Covers schema design, repository pattern implementation, transaction handling, data migrations, and multi-tenant architecture patterns.

## Role Definition

You are a database specialist with deep expertise in MongoDB and Mongoose ODM. You design efficient schemas, implement clean repository abstractions, and ensure data integrity through proper transaction handling.

## When to Use This Power

- Designing Mongoose schemas for NestJS
- Implementing repository pattern with Mongoose
- Handling MongoDB transactions
- Creating database migrations
- Setting up multi-tenant data isolation
- Optimizing Mongoose queries

## Core Workflow

1. **Design Schema** - Define document structure with proper types and indexes
2. **Create Repository** - Implement data access layer with base repository
3. **Add Transactions** - Wrap critical operations in transactions
4. **Write Migrations** - Version schema changes
5. **Test** - Verify data integrity and performance

## Available Steering Files

| Topic              | Reference                        | Load When                                      |
| ------------------ | -------------------------------- | ---------------------------------------------- |
| Schema Design      | `steering/schema-design.md`      | Creating schemas, indexes, virtuals, hooks     |
| Repository Pattern | `steering/repository-pattern.md` | Base repository, custom queries, pagination    |
| Transactions       | `steering/transactions.md`       | ACID operations, retry logic, session handling |
| Migrations         | `steering/migrations.md`         | Schema versioning, data migrations             |

## Quick Reference

### Module Setup

```typescript
// app.module.ts
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>("MONGO_URL"),
        // Connection options
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

### Schema Definition

```typescript
// user.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  collection: "users",
})
export class User {
  @Prop({ required: true, unique: true, index: true })
  username: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: true, index: true })
  organizationId: string;

  @Prop({ type: String, enum: ["SUPER_ADMIN", "ADMIN", "STAFF"] })
  role: string;

  @Prop({ default: true })
  enabled: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add indexes
UserSchema.index({ organizationId: 1, role: 1 });
UserSchema.index({ username: "text", name: "text" });
```

### Feature Module

```typescript
// users.module.ts
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "./schemas/user.schema";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { UsersRepository } from "./users.repository";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
```

### Repository Pattern

```typescript
// users.repository.ts
import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, ClientSession } from "mongoose";
import { User, UserDocument } from "./schemas/user.schema";

@Injectable()
export class UsersRepository {
  private readonly logger = new Logger(UsersRepository.name);

  constructor(
    @InjectModel(User.name)
    private readonly model: Model<UserDocument>,
  ) {}

  async create(
    data: Partial<User>,
    session?: ClientSession,
  ): Promise<UserDocument> {
    const user = new this.model(data);
    return user.save({ session });
  }

  async findById(
    id: string,
    session?: ClientSession,
  ): Promise<UserDocument | null> {
    return this.model.findById(id).session(session).exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.model.findOne({ username }).select("+password").exec();
  }
}
```

## Constraints

### MUST DO

- Use `@nestjs/mongoose` decorators for schemas
- Implement repository pattern for data access
- Add indexes for frequently queried fields
- Use transactions for multi-document operations
- Handle connection errors gracefully
- Use `lean()` for read-only queries

### MUST NOT DO

- Access Model directly in services (use repository)
- Skip indexes on large collections
- Ignore transaction rollback on errors
- Store sensitive data without encryption
- Use `any` type for document fields

## Schema Design Principles

| Principle          | Description                               |
| ------------------ | ----------------------------------------- |
| Embed vs Reference | Embed for 1:few, reference for 1:many     |
| Denormalization    | Duplicate data for read performance       |
| Indexing           | Index query patterns, not just fields     |
| Validation         | Use Mongoose validators + class-validator |
| Timestamps         | Always enable `timestamps: true`          |

## Related Powers

- **NestJS Expert** - Core NestJS patterns
- **Database Optimizer** - Query optimization
- **Architecture Designer** - Data modeling decisions
