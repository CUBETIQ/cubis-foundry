# SwiftUI Patterns Reference

## @Observable State Management

### Migrating from ObservableObject

| Old (ObservableObject) | New (@Observable) |
| --- | --- |
| `class VM: ObservableObject` | `@Observable class VM` |
| `@Published var items: [Item]` | `var items: [Item]` |
| `@StateObject var vm` | `@State var vm` |
| `@ObservedObject var vm` | Pass via init (plain property) |
| `@EnvironmentObject var vm` | `@Environment(VM.self) var vm` |
| `$vm.property` binding | `@Bindable var vm` then `$vm.property` |

### State ownership rules

```swift
// OWNS the state — use @State
struct ParentView: View {
    @State private var viewModel = SettingsViewModel()

    var body: some View {
        SettingsForm(viewModel: viewModel)
    }
}

// BORROWS the state — plain property
struct SettingsForm: View {
    var viewModel: SettingsViewModel

    var body: some View {
        // Read-only access works directly
        Text(viewModel.username)
    }
}

// NEEDS BINDING — use @Bindable
struct EditableSettingsForm: View {
    @Bindable var viewModel: SettingsViewModel

    var body: some View {
        TextField("Username", text: $viewModel.username)
        Toggle("Dark Mode", isOn: $viewModel.darkModeEnabled)
    }
}
```

### Environment injection

```swift
// Register in parent
@main
struct MyApp: App {
    @State private var appState = AppState()
    @State private var themeManager = ThemeManager()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(appState)
                .environment(themeManager)
        }
    }
}

// Consume in any descendant
struct ProfileView: View {
    @Environment(AppState.self) private var appState
    @Environment(ThemeManager.self) private var theme

    var body: some View {
        Text(appState.currentUser?.name ?? "Guest")
            .foregroundStyle(theme.primaryColor)
    }
}
```

## Navigation Patterns

### NavigationStack with typed path

```swift
@Observable
class NavigationRouter {
    var path = NavigationPath()

    func navigate(to destination: AppDestination) {
        path.append(destination)
    }

    func popToRoot() {
        path = NavigationPath()
    }
}

enum AppDestination: Hashable {
    case productDetail(ProductID)
    case orderSummary(OrderID)
    case settings
    case profile(UserID)
}

struct CatalogView: View {
    @Environment(NavigationRouter.self) private var router

    var body: some View {
        @Bindable var router = router

        NavigationStack(path: $router.path) {
            ProductListView()
                .navigationDestination(for: AppDestination.self) { destination in
                    switch destination {
                    case .productDetail(let id):
                        ProductDetailView(productId: id)
                    case .orderSummary(let id):
                        OrderSummaryView(orderId: id)
                    case .settings:
                        SettingsView()
                    case .profile(let id):
                        ProfileView(userId: id)
                    }
                }
        }
    }
}
```

### Sheet and alert state

```swift
@Observable
class SheetCoordinator {
    var activeSheet: SheetType?
    var alertMessage: String?
    var showAlert: Bool { alertMessage != nil }

    enum SheetType: Identifiable {
        case addItem
        case editItem(ItemID)
        case filter

        var id: String {
            switch self {
            case .addItem: "add"
            case .editItem(let id): "edit-\(id)"
            case .filter: "filter"
            }
        }
    }
}
```

## View Composition Patterns

### Extract subviews to reduce body complexity

```swift
// BAD — monolithic body
struct OrderView: View {
    var body: some View {
        VStack {
            // 50 lines of header...
            // 30 lines of items list...
            // 20 lines of totals...
            // 15 lines of actions...
        }
    }
}

// GOOD — composed from focused subviews
struct OrderView: View {
    let order: Order

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                OrderHeader(order: order)
                OrderItemsList(items: order.items)
                OrderTotals(subtotal: order.subtotal, tax: order.tax, total: order.total)
                OrderActions(status: order.status, onCancel: cancelOrder)
            }
        }
    }

    private func cancelOrder() { /* ... */ }
}

// Subview receives only the data it needs — not the whole order
struct OrderTotals: View {
    let subtotal: Decimal
    let tax: Decimal
    let total: Decimal

    var body: some View {
        VStack(alignment: .trailing) {
            LabeledContent("Subtotal", value: subtotal, format: .currency(code: "USD"))
            LabeledContent("Tax", value: tax, format: .currency(code: "USD"))
            LabeledContent("Total", value: total, format: .currency(code: "USD"))
                .fontWeight(.bold)
        }
    }
}
```

### ViewModifier for reusable styling

```swift
struct CardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding()
            .background(.background, in: RoundedRectangle(cornerRadius: 12))
            .shadow(color: .black.opacity(0.1), radius: 4, y: 2)
    }
}

extension View {
    func cardStyle() -> some View {
        modifier(CardModifier())
    }
}

// Usage
OrderTotals(subtotal: 99.00, tax: 8.91, total: 107.91)
    .cardStyle()
```

## Async Data Loading

### .task modifier with cancellation

```swift
struct UserProfileView: View {
    let userId: String
    @State private var profile: Profile?
    @State private var error: Error?
    @State private var isLoading = true

    var body: some View {
        Group {
            if let profile {
                ProfileContent(profile: profile)
            } else if let error {
                ErrorView(error: error, retry: loadProfile)
            } else {
                ProgressView()
            }
        }
        .task(id: userId) {
            // Reruns if userId changes; cancels previous task automatically
            await loadProfile()
        }
    }

    private func loadProfile() async {
        isLoading = true
        defer { isLoading = false }

        do {
            profile = try await ProfileService.shared.fetch(userId)
            error = nil
        } catch {
            if !Task.isCancelled {
                self.error = error
            }
        }
    }
}
```

### Searchable with debouncing

```swift
struct SearchView: View {
    @State private var query = ""
    @State private var results: [SearchResult] = []
    @State private var searchTask: Task<Void, Never>?

    var body: some View {
        List(results) { result in
            SearchResultRow(result: result)
        }
        .searchable(text: $query)
        .onChange(of: query) { _, newValue in
            searchTask?.cancel()
            searchTask = Task {
                try? await Task.sleep(for: .milliseconds(300))
                guard !Task.isCancelled else { return }
                results = await SearchService.search(newValue)
            }
        }
    }
}
```

## Performance Tips

### Minimize redraws with fine-grained observation

With `@Observable`, SwiftUI tracks exactly which properties a view reads. Only views that read a changed property redraw.

```swift
@Observable
class DashboardState {
    var notifications: [Notification] = []    // Only NotificationBadge redraws
    var currentTab: Tab = .home              // Only TabSelector redraws
    var userName: String = ""                  // Only HeaderView redraws
}
```

### Avoid creating objects in body

```swift
// BAD — creates a new DateFormatter every body evaluation
var body: some View {
    Text(item.date, formatter: DateFormatter()) // new instance each time
}

// GOOD — static or cached formatter
private static let dateFormatter: DateFormatter = {
    let f = DateFormatter()
    f.dateStyle = .medium
    return f
}()

var body: some View {
    Text(item.date, formatter: Self.dateFormatter)
}
```

### Use `EquatableView` or custom `Equatable` for expensive views

```swift
struct ExpensiveChartView: View, Equatable {
    let dataPoints: [DataPoint]

    static func == (lhs: Self, rhs: Self) -> Bool {
        lhs.dataPoints.count == rhs.dataPoints.count &&
        lhs.dataPoints.last?.value == rhs.dataPoints.last?.value
    }

    var body: some View {
        // Complex chart rendering
    }
}
```
