# Authentication & Guards

> Reference for: NestJS Expert
> Load when: Session authentication, guards, authorization, cookie-based auth

---

## Session-Based Authentication (Recommended)

OneUp uses **cookie-based session authentication** with `@fastify/secure-session` instead of JWT. This approach is more secure for web applications and simplifies token management.

### Why Sessions Over JWT?

| Aspect     | Session                  | JWT                                         |
| ---------- | ------------------------ | ------------------------------------------- |
| Revocation | Instant (delete session) | Difficult (wait for expiry)                 |
| Storage    | Server-side (Redis/DB)   | Client-side (token)                         |
| Size       | Small cookie             | Large token                                 |
| Security   | HttpOnly cookie          | Vulnerable to XSS if stored in localStorage |
| Logout     | Immediate                | Token still valid until expiry              |

---

## Session Setup with Fastify

```typescript
// main.ts
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import cookie from "@fastify/cookie";
import secureSession from "@fastify/secure-session";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // Register cookie plugin first
  await app.register(cookie);

  // Register secure session
  await app.register(secureSession, {
    cookieName: process.env.SESSION_COOKIE_NAME || "session",
    key: Buffer.from(process.env.SESSION_SECRET!, "hex"),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    },
  });

  await app.listen(3000, "0.0.0.0");
}
```

### Generate Session Key

```bash
# Generate a secure 32-byte key (using Bun)
bun -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using npx
bunx @fastify/secure-session > secret-key
```

---

## Session Auth Guard

```typescript
// src/common/guards/session-auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { FastifyRequest } from "fastify";

export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const session = request.session;

    // Check if user is authenticated
    const userId = session.get("userId");
    if (!userId) {
      throw new UnauthorizedException("Not authenticated");
    }

    // Attach user info to request for downstream use
    (request as any).user = {
      userId: session.get("userId"),
      organizationId: session.get("organizationId"),
      role: session.get("role"),
      username: session.get("username"),
    };

    return true;
  }
}
```

---

## Roles Guard

```typescript
// src/common/guards/roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

export const ROLES_KEY = "roles";
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException("Insufficient permissions");
    }

    return true;
  }
}
```

---

## Organization Guard (Multi-Tenant)

```typescript
// src/common/guards/organization.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";

@Injectable()
export class OrganizationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const params = request.params;

    // If route has organizationId param, verify user belongs to it
    if (
      params.organizationId &&
      user.organizationId !== params.organizationId
    ) {
      // Allow SuperAdmin to access any organization
      if (user.role !== "SUPER_ADMIN") {
        throw new ForbiddenException("Access denied to this organization");
      }
    }

    return true;
  }
}
```

---

## Auth Service (Session-Based)

```typescript
// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersRepository } from "../users/users.repository";
import * as bcrypt from "bcrypt";

export interface SessionUser {
  userId: string;
  username: string;
  organizationId: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async validateUser(username: string, password: string): Promise<SessionUser> {
    const user = await this.usersRepository.findByUsername(username);

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.enabled) {
      throw new UnauthorizedException("Account is disabled");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return {
      userId: user._id.toString(),
      username: user.username,
      organizationId: user.organizationId,
      role: user.role,
    };
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}
```

---

## Auth Controller

```typescript
// src/modules/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { AuthService, SessionUser } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { Public } from "../../common/guards/session-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() request: FastifyRequest,
  ): Promise<{ message: string; user: Omit<SessionUser, "userId"> }> {
    const user = await this.authService.validateUser(
      dto.username,
      dto.password,
    );

    // Set session data
    request.session.set("userId", user.userId);
    request.session.set("username", user.username);
    request.session.set("organizationId", user.organizationId);
    request.session.set("role", user.role);

    return {
      message: "Login successful",
      user: {
        username: user.username,
        organizationId: user.organizationId,
        role: user.role,
      },
    };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@Req() request: FastifyRequest): Promise<{ message: string }> {
    // Clear all session data
    request.session.delete();

    return { message: "Logout successful" };
  }

  @Get("me")
  async getCurrentUser(@Req() request: FastifyRequest): Promise<SessionUser> {
    return {
      userId: request.session.get("userId"),
      username: request.session.get("username"),
      organizationId: request.session.get("organizationId"),
      role: request.session.get("role"),
    };
  }
}
```

---

## Apply Guards Globally

```typescript
// app.module.ts
import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { SessionAuthGuard } from "./common/guards/session-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";

@Module({
  providers: [
    // Apply SessionAuthGuard globally (checks session on all routes)
    { provide: APP_GUARD, useClass: SessionAuthGuard },
    // Apply RolesGuard globally (checks roles when @Roles() is used)
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
```

---

## Usage Examples

```typescript
// Public endpoint (no auth required)
@Public()
@Get('health')
healthCheck() {
  return { status: 'ok' };
}

// Protected endpoint (requires valid session)
@Get('profile')
getProfile(@Req() request: FastifyRequest) {
  return request.user;
}

// Admin only endpoint
@Roles('ADMIN', 'SUPER_ADMIN')
@Get('admin/dashboard')
adminDashboard() {
  return { data: 'admin data' };
}

// SuperAdmin only
@Roles('SUPER_ADMIN')
@Delete('users/:id')
deleteUser(@Param('id') id: string) {
  return this.usersService.delete(id);
}
```

---

## Session Decorator (Optional)

```typescript
// src/common/decorators/session-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUser {
  userId: string;
  username: string;
  organizationId: string;
  role: string;
}

export const SessionUser = createParamDecorator(
  (data: keyof CurrentUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUser;

    return data ? user?.[data] : user;
  },
);

// Usage
@Get('profile')
getProfile(@SessionUser() user: CurrentUser) {
  return user;
}

@Get('my-org')
getMyOrg(@SessionUser('organizationId') orgId: string) {
  return this.orgsService.findById(orgId);
}
```

---

## Quick Reference

| Component                  | Purpose                   |
| -------------------------- | ------------------------- |
| `SessionAuthGuard`         | Verify session exists     |
| `RolesGuard`               | Role-based access control |
| `OrganizationGuard`        | Multi-tenant isolation    |
| `@Public()`                | Skip authentication       |
| `@Roles('ADMIN')`          | Require specific role     |
| `@SessionUser()`           | Get current user          |
| `request.session.set()`    | Store session data        |
| `request.session.get()`    | Retrieve session data     |
| `request.session.delete()` | Clear session (logout)    |

---

## Security Best Practices

### DO

- Use `httpOnly: true` for session cookies
- Use `secure: true` in production
- Set appropriate `sameSite` policy
- Regenerate session on login
- Clear session completely on logout
- Use HTTPS in production

### DON'T

- Store sensitive data in session (only IDs and roles)
- Use long session expiry without refresh mechanism
- Skip CSRF protection for state-changing operations
- Trust client-side session data

---

## Related Reference Files

- [secure-sessions.md](secure-sessions.md) (Fastify Patterns) - Detailed session configuration
- [services-di.md](services-di.md) - Dependency injection patterns
