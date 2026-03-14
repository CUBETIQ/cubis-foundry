# Example: Mocking an External Notification Service

## Context

A `NotificationService` sends SMS messages through an external provider (Twilio). Unit tests must verify notification logic without making real HTTP calls.

## User Prompt

> Write unit tests for my NotificationService.sendWelcome(user) method. It calls TwilioClient.sendSms(phone, message). I need tests for: successful send, invalid phone number, rate limit exceeded, and message template rendering.

## Skill Response

### Unit Under Test

- **Module:** `src/services/NotificationService.ts`
- **Method:** `sendWelcome(user: User): Promise<SendResult>`
- **Collaborator:** `TwilioClient.sendSms(phone: string, message: string): Promise<SmsResponse>`

### Mocking Strategy

| Dependency    | Double Type | Rationale                                          |
|--------------|-------------|-----------------------------------------------------|
| TwilioClient | Stub        | Replace HTTP calls with canned responses per scenario |
| TemplateEngine | Real     | Template rendering is pure logic, no I/O             |

### Test Implementation

```typescript
import { NotificationService } from '../src/services/NotificationService';
import { TwilioClient } from '../src/clients/TwilioClient';

describe('NotificationService.sendWelcome', () => {
  let service: NotificationService;
  let twilioStub: jest.Mocked<TwilioClient>;

  beforeEach(() => {
    // Arrange: create a fresh stub for each test
    twilioStub = {
      sendSms: jest.fn(),
    } as unknown as jest.Mocked<TwilioClient>;
    service = new NotificationService(twilioStub);
  });

  test('should send welcome SMS to valid user', async () => {
    // Arrange
    const user = { name: 'Alice', phone: '+15551234567' };
    twilioStub.sendSms.mockResolvedValue({ sid: 'SM123', status: 'sent' });

    // Act
    const result = await service.sendWelcome(user);

    // Assert
    expect(result.status).toBe('sent');
    expect(twilioStub.sendSms).toHaveBeenCalledWith(
      '+15551234567',
      expect.stringContaining('Welcome, Alice')
    );
  });

  test('should return error for invalid phone number', async () => {
    // Arrange
    const user = { name: 'Bob', phone: 'not-a-phone' };
    twilioStub.sendSms.mockRejectedValue(
      new Error('Invalid phone number format')
    );

    // Act
    const result = await service.sendWelcome(user);

    // Assert
    expect(result.status).toBe('failed');
    expect(result.error).toContain('Invalid phone number');
  });

  test('should handle rate limit exceeded gracefully', async () => {
    // Arrange
    const user = { name: 'Carol', phone: '+15559876543' };
    twilioStub.sendSms.mockRejectedValue({
      code: 429,
      message: 'Rate limit exceeded',
    });

    // Act
    const result = await service.sendWelcome(user);

    // Assert
    expect(result.status).toBe('rate_limited');
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  test('should render message template with user name', async () => {
    // Arrange
    const user = { name: 'Dana', phone: '+15551112222' };
    twilioStub.sendSms.mockResolvedValue({ sid: 'SM456', status: 'sent' });

    // Act
    await service.sendWelcome(user);

    // Assert
    const sentMessage = twilioStub.sendSms.mock.calls[0][1];
    expect(sentMessage).toMatch(/Welcome, Dana/);
    expect(sentMessage).not.toContain('{{name}}'); // template fully rendered
  });
});
```

### Key Decisions

1. **Stub over mock** -- TwilioClient uses stubs with canned responses because we care about NotificationService's behavior, not whether sendSms was called with exact arguments (except in the rendering test).
2. **Fresh stub per test** -- `beforeEach` creates a new stub so tests remain independent.
3. **Error paths tested** -- Invalid phone and rate limiting cover the most common failure modes.
4. **Template assertion** -- The rendering test verifies the template is populated and no raw placeholders remain.
