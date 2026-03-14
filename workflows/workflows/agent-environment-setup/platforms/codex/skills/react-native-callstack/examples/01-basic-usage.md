# Example: React Navigation with Type-Safe Stack and Tab Setup

## Scenario

A team is building a fintech app with React Native using Callstack patterns. They need a navigation structure with a bottom tab navigator containing Home, Portfolio, and Settings tabs, plus a modal stack for transaction details and a full-screen stack for onboarding. Navigation must be fully type-safe with TypeScript, and the tab bar must hide during the onboarding flow.

## Prompt

"Set up React Navigation with a type-safe bottom tab navigator (Home, Portfolio, Settings), a modal stack for transaction details, and a full-screen onboarding stack. Use TypeScript throughout. The tab bar should be hidden during onboarding."

## Expected Output

### Navigation Type Definitions

```typescript
// navigation/types.ts
import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// Root stack contains tabs + full-screen flows
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  Onboarding: undefined;
  TransactionDetail: { transactionId: string };
};

// Bottom tabs
export type MainTabParamList = {
  Home: undefined;
  Portfolio: { accountId?: string };
  Settings: undefined;
};

// Typed screen props helpers
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  BottomTabScreenProps<MainTabParamList, T>;

// Enable autocomplete for useNavigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
```

### Root Navigator

```typescript
// navigation/RootNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { MainTabNavigator } from './MainTabNavigator';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { TransactionDetailScreen } from '../screens/TransactionDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const hasCompletedOnboarding = useOnboardingStatus();

  return (
    <Stack.Navigator>
      {!hasCompletedOnboarding ? (
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false, animationTypeForReplace: 'pop' }}
        />
      ) : (
        <Stack.Screen
          name="MainTabs"
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />
      )}
      <Stack.Screen
        name="TransactionDetail"
        component={TransactionDetailScreen}
        options={{
          presentation: 'modal',
          title: 'Transaction',
        }}
      />
    </Stack.Navigator>
  );
}
```

### Tab Navigator

```typescript
// navigation/MainTabNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { MainTabParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { PortfolioScreen } from '../screens/PortfolioScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1a73e8',
        tabBarInactiveTintColor: '#5f6368',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Portfolio"
        component={PortfolioScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="chart-line" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="cog" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
```

### Type-Safe Screen Component

```typescript
// screens/HomeScreen.tsx
import { View, Text, FlatList, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, MainTabScreenProps } from '../navigation/types';
import { useTransactions } from '../hooks/useTransactions';

type Props = MainTabScreenProps<'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { data: transactions } = useTransactions();

  // Type-safe navigation to modal
  const rootNavigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', padding: 16 }}>
        Recent Transactions
      </Text>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              rootNavigation.navigate('TransactionDetail', {
                transactionId: item.id, // TypeScript enforces this parameter
              })
            }
            style={{ padding: 16, borderBottomWidth: 1, borderColor: '#eee' }}
          >
            <Text style={{ fontSize: 16 }}>{item.description}</Text>
            <Text style={{ color: item.amount > 0 ? 'green' : 'red' }}>
              {item.amount > 0 ? '+' : ''}${Math.abs(item.amount).toFixed(2)}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}
```

### Deep Link Configuration

```typescript
// navigation/linking.ts
import { LinkingOptions } from '@react-navigation/native';
import { RootStackParamList } from './types';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['finapp://', 'https://app.example.com'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Home: 'home',
          Portfolio: 'portfolio/:accountId?',
          Settings: 'settings',
        },
      },
      TransactionDetail: 'transaction/:transactionId',
      Onboarding: 'onboarding',
    },
  },
};
```

```typescript
// App.tsx
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './navigation/RootNavigator';
import { linking } from './navigation/linking';

export default function App() {
  return (
    <NavigationContainer linking={linking}>
      <RootNavigator />
    </NavigationContainer>
  );
}
```

## Key Decisions

- **Conditional screen rendering over `navigation.reset`** -- using conditional JSX in the navigator for onboarding vs main flow prevents back-navigation to onboarding and produces a clean replace animation.
- **Global type declaration for `useNavigation`** -- extending `ReactNavigation.RootParamList` enables type-safe navigation from any component without passing navigator-specific types.
- **Modal presentation for transaction detail** -- presents over the tab bar without disrupting tab state, and the native modal animation signals a contextual overlay.
- **Deep linking config** -- maps URL paths to screens so that push notifications and universal links route correctly.
