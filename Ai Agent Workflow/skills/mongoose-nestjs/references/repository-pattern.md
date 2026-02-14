# Repository Pattern with Mongoose

> Reference for: Mongoose NestJS
> Load when: Base repository, custom queries, pagination, data access layer, CRUD operations

---

## Overview

The repository pattern abstracts data access logic, providing a clean separation between business logic (services) and database operations. This enables easier testing, swappable data sources, and consistent query patterns.

## Architecture

```
Controller → Service → Repository → Mongoose Model
     ↓           ↓           ↓
   HTTP      Business     Data Access
  Mapping     Logic        Layer
```

---

## Base Repository Interface

```typescript
// src/database/repositories/base.repository.interface.ts
import {
  FilterQuery,
  ProjectionType,
  QueryOptions,
  UpdateQuery,
  ClientSession,
} from "mongoose";
import { Document } from "mongoose";

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface IBaseRepository<
  TDocument extends Document,
  CreateDto = Partial<TDocument>,
  UpdateDto = Partial<TDocument>,
> {
  // Create
  create(data: CreateDto, session?: ClientSession): Promise<TDocument>;
  createMany(data: CreateDto[], session?: ClientSession): Promise<TDocument[]>;

  // Read
  findById(
    id: string,
    projection?: ProjectionType<TDocument>,
    session?: ClientSession,
  ): Promise<TDocument | null>;
  findOne(
    filter: FilterQuery<TDocument>,
    session?: ClientSession,
  ): Promise<TDocument | null>;
  findAll(
    filter?: FilterQuery<TDocument>,
    options?: QueryOptions<TDocument>,
  ): Promise<TDocument[]>;
  findPaginated(
    params: PaginationParams,
    filter?: FilterQuery<TDocument>,
  ): Promise<PaginatedResult<TDocument>>;

  // Update
  update(
    id: string,
    data: UpdateDto,
    session?: ClientSession,
  ): Promise<TDocument>;
  updateMany(
    filter: FilterQuery<TDocument>,
    data: UpdateQuery<TDocument>,
    session?: ClientSession,
  ): Promise<number>;

  // Delete
  delete(id: string, session?: ClientSession): Promise<boolean>;
  deleteMany(
    filter: FilterQuery<TDocument>,
    session?: ClientSession,
  ): Promise<number>;

  // Utility
  exists(filter: FilterQuery<TDocument>): Promise<boolean>;
  count(filter?: FilterQuery<TDocument>): Promise<number>;
}
```

---

## Base Repository Implementation

```typescript
// src/database/repositories/base.repository.ts
import { Logger, NotFoundException } from "@nestjs/common";
import {
  Model,
  Document,
  FilterQuery,
  ProjectionType,
  QueryOptions,
  UpdateQuery,
  ClientSession,
} from "mongoose";
import {
  IBaseRepository,
  PaginationParams,
  PaginatedResult,
} from "./base.repository.interface";

export abstract class BaseRepository<
  T extends Document,
  CreateDto = Partial<T>,
  UpdateDto = Partial<T>,
> implements IBaseRepository<T, CreateDto, UpdateDto> {
  protected abstract readonly logger: Logger;
  protected abstract readonly entityName: string;

  constructor(protected readonly model: Model<T>) {}

  // ============ CREATE ============

  async create(data: CreateDto, session?: ClientSession): Promise<T> {
    const entity = new this.model(data);
    return entity.save({ session });
  }

  async createMany(data: CreateDto[], session?: ClientSession): Promise<T[]> {
    return this.model.insertMany(data as any[], { session }) as Promise<T[]>;
  }

  // ============ READ ============

  async findById(
    id: string,
    projection?: ProjectionType<T>,
    session?: ClientSession,
  ): Promise<T | null> {
    return this.model.findById(id, projection).session(session).exec();
  }

  async findByIdOrFail(
    id: string,
    projection?: ProjectionType<T>,
    session?: ClientSession,
  ): Promise<T> {
    const entity = await this.findById(id, projection, session);
    if (!entity) {
      throw new NotFoundException(`${this.entityName} with ID ${id} not found`);
    }
    return entity;
  }

  async findOne(
    filter: FilterQuery<T>,
    session?: ClientSession,
  ): Promise<T | null> {
    return this.model.findOne(filter).session(session).exec();
  }

  async findOneOrFail(
    filter: FilterQuery<T>,
    session?: ClientSession,
  ): Promise<T> {
    const entity = await this.findOne(filter, session);
    if (!entity) {
      throw new NotFoundException(`${this.entityName} not found`);
    }
    return entity;
  }

  async findAll(
    filter: FilterQuery<T> = {},
    options: QueryOptions<T> = {},
  ): Promise<T[]> {
    return this.model.find(filter, null, options).exec();
  }

  async findPaginated(
    params: PaginationParams,
    filter: FilterQuery<T> = {},
  ): Promise<PaginatedResult<T>> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const skip = (page - 1) * limit;

    const sortField = params.sort || "createdAt";
    const sortOrder = params.order === "asc" ? 1 : -1;

    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  // ============ UPDATE ============

  async update(
    id: string,
    data: UpdateDto,
    session?: ClientSession,
  ): Promise<T> {
    const result = await this.model
      .findByIdAndUpdate(id, data as UpdateQuery<T>, {
        new: true,
        session,
        runValidators: true,
      })
      .exec();

    if (!result) {
      throw new NotFoundException(`${this.entityName} with ID ${id} not found`);
    }

    return result;
  }

  async updateMany(
    filter: FilterQuery<T>,
    data: UpdateQuery<T>,
    session?: ClientSession,
  ): Promise<number> {
    const result = await this.model
      .updateMany(filter, data, { runValidators: true })
      .session(session)
      .exec();
    return result.modifiedCount;
  }

  // ============ DELETE ============

  async delete(id: string, session?: ClientSession): Promise<boolean> {
    const result = await this.model
      .findByIdAndDelete(id)
      .session(session)
      .exec();
    return !!result;
  }

  async deleteMany(
    filter: FilterQuery<T>,
    session?: ClientSession,
  ): Promise<number> {
    const result = await this.model.deleteMany(filter).session(session).exec();
    return result.deletedCount || 0;
  }

  // ============ UTILITY ============

  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const count = await this.model.countDocuments(filter).limit(1).exec();
    return count > 0;
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }
}
```

---

## Concrete Repository Implementation

```typescript
// src/modules/users/users.repository.ts
import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, ClientSession } from "mongoose";
import { BaseRepository } from "../../database/repositories/base.repository";
import { User, UserDocument } from "./schemas/user.schema";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UsersRepository extends BaseRepository<
  UserDocument,
  CreateUserDto,
  UpdateUserDto
> {
  protected readonly logger = new Logger(UsersRepository.name);
  protected readonly entityName = "User";

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {
    super(userModel);
  }

  // ============ CUSTOM QUERIES ============

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.model
      .findOne({ username })
      .select("+password") // Include password field
      .exec();
  }

  async findByOrganization(
    organizationId: string,
    role?: string,
  ): Promise<UserDocument[]> {
    const filter: any = { organizationId };
    if (role) {
      filter.role = role;
    }
    return this.model.find(filter).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.model.findOne({ email }).exec();
  }

  async updateLastLogin(
    userId: string,
    session?: ClientSession,
  ): Promise<void> {
    await this.model
      .updateOne({ _id: userId }, { $set: { lastLoginAt: Date.now() } })
      .session(session)
      .exec();
  }

  async incrementLoginAttempts(userId: string): Promise<number> {
    const result = await this.model
      .findByIdAndUpdate(userId, { $inc: { loginAttempts: 1 } }, { new: true })
      .exec();
    return result?.loginAttempts || 0;
  }

  async resetLoginAttempts(userId: string): Promise<void> {
    await this.model
      .updateOne({ _id: userId }, { $set: { loginAttempts: 0 } })
      .exec();
  }

  async searchUsers(
    query: string,
    organizationId: string,
  ): Promise<UserDocument[]> {
    return this.model
      .find({
        organizationId,
        $text: { $search: query },
      })
      .limit(20)
      .exec();
  }

  async countByRole(organizationId: string): Promise<Record<string, number>> {
    const result = await this.model.aggregate([
      { $match: { organizationId } },
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    return result.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
  }
}
```

---

## Service Using Repository

```typescript
// src/modules/users/users.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { UsersRepository } from "./users.repository";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserResponseDto } from "./dto/user-response.dto";
import {
  PaginationParams,
  PaginatedResult,
} from "../../database/repositories/base.repository.interface";

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly configService: ConfigService,
  ) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    // Check for duplicate username
    const existing = await this.usersRepository.findByUsername(dto.username);
    if (existing) {
      throw new ConflictException("Username already exists");
    }

    // Hash password
    const saltRounds =
      this.configService.get<number>("security.saltRounds") || 12;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    // Create user
    const user = await this.usersRepository.create({
      ...dto,
      password: hashedPassword,
    });

    return UserResponseDto.from(user);
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findByIdOrFail(id);
    return UserResponseDto.from(user);
  }

  async findAll(
    params: PaginationParams,
    organizationId?: string,
  ): Promise<PaginatedResult<UserResponseDto>> {
    const filter = organizationId ? { organizationId } : {};
    const result = await this.usersRepository.findPaginated(params, filter);

    return {
      ...result,
      data: result.data.map(UserResponseDto.from),
    };
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    // Hash password if provided
    if (dto.password) {
      const saltRounds =
        this.configService.get<number>("security.saltRounds") || 12;
      dto.password = await bcrypt.hash(dto.password, saltRounds);
    }

    const user = await this.usersRepository.update(id, dto);
    return UserResponseDto.from(user);
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.usersRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }
}
```

---

## Lean Queries for Read-Only Operations

```typescript
// For read-only queries, use lean() for better performance
async findAllLean(filter: FilterQuery<T> = {}): Promise<T[]> {
  return this.model.find(filter).lean().exec();
}

// Lean returns plain JavaScript objects, not Mongoose documents
// - No virtuals
// - No getters/setters
// - No save() method
// - ~5x faster for large result sets
```

---

## Aggregation Queries

```typescript
// Complex aggregation in repository
async getAttendanceSummary(
  organizationId: string,
  startDate: Date,
  endDate: Date,
): Promise<AttendanceSummary[]> {
  return this.model.aggregate([
    {
      $match: {
        organizationId,
        checkInDateTime: {
          $gte: startDate.getTime(),
          $lte: endDate.getTime(),
        },
      },
    },
    {
      $group: {
        _id: '$userId',
        totalDays: { $sum: 1 },
        totalLate: {
          $sum: { $cond: [{ $gt: ['$checkInLate', 0] }, 1, 0] },
        },
        avgWorkHours: { $avg: '$workingHours' },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        userId: '$_id',
        userName: '$user.name',
        totalDays: 1,
        totalLate: 1,
        avgWorkHours: { $round: ['$avgWorkHours', 2] },
      },
    },
  ]);
}
```

---

## Module Registration

```typescript
// src/database/database.module.ts
import { Module, Global } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigService } from "@nestjs/config";
import { TransactionHelper } from "./transaction.helper";

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>("database.uri"),
        // Recommended options
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        // Strict mode
        strictQuery: true,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [TransactionHelper],
  exports: [TransactionHelper],
})
export class DatabaseModule {}
```

---

## Testing Repositories

```typescript
// users.repository.spec.ts
import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UsersRepository } from "./users.repository";
import { User, UserDocument } from "./schemas/user.schema";

describe("UsersRepository", () => {
  let repository: UsersRepository;
  let model: Model<UserDocument>;

  const mockUser = {
    _id: "user-123",
    username: "testuser",
    email: "test@example.com",
    organizationId: "org-123",
    role: "STAFF",
  };

  const mockModel = {
    new: jest.fn().mockResolvedValue(mockUser),
    constructor: jest.fn().mockResolvedValue(mockUser),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        {
          provide: getModelToken(User.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    repository = module.get<UsersRepository>(UsersRepository);
    model = module.get<Model<UserDocument>>(getModelToken(User.name));
  });

  describe("findByUsername", () => {
    it("should return user with password", async () => {
      const selectMock = jest.fn().mockReturnThis();
      const execMock = jest.fn().mockResolvedValue(mockUser);

      mockModel.findOne.mockReturnValue({
        select: selectMock,
        exec: execMock,
      });

      const result = await repository.findByUsername("testuser");

      expect(mockModel.findOne).toHaveBeenCalledWith({ username: "testuser" });
      expect(selectMock).toHaveBeenCalledWith("+password");
      expect(result).toEqual(mockUser);
    });
  });
});
```
