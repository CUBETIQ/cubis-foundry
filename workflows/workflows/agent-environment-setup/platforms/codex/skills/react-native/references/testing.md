# React Native Testing Reference

## Setup

```javascript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterSetup: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*))'
  ]
};
```

```typescript
// jest.setup.ts
import '@testing-library/react-native/extend-expect';
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
  Link: ({ children }: any) => children,
}));
```

## Component Testing (RNTL)

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';

it('calls onPress when tapped', () => {
  const onPress = jest.fn();
  render(<Button label="Submit" onPress={onPress} />);
  fireEvent.press(screen.getByText('Submit'));
  expect(onPress).toHaveBeenCalledTimes(1);
});
```

### Async State

```tsx
import { render, screen, waitFor } from '@testing-library/react-native';

it('loads user data', async () => {
  render(<UserProfile userId="1" />);
  expect(screen.getByTestId('skeleton')).toBeOnTheScreen();
  await waitFor(() => expect(screen.getByText('Alice')).toBeOnTheScreen());
});
```

### Forms

```tsx
it('validates empty email', async () => {
  render(<LoginForm onSubmit={jest.fn()} />);
  fireEvent.press(screen.getByText('Log In'));
  await waitFor(() => expect(screen.getByText('Email is required')).toBeOnTheScreen());
});
```

## Testing Navigation

```tsx
import { useRouter } from 'expo-router';
jest.mock('expo-router');

it('navigates on tap', () => {
  const push = jest.fn();
  (useRouter as jest.Mock).mockReturnValue({ push });
  render(<HomeScreen />);
  fireEvent.press(screen.getByText('View Product'));
  expect(push).toHaveBeenCalledWith('/product/1');
});
```

## Mocking Native Modules

```typescript
// __mocks__/expo-haptics.ts
export const impactAsync = jest.fn();
export const ImpactFeedbackStyle = { Light: 'light', Medium: 'medium', Heavy: 'heavy' };
```

```typescript
// expo-camera mock
jest.mock('expo-camera', () => ({
  Camera: ({ children }: any) => children,
  useCameraPermissions: () => [{ granted: true }, jest.fn()],
}));
```

## E2E Testing -- Maestro

```yaml
# .maestro/login.yaml
appId: com.myapp
---
- launchApp
- tapOn: "Email"
- inputText: "alice@example.com"
- tapOn: "Password"
- inputText: "secure123"
- tapOn: "Log In"
- assertVisible: "Welcome, Alice"
```

```bash
maestro test .maestro/login.yaml
```

## E2E Testing -- Detox

```typescript
import { by, device, element, expect } from 'detox';

describe('Login', () => {
  beforeAll(async () => { await device.launchApp({ newInstance: true }); });

  it('logs in with valid credentials', async () => {
    await element(by.id('email-input')).typeText('alice@example.com');
    await element(by.id('password-input')).typeText('secure123');
    await element(by.id('login-button')).tap();
    await expect(element(by.text('Welcome, Alice'))).toBeVisible();
  });
});
```

## Common Pitfalls

1. **Missing transforms** -- add RN packages to `transformIgnorePatterns`
2. **Async act warnings** -- wrap state updates in `waitFor` or `act()`
3. **Platform mocks** -- native modules need Jest mocks in the test environment
4. **Navigation context** -- mock Expo Router hooks or wrap in test navigator
