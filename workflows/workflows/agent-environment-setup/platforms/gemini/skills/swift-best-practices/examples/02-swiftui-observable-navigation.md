# Example: SwiftUI Navigation with @Observable State

## Scenario

Build a multi-screen app with a tab bar, a settings screen with form bindings, and a detail push navigation. Demonstrate proper state ownership, @Bindable usage, and environment-based dependency passing using @Observable.

## State Architecture

```
App
├── @State var appState: AppState           // owns root state
├── @Environment(\.authService) var auth    // injected service
│
├── Tab: Home
│   ├── HomeView (reads appState.user)
│   └── DetailView (receives item via init)
│
├── Tab: Settings
│   ├── SettingsView (@Bindable for two-way binding)
│   └── ProfileEditorView (child with bindings)
│
└── Tab: Notifications
    └── NotificationListView (async stream)
```

## Root State

```swift
@Observable
final class AppState {
    var user: User?
    var settings: UserSettings
    var notificationCount: Int = 0

    // Property is computed — @Observable tracks reads automatically
    var isLoggedIn: Bool { user != nil }

    init(settings: UserSettings = .defaults) {
        self.settings = settings
    }
}

struct User: Sendable, Identifiable {
    let id: UUID
    var displayName: String
    var email: String
    var avatarURL: URL?
}

struct UserSettings: Sendable {
    var notificationsEnabled: Bool = true
    var theme: AppTheme = .system
    var language: AppLanguage = .english

    static let defaults = UserSettings()
}

enum AppTheme: String, CaseIterable, Sendable {
    case system, light, dark
}

enum AppLanguage: String, CaseIterable, Sendable {
    case english, thai, japanese
}
```

## App Root with Environment Injection

```swift
@main
struct MyApp: App {
    @State private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(appState)
        }
    }
}

struct ContentView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        TabView {
            Tab("Home", systemImage: "house") {
                HomeView()
            }
            Tab("Settings", systemImage: "gear") {
                SettingsView()
            }
            Tab("Notifications", systemImage: "bell") {
                NotificationListView()
            }
            .badge(appState.notificationCount)
        }
    }
}
```

## Settings with @Bindable

```swift
struct SettingsView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        // @Bindable creates bindings from @Observable properties
        @Bindable var state = appState

        NavigationStack {
            Form {
                Section("Profile") {
                    if let user = appState.user {
                        NavigationLink("Edit Profile") {
                            ProfileEditorView(user: $state.user)
                        }
                    }
                }

                Section("Preferences") {
                    Toggle("Notifications", isOn: $state.settings.notificationsEnabled)

                    Picker("Theme", selection: $state.settings.theme) {
                        ForEach(AppTheme.allCases, id: \.self) { theme in
                            Text(theme.rawValue.capitalized).tag(theme)
                        }
                    }

                    Picker("Language", selection: $state.settings.language) {
                        ForEach(AppLanguage.allCases, id: \.self) { lang in
                            Text(lang.rawValue.capitalized).tag(lang)
                        }
                    }
                }

                Section {
                    Button("Sign Out", role: .destructive) {
                        appState.user = nil
                    }
                }
            }
            .navigationTitle("Settings")
        }
    }
}
```

## Profile Editor (Child with Binding)

```swift
struct ProfileEditorView: View {
    @Binding var user: User?

    var body: some View {
        if var editableUser = user {
            Form {
                TextField("Display Name", text: Binding(
                    get: { editableUser.displayName },
                    set: { newValue in
                        editableUser.displayName = newValue
                        user = editableUser
                    }
                ))
                TextField("Email", text: Binding(
                    get: { editableUser.email },
                    set: { newValue in
                        editableUser.email = newValue
                        user = editableUser
                    }
                ))
            }
            .navigationTitle("Edit Profile")
        }
    }
}
```

## Notifications with AsyncStream

```swift
struct NotificationListView: View {
    @Environment(AppState.self) private var appState
    @State private var notifications: [AppNotification] = []

    var body: some View {
        NavigationStack {
            List(notifications) { notification in
                NotificationRow(notification: notification)
            }
            .navigationTitle("Notifications")
            .task {
                // .task auto-cancels when the view disappears
                for await notification in NotificationStream.live {
                    notifications.append(notification)
                    appState.notificationCount = notifications.count
                }
            }
        }
    }
}
```

## Key Decisions

- **@Environment for shared state** — AppState is injected via environment, not passed as init params through every view. Any descendant can access it.
- **@Bindable for two-way binding** — `@Bindable var state = appState` inside the body creates `$state.property` bindings for forms. This is the @Observable-era replacement for @ObservedObject bindings.
- **Value-type models** — User and UserSettings are structs. Mutations create new values, making state changes explicit and Sendable-safe.
- **.task for async work** — The notification listener auto-cancels when the tab is deselected, preventing background resource usage.
- **No @StateObject or @ObservedObject** — These are ObservableObject-era wrappers. @Observable uses @State (for ownership) and @Environment (for sharing).
