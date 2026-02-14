# MongoDB Transactions with Mongoose

> Reference for: Mongoose NestJS
> Load when: ACID operations, multi-document updates, session handling, retry logic, race conditions

---

## Overview

MongoDB transactions ensure ACID compliance for multi-document operations. Use transactions when you need to update multiple documents atomically - either all changes succeed or all are rolled back.

## When to Use Transactions

**Use transactions for:**
- Creating related documents together (user + profile)
- Updating multiple collections atomically
- Preventing race conditions (check-in/check-out)
- Financial operations (transfers, payments)
- Inventory management (stock updates)

**Don't use transactions for:**
- Single document operations (already atomic)
- Read-only queries
- Operations that can tolerate eventual consistency

---

## Transaction Helper

```typescript
// src/database/transaction.helper.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ClientSession } from 'mongoose';

export type TransactionCallback<T> = (session: ClientSession) => Promise<T>;

@Injectable()
export class TransactionHelper {
  private readonly logger = new Logger(TransactionHelper.name);

  constructor(
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  /**
   * Execute callback within a transaction
   */
  async withTransaction<T>(callback: TransactionCallback<T>): Promise<T> {
    const session = await this.connection.startSession();

    try {
      session.startTransaction({
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
      });

      const result = await callback(session);

      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(`Transaction aborted: ${error.message}`, error.stack);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Execute with automatic retry on transient errors
   */
  async withRetry<T>(
    callback: TransactionCallback<T>,
    maxRetries = 3,
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.withTransaction(callback);
      } catch (error) {
        lastError = error as Error;

        if (this.isTransientError(error)) {
          this.logger.warn(
            `Transient error on attempt ${attempt}/${maxRetries}: ${error.message}`,
          );
          await this.delay(Math.pow(2, attempt) * 100); // Exponential backoff
          continue;
        }

        // Non-transient error, don't retry
        throw error;
      }
    }

    this.logger.error(`Transaction failed after ${maxRetries} attempts`);
    throw lastError;
  }

  /**
   * Check if error is transient (retryable)
   */
  private isTransientError(error: unknown): boolean {
    const transientCodes = [
      112,  // WriteConflict
      117,  // ConflictingOperationInProgress
      204,  // NoSuchTransaction
      251,  // TransactionAborted
      11600, // InterruptedAtShutdown
      11601, // Interrupted
      11602, // InterruptedDueToReplStateChange
    ];

    const code = (error as { code?: number })?.code;
    const hasTransientLabel = (error as { errorLabels?: string[] })
      ?.errorLabels?.includes('TransientTransactionError');

    return (code !== undefined && transientCodes.includes(code)) || hasTransientLabel;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

---

## Using Transactions in Services

### Basic Transaction

```typescript
// src/modules/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { TransactionHelper } from '../../database/transaction.helper';
import { UsersRepository } from './users.repository';
import { ProfilesRepository } from '../profiles/profiles.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly transactionHelper: TransactionHelper,
    private readonly usersRepository: UsersRepository,
    private readonly profilesRepository: ProfilesRepository,
  ) {}

  async createUserWithProfile(dto: CreateUserDto): Promise<UserResponseDto> {
    return this.transactionHelper.withTransaction(async (session) => {
      // Create user
      const user = await this.usersRepository.create(
        {
          username: dto.username,
          password: hashedPassword,
          organizationId: dto.organizationId,
        },
        session,
      );

      // Create profile (in same transaction)
      await this.profilesRepository.create(
        {
          userId: user._id.toString(),
          name: dto.name,
          email: dto.email,
        },
        session,
      );

      return UserResponseDto.from(user);
    });
  }
}
```

### Transaction with Retry (Race Condition Prevention)

```typescript
// src/modules/attendance/attendance.service.ts
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { TransactionHelper } from '../../database/transaction.helper';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly transactionHelper: TransactionHelper,
    private readonly attendanceRepository: AttendanceRepository,
    private readonly usersRepository: UsersRepository,
    private readonly summaryRepository: SummaryRepository,
  ) {}

  async checkIn(userId: string, dto: CheckInDto): Promise<AttendanceResponseDto> {
    return this.transactionHelper.withRetry(async (session) => {
      // 1. Check for existing attendance today (with session lock)
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).getTime();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).getTime();

      const existing = await this.attendanceRepository.findOne(
        {
          userId,
          checkInDateTime: { $gte: startOfDay, $lte: endOfDay },
        },
        session,
      );

      if (existing) {
        throw new ConflictException('Already checked in today');
      }

      // 2. Get user details
      const user = await this.usersRepository.findById(userId, undefined, session);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // 3. Create attendance record
      const attendance = await this.attendanceRepository.create(
        {
          userId,
          organizationId: user.organizationId,
          departmentId: user.departmentId,
          checkInDateTime: dto.timestamp,
          checkInLocation: dto.location,
          checkInType: dto.method,
        },
        session,
      );

      // 4. Update daily summary (atomic increment)
      await this.summaryRepository.incrementCheckIn(
        userId,
        startOfDay,
        session,
      );

      return AttendanceResponseDto.from(attendance);
    });
  }

  async checkOut(userId: string, dto: CheckOutDto): Promise<AttendanceResponseDto> {
    return this.transactionHelper.withRetry(async (session) => {
      // Find today's attendance
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).getTime();

      const attendance = await this.attendanceRepository.findOne(
        {
          userId,
          checkInDateTime: { $gte: startOfDay },
          checkOutDateTime: { $exists: false },
        },
        session,
      );

      if (!attendance) {
        throw new NotFoundException('No active check-in found');
      }

      // Calculate working hours
      const workingHours = this.calculateWorkingHours(
        attendance.checkInDateTime,
        dto.timestamp,
      );

      // Update attendance
      const updated = await this.attendanceRepository.update(
        attendance._id.toString(),
        {
          checkOutDateTime: dto.timestamp,
          checkOutLocation: dto.location,
          workingHours,
        },
        session,
      );

      // Update summary
      await this.summaryRepository.addWorkingHours(
        userId,
        startOfDay,
        workingHours,
        session,
      );

      return AttendanceResponseDto.from(updated);
    });
  }
}
```

---

## Repository Methods with Session Support

```typescript
// Ensure all repository methods accept optional session parameter
export class AttendanceRepository extends BaseRepository<AttendanceDocument> {
  async findTodayAttendance(
    userId: string,
    session?: ClientSession,
  ): Promise<AttendanceDocument | null> {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).getTime();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).getTime();

    return this.model
      .findOne({
        userId,
        checkInDateTime: { $gte: startOfDay, $lte: endOfDay },
      })
      .session(session)
      .exec();
  }

  async incrementCheckInCount(
    userId: string,
    date: number,
    session?: ClientSession,
  ): Promise<void> {
    await this.model
      .updateOne(
        { userId, date },
        { $inc: { checkInCount: 1 } },
        { upsert: true },
      )
      .session(session)
      .exec();
  }
}
```

---

## Optimistic Locking Pattern

For high-concurrency scenarios, use version-based optimistic locking:

```typescript
// Schema with version field
@Schema({ timestamps: true, optimisticConcurrency: true })
export class Inventory {
  @Prop({ required: true })
  productId: string;

  @Prop({ required: true })
  quantity: number;

  // Mongoose adds __v field automatically with optimisticConcurrency: true
}

// Service with optimistic locking
async decrementStock(productId: string, amount: number): Promise<void> {
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const inventory = await this.inventoryRepository.findOne({ productId });
      
      if (!inventory) {
        throw new NotFoundException('Product not found');
      }

      if (inventory.quantity < amount) {
        throw new BadRequestException('Insufficient stock');
      }

      // This will fail if __v changed (concurrent modification)
      await this.inventoryRepository.update(inventory._id, {
        quantity: inventory.quantity - amount,
      });

      return;
    } catch (error) {
      if (error.name === 'VersionError' && attempt < maxRetries) {
        // Retry on version conflict
        continue;
      }
      throw error;
    }
  }

  throw new ConflictException('Failed to update stock after retries');
}
```

---

## Distributed Transactions (Multi-Database)

For operations spanning multiple databases, use the Saga pattern:

```typescript
// Saga pattern for distributed transactions
async transferFunds(fromAccount: string, toAccount: string, amount: number): Promise<void> {
  // Step 1: Debit source account
  const debitResult = await this.accountsService.debit(fromAccount, amount);
  
  try {
    // Step 2: Credit destination account
    await this.accountsService.credit(toAccount, amount);
  } catch (error) {
    // Compensating transaction: Reverse the debit
    await this.accountsService.credit(fromAccount, amount);
    throw error;
  }
}
```

---

## Best Practices

### DO

- Always pass session to all operations within a transaction
- Use `withRetry` for operations prone to write conflicts
- Keep transactions short (< 60 seconds)
- Handle `TransientTransactionError` with retries
- Use read concern `snapshot` for consistent reads

### DON'T

- Hold transactions open while waiting for user input
- Perform non-database operations inside transactions
- Ignore transaction timeout limits
- Use transactions for single-document operations
- Nest transactions (MongoDB doesn't support it)

---

## MongoDB Requirements

Transactions require:
- MongoDB 4.0+ for replica sets
- MongoDB 4.2+ for sharded clusters
- Replica set or sharded cluster (not standalone)

```bash
# Check if replica set is configured
mongosh --eval "rs.status()"
```
