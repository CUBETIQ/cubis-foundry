# Secure Sessions with Fastify

> Reference for: Fastify Patterns
> Load when: Cookie authentication, session management, secure-session, key rotation, stateless sessions

---

## Overview

`@fastify/secure-session` provides encrypted, stateless cookie sessions using libsodium's Secret Key Box Encryption. Unlike server-side sessions (Redis/database), the session data is stored entirely in an encrypted cookie.

## When to Use

**Use secure-session when:**

- You want stateless authentication (no session store)
- Session data is small (< 4KB after encryption)
- You need horizontal scaling without shared state
- You want simple deployment without Redis

**Use server-side sessions (Redis) when:**

- You need to revoke sessions server-side
- Session data exceeds cookie limits
- You need to track active sessions
- Compliance requires server-side session control

---

## Installation

```bash
bun add @fastify/cookie @fastify/secure-session
```

## Generate Session Key

```bash
# Generate hex string for environment variable (recommended)
bun -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or generate a secure key file
bunx @fastify/secure-session > secret-key
```

---

## Basic Setup

### Using Key File

```typescript
// main.ts
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import cookie from "@fastify/cookie";
import secureSession from "@fastify/secure-session";
import * as fs from "fs";
import * as path from "path";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  await app.register(cookie);
  await app.register(secureSession, {
    key: fs.readFileSync(path.join(__dirname, "..", "secret-key")),
    cookie: {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  });

  await app.listen(3000, "0.0.0.0");
}
```

### Using Environment Variable (Recommended for Production)

```typescript
// main.ts
import secureSession from "@fastify/secure-session";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // Validate session secret exists
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required");
  }

  await app.register(cookie);
  await app.register(secureSession, {
    cookieName: process.env.SESSION_COOKIE_NAME || "oneup.sid",
    key: Buffer.from(process.env.SESSION_SECRET, "hex"),
    expiry: 24 * 60 * 60, // 1 day in seconds
    cookie: {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  });

  await app.listen(3000, "0.0.0.0");
}
```

---

## Session Guard Implementation

```typescript
// src/core/guards/session-auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { FastifyRequest } from "fastify";

export interface SessionUser {
  userId: string;
  role: string;
  organizationId: string;
  departmentId?: string;
  positionId?: string;
}

@Injectable()
export class SessionAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const session = request.session;

    // Check if session has userId
    const userId = session.get("userId");
    if (!userId) {
      throw new UnauthorizedException("Authentication required");
    }

    // Attach user object to request for downstream use
    (request as any).user = {
      userId,
      role: session.get("role"),
      organizationId: session.get("organizationId"),
      departmentId: session.get("departmentId"),
      positionId: session.get("positionId"),
    } as SessionUser;

    return true;
  }
}
```

---

## Auth Service with Sessions

```typescript
// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import * as bcrypt from "bcrypt";
import { UsersRepository } from "../users/users.repository";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async login(request: FastifyRequest, dto: LoginDto): Promise<void> {
    // Find user by username
    const user = await this.usersRepository.findByUsername(dto.username);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Verify password
    const isValid = await bcrypt.compare(dto.password, user.password);
    if (!isValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Check if account is enabled
    if (!user.enabled) {
      throw new UnauthorizedException("Account is disabled");
    }

    // Set session data
    request.session.set("userId", user._id.toString());
    request.session.set("role", user.role);
    request.session.set("organizationId", user.organizationId);
    request.session.set("departmentId", user.departmentId);
    request.session.set("positionId", user.positionId);

    // Update last login
    await this.usersRepository.updateLastLogin(user._id.toString());
  }

  async logout(request: FastifyRequest): Promise<void> {
    request.session.delete();
  }

  async refreshSession(request: FastifyRequest): Promise<void> {
    // Touch session to extend expiry
    request.session.touch();
  }
}
```

---

## Auth Controller

```typescript
// src/modules/auth/auth.controller.ts
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { FastifyRequest } from "fastify";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { SessionAuthGuard } from "../../core/guards/session-auth.guard";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login and create session" })
  @ApiResponse({ status: 200, description: "Login successful" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(
    @Req() request: FastifyRequest,
    @Body() dto: LoginDto,
  ): Promise<{ status: string }> {
    await this.authService.login(request, dto);
    return { status: "ok" };
  }

  @Post("logout")
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Logout and destroy session" })
  async logout(@Req() request: FastifyRequest): Promise<void> {
    await this.authService.logout(request);
  }

  @Post("refresh")
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Refresh session expiry" })
  async refresh(@Req() request: FastifyRequest): Promise<void> {
    await this.authService.refreshSession(request);
  }
}
```

---

## Key Rotation

Support rotating session keys without invalidating existing sessions:

```typescript
// main.ts - Key rotation setup
import * as fs from "fs";
import * as path from "path";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // Load keys - newest first
  const keys = [process.env.SESSION_SECRET_NEW, process.env.SESSION_SECRET_OLD]
    .filter(Boolean)
    .map((hex) => Buffer.from(hex!, "hex"));

  if (keys.length === 0) {
    throw new Error("At least one SESSION_SECRET is required");
  }

  await app.register(cookie);
  await app.register(secureSession, {
    cookieName: "oneup.sid",
    key: keys, // Array of keys for rotation
    cookie: {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  });

  await app.listen(3000, "0.0.0.0");
}
```

**Key Rotation Process:**

1. Generate new key: `bun -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. Set `SESSION_SECRET_NEW` to new key
3. Set `SESSION_SECRET_OLD` to current key
4. Deploy - new sessions use new key, old sessions still work
5. After all old sessions expire, remove `SESSION_SECRET_OLD`

---

## Session Data Access Patterns

```typescript
// Setting session data
request.session.set("userId", "123");
request.session.set("role", "admin");

// Getting session data
const userId = request.session.get("userId");
const role = request.session.get("role");

// Get all session data
const allData = request.session.data();

// Delete specific key (set to undefined)
request.session.set("tempData", undefined);

// Delete entire session
request.session.delete();

// Touch session (extend expiry without changing data)
request.session.touch();

// Regenerate session (clear all data, keep session)
request.session.regenerate();

// Regenerate but keep specific keys
request.session.regenerate(["userId", "role"]);

// Update cookie options for this request
request.session.options({ maxAge: 3600 });
```

---

## TypeScript Session Typing

```typescript
// src/types/fastify.d.ts
import "@fastify/secure-session";

declare module "@fastify/secure-session" {
  interface SessionData {
    userId: string;
    role: string;
    organizationId: string;
    departmentId?: string;
    positionId?: string;
  }
}
```

---

## Security Best Practices

### Cookie Configuration

```typescript
cookie: {
  path: '/',
  httpOnly: true,        // Prevent XSS access
  secure: true,          // HTTPS only in production
  sameSite: 'lax',       // CSRF protection
  // maxAge is handled by 'expiry' option
}
```

### Environment Variables

```bash
# .env.production
SESSION_SECRET=<64-char-hex-string>
SESSION_COOKIE_NAME=oneup.sid
NODE_ENV=production
```

### Session Expiry

```typescript
await app.register(secureSession, {
  expiry: 24 * 60 * 60, // 1 day in seconds
  // ...
});
```

---

## Troubleshooting

### Session Not Persisting

1. Check `httpOnly` and `secure` settings match environment
2. Verify CORS `credentials: true` if cross-origin
3. Check cookie domain matches request domain
4. Verify session secret is valid hex string

### "Invalid session" Errors

1. Session secret changed - users need to re-login
2. Key rotation not configured correctly
3. Cookie expired

### Debug Logging

```typescript
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter({ logger: { level: "debug" } }),
);
```

---

## Testing Sessions

```typescript
// test/auth.e2e-spec.ts
import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";

describe("Auth (e2e)", () => {
  let app: INestApplication;
  let agent: request.SuperAgentTest;

  beforeAll(async () => {
    // ... setup
    agent = request.agent(app.getHttpServer());
  });

  it("should login and maintain session", async () => {
    // Login
    await agent
      .post("/auth/login")
      .send({ username: "test", password: "password" })
      .expect(200);

    // Access protected route with session cookie
    await agent.get("/users/me").expect(200);
  });

  it("should logout and clear session", async () => {
    await agent.post("/auth/logout").expect(204);
    await agent.get("/users/me").expect(401);
  });
});
```
