# Mongoose Schema Design Patterns

> Reference for: Mongoose NestJS
> Load when: Creating schemas, indexes, virtuals, hooks, discriminators, embedded documents

---

## Overview

Effective schema design is critical for MongoDB performance and maintainability. This guide covers NestJS/Mongoose patterns for schema definition, indexing strategies, virtuals, hooks, and advanced patterns like discriminators.

---

## Basic Schema Structure

### Standard Schema with Decorators

```typescript
// src/modules/users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type UserDocument = User & Document;

@Schema({
  timestamps: true, // Adds createdAt, updatedAt
  collection: "users", // Explicit collection name
  toJSON: {
    virtuals: true, // Include virtuals in JSON
    transform: (_, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      return ret;
    },
  },
})
export class User {
  // String with validation
  @Prop({
    required: true,
    unique: true,
    index: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 50,
  })
  username: string;

  // String with select: false (excluded by default)
  @Prop({ required: true, select: false })
  password: string;

  // Enum field
  @Prop({
    type: String,
    enum: ["SUPER_ADMIN", "ADMIN", "STAFF"],
    default: "STAFF",
  })
  role: string;

  // Boolean with default
  @Prop({ default: true })
  enabled: boolean;

  // Reference to another collection
  @Prop({
    type: Types.ObjectId,
    ref: "Organization",
    required: true,
    index: true,
  })
  organizationId: Types.ObjectId;

  // Optional reference
  @Prop({ type: Types.ObjectId, ref: "Department" })
  departmentId?: Types.ObjectId;

  // Array of strings
  @Prop({ type: [String], default: [] })
  permissions: string[];

  // Nested object (embedded)
  @Prop({
    type: {
      street: String,
      city: String,
      country: String,
    },
  })
  address?: {
    street?: string;
    city?: string;
    country?: string;
  };

  // Date field
  @Prop()
  lastLoginAt?: Date;

  // Number with min/max
  @Prop({ type: Number, min: 0, max: 100, default: 0 })
  loginAttempts: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
```

---

## Index Strategies

### Compound Indexes

```typescript
// After schema creation, add compound indexes
UserSchema.index({ organizationId: 1, role: 1 });
UserSchema.index({ organizationId: 1, enabled: 1, createdAt: -1 });

// Text index for search
UserSchema.index({ username: "text", "profile.name": "text" });

// TTL index for auto-expiration
UserSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Sparse index (only index documents with the field)
UserSchema.index({ email: 1 }, { sparse: true, unique: true });

// Partial index (only index matching documents)
UserSchema.index(
  { lastLoginAt: 1 },
  { partialFilterExpression: { enabled: true } },
);
```

### Index Best Practices

| Pattern      | Use Case               | Example                   |
| ------------ | ---------------------- | ------------------------- |
| Single field | Equality queries       | `{ username: 1 }`         |
| Compound     | Multi-field queries    | `{ orgId: 1, role: 1 }`   |
| Text         | Full-text search       | `{ name: 'text' }`        |
| TTL          | Auto-expiration        | `{ expiresAt: 1 }`        |
| Sparse       | Optional unique fields | `{ email: 1 }`            |
| Partial      | Conditional indexing   | Filter by `enabled: true` |

---

## Virtuals

### Computed Properties

```typescript
// Virtual for full name
UserSchema.virtual("fullName").get(function (this: UserDocument) {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for profile URL
UserSchema.virtual("profileUrl").get(function (this: UserDocument) {
  return `/users/${this._id}`;
});

// Virtual with setter
UserSchema.virtual("fullName")
  .get(function (this: UserDocument) {
    return `${this.firstName} ${this.lastName}`;
  })
  .set(function (this: UserDocument, value: string) {
    const [firstName, ...rest] = value.split(" ");
    this.firstName = firstName;
    this.lastName = rest.join(" ");
  });
```

### Virtual Populate (Reference without storing)

```typescript
// In User schema - virtual reference to attendance records
UserSchema.virtual('attendanceRecords', {
  ref: 'Attendance',
  localField: '_id',
  foreignField: 'userId',
  options: { sort: { createdAt: -1 }, limit: 10 },
});

// Usage in repository
async findWithAttendance(userId: string): Promise<UserDocument> {
  return this.model
    .findById(userId)
    .populate('attendanceRecords')
    .exec();
}
```

---

## Schema Hooks (Middleware)

### Pre-Save Hooks

```typescript
// Hash password before save
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const bcrypt = await import("bcrypt");
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Validate organization exists
UserSchema.pre("save", async function (next) {
  if (!this.isModified("organizationId")) return next();

  const Organization = this.model("Organization");
  const exists = await Organization.exists({ _id: this.organizationId });

  if (!exists) {
    return next(new Error("Organization not found"));
  }
  next();
});
```

### Post-Save Hooks

```typescript
// Log user creation
UserSchema.post("save", function (doc: UserDocument) {
  console.log(`User ${doc.username} saved with id ${doc._id}`);
});

// Emit event after save
UserSchema.post("save", async function (doc: UserDocument) {
  const eventBus = doc.$locals.eventBus;
  if (eventBus) {
    await eventBus.emit("user.created", { userId: doc._id.toString() });
  }
});
```

### Query Hooks

```typescript
// Auto-populate organization on find
UserSchema.pre(/^find/, function (next) {
  this.populate("organizationId", "name code");
  next();
});

// Exclude disabled users by default
UserSchema.pre(/^find/, function (next) {
  // Skip if explicitly querying disabled users
  if (this.getQuery().enabled === false) return next();

  this.where({ enabled: { $ne: false } });
  next();
});

// Log slow queries
UserSchema.post(/^find/, function (docs, next) {
  if (this.mongooseOptions().explain) return next();

  const duration = Date.now() - this.startTime;
  if (duration > 100) {
    console.warn(`Slow query (${duration}ms):`, this.getQuery());
  }
  next();
});
```

---

## Embedded Documents vs References

### When to Embed

```typescript
// Embed: 1:few relationship, always accessed together
@Schema()
export class User {
  @Prop({
    type: [
      {
        type: { type: String, enum: ["home", "work", "mobile"] },
        number: String,
        primary: Boolean,
      },
    ],
    default: [],
  })
  phones: {
    type: string;
    number: string;
    primary: boolean;
  }[];

  @Prop({
    type: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String,
    },
  })
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
}
```

### When to Reference

```typescript
// Reference: 1:many relationship, independent lifecycle
@Schema()
export class User {
  // Reference to organization (many users per org)
  @Prop({ type: Types.ObjectId, ref: "Organization", required: true })
  organizationId: Types.ObjectId;

  // Reference to department (optional)
  @Prop({ type: Types.ObjectId, ref: "Department" })
  departmentId?: Types.ObjectId;
}

// Attendance references user (many attendance per user)
@Schema()
export class Attendance {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: Types.ObjectId;
}
```

### Hybrid: Denormalized Reference

```typescript
// Store both reference and frequently-accessed data
@Schema()
export class Attendance {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: Types.ObjectId;

  // Denormalized for query performance
  @Prop({ required: true })
  userName: string;

  @Prop({ required: true })
  organizationId: string;

  @Prop()
  departmentName?: string;
}
```

---

## Discriminators (Schema Inheritance)

```typescript
// Base notification schema
@Schema({ discriminatorKey: "type", timestamps: true })
export class Notification {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  message?: string;

  @Prop({ default: false })
  read: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Leave notification (extends Notification)
@Schema()
export class LeaveNotification extends Notification {
  @Prop({ required: true })
  leaveId: string;

  @Prop({ required: true })
  leaveType: string;

  @Prop({ required: true })
  status: string;
}

export const LeaveNotificationSchema =
  SchemaFactory.createForClass(LeaveNotification);

// Attendance notification
@Schema()
export class AttendanceNotification extends Notification {
  @Prop({ required: true })
  attendanceId: string;

  @Prop({ required: true })
  checkType: "IN" | "OUT";
}

export const AttendanceNotificationSchema = SchemaFactory.createForClass(
  AttendanceNotification,
);

// Module setup with discriminators
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Notification.name,
        schema: NotificationSchema,
        discriminators: [
          { name: "LeaveNotification", schema: LeaveNotificationSchema },
          {
            name: "AttendanceNotification",
            schema: AttendanceNotificationSchema,
          },
        ],
      },
    ]),
  ],
})
export class NotificationsModule {}
```

---

## Multi-Tenant Schema Pattern

```typescript
// Base schema with organization isolation
@Schema({ timestamps: true })
export class BaseEntity {
  @Prop({ required: true, index: true })
  organizationId: string;
}

// All tenant-specific schemas extend BaseEntity
@Schema({ timestamps: true })
export class Task extends BaseEntity {
  @Prop({ required: true })
  title: string;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  assigneeId: Types.ObjectId;
}

// Repository with automatic tenant filtering
@Injectable()
export class TasksRepository {
  constructor(
    @InjectModel(Task.name)
    private readonly model: Model<TaskDocument>,
  ) {}

  async findByOrganization(
    organizationId: string,
    filter: FilterQuery<TaskDocument> = {},
  ): Promise<TaskDocument[]> {
    return this.model.find({ ...filter, organizationId }).exec();
  }

  async create(
    organizationId: string,
    data: Partial<Task>,
  ): Promise<TaskDocument> {
    const task = new this.model({ ...data, organizationId });
    return task.save();
  }
}
```

---

## Schema Validation

### Custom Validators

```typescript
@Schema()
export class User {
  @Prop({
    required: true,
    validate: {
      validator: (v: string) => /^[a-zA-Z0-9_]+$/.test(v),
      message: "Username can only contain letters, numbers, and underscores",
    },
  })
  username: string;

  @Prop({
    validate: {
      validator: async function (v: string) {
        if (!v) return true;
        const User = this.constructor as Model<UserDocument>;
        const count = await User.countDocuments({
          email: v,
          _id: { $ne: this._id },
        });
        return count === 0;
      },
      message: "Email already exists",
    },
  })
  email?: string;
}
```

### Schema-Level Validation

```typescript
UserSchema.pre("validate", function (next) {
  if (this.role === "SUPER_ADMIN" && !this.email) {
    this.invalidate("email", "Super admins must have an email");
  }
  next();
});
```

---

## Best Practices Summary

### DO

- Use `timestamps: true` for audit trails
- Add indexes for all query patterns
- Use `select: false` for sensitive fields
- Implement `toJSON` transform for clean responses
- Use virtuals for computed properties
- Validate at schema level

### DON'T

- Over-embed large arrays (>100 items)
- Create indexes on low-cardinality fields
- Use `any` type for schema fields
- Skip validation for user input
- Forget to handle hook errors

---

## Related Steering Files

- `repository-pattern.md` - Data access patterns
- `transactions.md` - ACID operations
- `migrations.md` - Schema versioning
