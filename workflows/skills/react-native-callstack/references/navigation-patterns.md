# Navigation Patterns

Load this when setting up React Navigation, configuring deep linking, or implementing complex navigation flows in React Native.

## Navigator Selection

| Navigator | Use When | Key Trait |
|-----------|----------|-----------|
| Native Stack | Most screen transitions | Native platform animations, best performance |
| Stack | Custom transition animations needed | JS-driven animations, more customizable |
| Bottom Tabs | 3-5 primary sections | Persistent tab bar, each tab keeps its state |
| Material Top Tabs | Swipeable content sections | Gesture-driven tab switching |
| Drawer | Side menu navigation | Slide-out navigation panel |

## Type-Safe Navigation

### Defining the Param List

```typescript
export type RootStackParamList = {
  Home: undefined;
  Profile: { userId: string };
  Settings: undefined;
  EditProfile: { userId: string; field?: 'name' | 'avatar' };
};
```

- `undefined` means the screen takes no parameters.
- Optional params use `?` in the type.
- Always export the param list for use in screen props.

### Global Type Declaration

```typescript
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
```

This enables type-safe `useNavigation()` from any component without passing the type parameter.

### Typed Screen Props

```typescript
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type ProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'Profile'>;

function ProfileScreen({ route, navigation }: ProfileScreenProps) {
  const { userId } = route.params; // type-safe: string
  navigation.navigate('EditProfile', { userId }); // type-checked
}
```

## Nested Navigators

### Tabs Inside Stack

```typescript
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  Modal: { title: string };
};

export type TabParamList = {
  Feed: undefined;
  Search: undefined;
  Profile: undefined;
};
```

Navigate to a nested screen:

```typescript
navigation.navigate('MainTabs', {
  screen: 'Profile',
});
```

### Accessing Parent Navigator

```typescript
import { useNavigation, CompositeScreenProps } from '@react-navigation/native';

// Combine tab props with parent stack props
type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Feed'>,
  NativeStackScreenProps<RootStackParamList>
>;

function FeedScreen({ navigation }: Props) {
  // Can navigate to both tab and stack screens
  navigation.navigate('Modal', { title: 'Hello' });
}
```

## Deep Linking

### Configuration

```typescript
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['myapp://', 'https://app.example.com'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Feed: 'feed',
          Profile: 'profile/:userId',
        },
      },
      Modal: 'modal/:title',
    },
  },
};
```

### Universal Links (iOS)

Requires Associated Domains entitlement and an `apple-app-site-association` file on your server.

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.example.app",
        "paths": ["/profile/*", "/feed"]
      }
    ]
  }
}
```

### App Links (Android)

Requires intent filter in AndroidManifest.xml and a `.well-known/assetlinks.json` on your server.

```xml
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="https" android:host="app.example.com" />
</intent-filter>
```

## Navigation State Persistence

```typescript
const [isReady, setIsReady] = useState(false);
const [initialState, setInitialState] = useState();

useEffect(() => {
  AsyncStorage.getItem('NAV_STATE').then((state) => {
    if (state) setInitialState(JSON.parse(state));
    setIsReady(true);
  });
}, []);

if (!isReady) return null;

<NavigationContainer
  initialState={initialState}
  onStateChange={(state) => {
    AsyncStorage.setItem('NAV_STATE', JSON.stringify(state));
  }}
>
```

- Useful for restoring the user's position after app background/kill.
- Do not persist state in production if your navigation structure changes between versions. Guard with a version check.

## Auth Flow Pattern

```typescript
function RootNavigator() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) return <SplashScreen />;

  return (
    <Stack.Navigator>
      {isLoggedIn ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
```

- Conditional rendering ensures the user cannot navigate back to auth screens after login.
- React Navigation handles the transition animation automatically.

## Performance Considerations

- Use `native-stack` over `stack` for native animations that do not block the JS thread.
- Set `detachInactiveScreens: true` (default) to free memory for off-screen tabs.
- Use `freezeOnBlur: true` on tabs to prevent re-renders of hidden screens.
- Avoid passing large objects as route params. Pass IDs and fetch data in the screen.
- Use `React.memo` on screen components to prevent re-renders from navigation state changes.
