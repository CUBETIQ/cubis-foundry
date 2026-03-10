# Sealed Types, Value Classes, and DSL Patterns

## Sealed Class Hierarchies

```kotlin
// Sealed class — closed type hierarchy with exhaustive when
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val exception: Throwable) : Result<Nothing>()
    data object Loading : Result<Nothing>()
}

// Exhaustive when — compiler error if a variant is missing
fun <T> handleResult(result: Result<T>) = when (result) {
    is Result.Success -> displayData(result.data)
    is Result.Error -> showError(result.exception.message)
    Result.Loading -> showSpinner()
    // No else needed — sealed guarantees exhaustiveness
}

// Sealed interface — multiple inheritance allowed
sealed interface UiEvent
sealed interface NavigationEvent : UiEvent

data class ShowScreen(val route: String) : NavigationEvent
data class ShowDialog(val message: String) : UiEvent
data object GoBack : NavigationEvent
```

## Data Classes

```kotlin
// data class gets equals, hashCode, toString, copy, componentN()
data class User(
    val id: UserId,
    val name: String,
    val email: Email,
    val role: Role = Role.USER,
)

// Immutable update with copy
val admin = user.copy(role = Role.ADMIN)

// Destructuring
val (id, name, email) = user
```

## Value Classes (Inline Classes)

```kotlin
// Zero-overhead type wrappers — compiled to the wrapped type at runtime
@JvmInline
value class UserId(val value: Long) {
    init {
        require(value > 0) { "UserId must be positive" }
    }
}

@JvmInline
value class Email(val value: String) {
    init {
        require("@" in value) { "Invalid email: $value" }
    }

    val domain: String get() = value.substringAfter("@")
}

// Type safety without runtime cost
fun sendEmail(to: Email, from: Email) { /* ... */ }

// Can't accidentally swap Email and String
sendEmail(to = Email("alice@example.com"), from = Email("bob@example.com"))
// sendEmail(to = "alice@example.com", from = …) // compile error
```

## Pattern Matching with When

```kotlin
// Type patterns
fun describe(shape: Shape): String = when (shape) {
    is Circle -> "circle r=${shape.radius}"
    is Rectangle -> "rect ${shape.width}x${shape.height}"
    is Triangle -> "triangle"
}

// Guard conditions
fun classify(value: Int): String = when {
    value < 0 -> "negative"
    value == 0 -> "zero"
    value in 1..100 -> "small"
    value in 101..1000 -> "medium"
    else -> "large"
}

// Destructuring in when
fun area(shape: Shape): Double = when (shape) {
    is Circle -> Math.PI * shape.radius * shape.radius
    is Rectangle -> shape.width * shape.height
}

// Multi-branch
fun toHex(color: Color): String = when (color) {
    Color.RED, Color.DARK_RED -> "#FF0000"
    Color.GREEN -> "#00FF00"
    Color.BLUE -> "#0000FF"
}
```

## DSL Builder Patterns

```kotlin
// Type-safe HTML builder
fun html(block: HtmlBuilder.() -> Unit): String {
    return HtmlBuilder().apply(block).build()
}

class HtmlBuilder {
    private val elements = mutableListOf<String>()

    fun head(block: HeadBuilder.() -> Unit) {
        elements += HeadBuilder().apply(block).build()
    }

    fun body(block: BodyBuilder.() -> Unit) {
        elements += BodyBuilder().apply(block).build()
    }

    fun build() = "<html>${elements.joinToString("")}</html>"
}

// Usage
val page = html {
    head {
        title("My Page")
    }
    body {
        h1("Hello, World!")
        p("Welcome to Kotlin DSLs.")
    }
}

// @DslMarker prevents scope leaking
@DslMarker
annotation class HtmlDsl

@HtmlDsl
class BodyBuilder { /* ... */ }
```

## Scope Functions

```kotlin
// let — transform nullable, scoped variable
val email = user?.email?.let { Email(it) }

// apply — configure an object and return it
val request = Request().apply {
    url = "https://api.example.com"
    method = "POST"
    headers["Content-Type"] = "application/json"
}

// also — side effects without changing the chain
val user = repository.findById(id)
    .also { logger.info("Loaded user: ${it.name}") }

// with — operate on an object in a block
val summary = with(report) {
    "$title: $pageCount pages, ${sections.size} sections"
}

// run — combine let + with
val result = service.run {
    connect()
    query("SELECT * FROM users")
}

// When to use which:
// let   — null checks, transforms: x?.let { ... }
// apply — configure + return: Builder().apply { ... }
// also  — side effects: x.also { log(it) }
// with  — multiple calls on same object
// run   — scoped computation: obj.run { ... }
```

## Delegation

```kotlin
// Property delegation
class UserPreferences(private val prefs: SharedPreferences) {
    var theme: String by prefs.string(default = "light")
    var fontSize: Int by prefs.int(default = 14)
    var notifications: Boolean by prefs.boolean(default = true)
}

// lazy delegation — computed once on first access
val heavyResource: Resource by lazy {
    loadExpensiveResource()
}

// observable delegation — react to changes
var name: String by Delegates.observable("initial") { _, old, new ->
    logger.info("Name changed: $old -> $new")
}

// Map delegation — delegate to map entries
class Config(map: Map<String, Any>) {
    val host: String by map
    val port: Int by map
    val debug: Boolean by map
}
val config = Config(mapOf("host" to "localhost", "port" to 8080, "debug" to true))
```
