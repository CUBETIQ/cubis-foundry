# Kotlin Multiplatform Reference

## Project Structure

### Source Set Layout

```
shared/
  src/
    commonMain/     # Shared code (pure Kotlin, no platform APIs)
    commonTest/     # Shared tests
    androidMain/    # Android-specific implementations
    androidTest/    # Android-specific tests (instrumented or unit)
    iosMain/        # iOS-specific implementations (Kotlin/Native)
    iosTest/        # iOS-specific tests
    jvmMain/        # JVM server-specific implementations
    jvmTest/        # JVM server-specific tests
    jsMain/         # JavaScript target (browser or Node.js)
    wasmJsMain/     # Wasm target for browsers
```

### build.gradle.kts

```kotlin
plugins {
    kotlin("multiplatform") version "2.1.0"
    kotlin("plugin.serialization") version "2.1.0"
    id("com.android.library")
}

kotlin {
    // Targets
    androidTarget()

    listOf(iosX64(), iosArm64(), iosSimulatorArm64()).forEach {
        it.binaries.framework {
            baseName = "shared"
            isStatic = true  // Static framework for easier CocoaPods integration
        }
    }

    jvm()

    // Source sets
    sourceSets {
        commonMain.dependencies {
            implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.9.0")
            implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
            implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.6.1")
            implementation("io.ktor:ktor-client-core:3.0.2")
        }

        commonTest.dependencies {
            implementation(kotlin("test"))
            implementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.9.0")
            implementation("app.cash.turbine:turbine:1.2.0")
        }

        androidMain.dependencies {
            implementation("io.ktor:ktor-client-okhttp:3.0.2")
        }

        iosMain.dependencies {
            implementation("io.ktor:ktor-client-darwin:3.0.2")
        }

        jvmMain.dependencies {
            implementation("io.ktor:ktor-client-java:3.0.2")
        }
    }
}
```

## expect/actual Pattern

### When to Use expect/actual

Use `expect`/`actual` for functionality that genuinely differs across platforms. Common cases:
- Logging (Android Log, iOS NSLog, JVM SLF4J)
- File system access
- Platform-specific crypto
- UUID generation
- Date/time formatting with locale

### Declaration Rules

```kotlin
// commonMain: expect declaration (no body)
expect fun platformName(): String

expect class PlatformLogger(tag: String) {
    fun debug(message: String)
    fun error(message: String, throwable: Throwable? = null)
}

// androidMain: actual implementation
actual fun platformName(): String = "Android ${Build.VERSION.SDK_INT}"

actual class PlatformLogger actual constructor(private val tag: String) {
    actual fun debug(message: String) = Log.d(tag, message)
    actual fun error(message: String, throwable: Throwable?) {
        Log.e(tag, message, throwable)
    }
}

// iosMain: actual implementation
actual fun platformName(): String = UIDevice.currentDevice.systemName()

actual class PlatformLogger actual constructor(private val tag: String) {
    actual fun debug(message: String) = NSLog("[$tag] $message")
    actual fun error(message: String, throwable: Throwable?) {
        NSLog("[$tag] ERROR: $message ${throwable?.message ?: ""}")
    }
}
```

### Prefer Interfaces Over expect/actual When Possible

```kotlin
// BETTER: interface in commonMain with platform-injected implementations
// This is more testable and does not require compiler-level linking

// commonMain
interface Logger {
    fun debug(message: String)
    fun error(message: String, throwable: Throwable? = null)
}

// androidMain
class AndroidLogger(private val tag: String) : Logger {
    override fun debug(message: String) = Log.d(tag, message)
    override fun error(message: String, throwable: Throwable?) = Log.e(tag, message, throwable)
}

// Injected via constructor or DI framework
class UserRepository(private val logger: Logger) {
    // testable with a FakeLogger
}
```

## Cross-Platform Libraries

### kotlinx.serialization (JSON)

```kotlin
// commonMain -- works on all platforms
@Serializable
data class ApiUser(
    @SerialName("user_id") val id: String,
    val name: String,
    val email: String,
    @SerialName("created_at") val createdAt: Instant,
)

@Serializable
sealed interface ApiResponse<out T> {
    @Serializable
    @SerialName("success")
    data class Success<T>(val data: T) : ApiResponse<T>

    @Serializable
    @SerialName("error")
    data class Error(val code: String, val message: String) : ApiResponse<Nothing>
}

// Configure Json instance
val json = Json {
    ignoreUnknownKeys = true          // Forward compatibility
    isLenient = false                  // Strict parsing
    encodeDefaults = true              // Include default values
    prettyPrint = false                // Compact output
    classDiscriminator = "type"        // Polymorphic discriminator
}

val user = json.decodeFromString<ApiUser>(jsonString)
val jsonString = json.encodeToString(user)
```

### kotlinx.datetime

```kotlin
// commonMain -- replaces java.time for multiplatform
import kotlinx.datetime.*

val now: Instant = Clock.System.now()
val today: LocalDate = now.toLocalDateTime(TimeZone.currentSystemDefault()).date
val utcDateTime: LocalDateTime = now.toLocalDateTime(TimeZone.UTC)

// Duration
val duration = 5.hours + 30.minutes
val deadline = now + 24.hours

// Difference between dates
val daysBetween = startDate.daysUntil(endDate)
```

### Ktor Client

```kotlin
// commonMain -- engine injected per platform
class ApiClient(engine: HttpClientEngine) {
    private val client = HttpClient(engine) {
        install(ContentNegotiation) { json(json) }
        install(HttpTimeout) {
            requestTimeoutMillis = 10_000
            connectTimeoutMillis = 5_000
        }
        defaultRequest {
            url("https://api.example.com/")
            header("Accept", "application/json")
        }
    }

    suspend fun getUser(id: String): ApiUser {
        return client.get("users/$id").body()
    }
}

// androidMain: OkHttp engine
val client = ApiClient(OkHttp.create())

// iosMain: Darwin engine
val client = ApiClient(Darwin.create())
```

## iOS Integration

### Swift Interop via SKIE

```kotlin
// SKIE generates Swift-friendly wrappers for:
// - Sealed classes -> Swift enums
// - Flow -> AsyncSequence
// - suspend functions -> async/await

// Kotlin
sealed interface OrderState {
    data class Pending(val id: String) : OrderState
    data class Shipped(val trackingNumber: String) : OrderState
}

// Swift (with SKIE)
switch orderState {
case .pending(let state): print(state.id)
case .shipped(let state): print(state.trackingNumber)
}
```

### Collecting Flow from Swift

```kotlin
// Kotlin: expose Flow in shared module
class OrderRepository {
    fun observeOrders(): Flow<List<Order>> = orderFlow
}

// Swift (with SKIE)
for await orders in repository.observeOrders() {
    updateUI(orders)
}

// Without SKIE: use a wrapper
class FlowCollector<T>(private val flow: Flow<T>) {
    fun collect(
        scope: CoroutineScope,
        onEach: (T) -> Unit,
        onError: (Throwable) -> Unit,
        onComplete: () -> Unit,
    ): Cancellable {
        val job = scope.launch {
            try {
                flow.collect { onEach(it) }
                onComplete()
            } catch (e: CancellationException) {
                throw e
            } catch (e: Throwable) {
                onError(e)
            }
        }
        return object : Cancellable { override fun cancel() = job.cancel() }
    }
}
```

## Architecture Patterns

### Clean Architecture for KMP

```
commonMain/
  domain/           # Entities, value objects, repository interfaces
    model/           # Sealed types, data classes
    repository/      # Interface definitions (no implementation)
  usecase/           # Application logic (suspend functions)
  data/
    remote/          # API models, network client abstraction
    local/           # Local storage abstraction
    repository/      # Repository implementations composing remote + local

androidMain/
  di/                # Koin/Hilt module providing platform implementations
  data/
    local/           # Room or SQLDelight driver

iosMain/
  di/                # Koin module for iOS
  data/
    local/           # SQLDelight native driver
```

The key principle: `domain/` has zero platform dependencies. Everything platform-specific is injected from the outside.
