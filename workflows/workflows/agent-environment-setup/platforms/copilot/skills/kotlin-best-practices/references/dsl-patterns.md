# DSL Patterns Reference

## Type-Safe Builders

### Basic DSL Builder

```kotlin
// The builder pattern using Kotlin's receiver lambdas
class HtmlBuilder {
    private val elements = mutableListOf<String>()

    fun head(block: HeadBuilder.() -> Unit) {
        val builder = HeadBuilder().apply(block)
        elements.add("<head>${builder.build()}</head>")
    }

    fun body(block: BodyBuilder.() -> Unit) {
        val builder = BodyBuilder().apply(block)
        elements.add("<body>${builder.build()}</body>")
    }

    fun build(): String = "<html>${elements.joinToString("\n")}</html>"
}

fun html(block: HtmlBuilder.() -> Unit): String {
    return HtmlBuilder().apply(block).build()
}

// Usage -- reads like a declarative specification
val page = html {
    head {
        title("My Page")
        meta(charset = "utf-8")
    }
    body {
        h1("Welcome")
        p("Hello, world!")
    }
}
```

### @DslMarker to Prevent Scope Leakage

Without `@DslMarker`, inner lambdas can accidentally call outer scope methods:

```kotlin
// Problem: body { } can accidentally call head { } methods
html {
    body {
        title("Oops")  // This calls HeadBuilder.title from outer scope!
    }
}

// Solution: @DslMarker restricts implicit receivers
@DslMarker
annotation class HtmlDsl

@HtmlDsl
class HtmlBuilder { /* ... */ }

@HtmlDsl
class HeadBuilder { /* ... */ }

@HtmlDsl
class BodyBuilder { /* ... */ }

// Now this is a compile error:
html {
    body {
        title("Oops")  // ERROR: 'title' is resolved to HeadBuilder
                         // which is not in the current scope
    }
}
```

## Configuration DSLs

### Server Configuration

```kotlin
@DslMarker
annotation class ServerDsl

@ServerDsl
class ServerConfig {
    var host: String = "0.0.0.0"
    var port: Int = 8080

    private var _ssl: SslConfig? = null
    private var _routes: MutableList<Route> = mutableListOf()
    private var _middleware: MutableList<Middleware> = mutableListOf()

    fun ssl(block: SslConfig.() -> Unit) {
        _ssl = SslConfig().apply(block)
    }

    fun routing(block: RoutingConfig.() -> Unit) {
        RoutingConfig(_routes).apply(block)
    }

    fun middleware(block: MiddlewareConfig.() -> Unit) {
        MiddlewareConfig(_middleware).apply(block)
    }

    fun build(): Server = Server(host, port, _ssl, _routes, _middleware)
}

@ServerDsl
class SslConfig {
    var certFile: String = ""
    var keyFile: String = ""
    var protocols: List<String> = listOf("TLSv1.3")
}

@ServerDsl
class RoutingConfig(private val routes: MutableList<Route>) {
    fun get(path: String, handler: suspend (Request) -> Response) {
        routes.add(Route("GET", path, handler))
    }

    fun post(path: String, handler: suspend (Request) -> Response) {
        routes.add(Route("POST", path, handler))
    }

    fun group(prefix: String, block: RoutingConfig.() -> Unit) {
        val nested = RoutingConfig(mutableListOf()).apply(block)
        routes.addAll(nested.routes.map { it.copy(path = "$prefix${it.path}") })
    }
}

// Usage
val server = server {
    host = "0.0.0.0"
    port = 443

    ssl {
        certFile = "/certs/server.pem"
        keyFile = "/certs/server.key"
    }

    middleware {
        cors(allowOrigin = "*")
        rateLimit(requestsPerMinute = 100)
        logging()
    }

    routing {
        get("/health") { Response.ok("healthy") }

        group("/api/v1") {
            get("/users") { req -> userController.list(req) }
            post("/users") { req -> userController.create(req) }
            get("/users/{id}") { req -> userController.get(req) }
        }
    }
}
```

## Builder Functions from stdlib

Kotlin's standard library uses this pattern extensively:

```kotlin
// buildList -- efficient list construction
val items = buildList {
    add("first")
    addAll(existingItems)
    if (includeExtra) add("extra")
}

// buildMap -- efficient map construction
val config = buildMap {
    put("host", "localhost")
    put("port", 8080)
    putAll(overrides)
}

// buildString -- efficient string construction
val csv = buildString {
    appendLine("id,name,email")
    for (user in users) {
        appendLine("${user.id},${user.name},${user.email}")
    }
}

// apply -- configure an existing object
val textView = TextView(context).apply {
    text = "Hello"
    textSize = 16f
    setTextColor(Color.BLACK)
}

// also -- side effects (logging, validation)
val user = repository.findById(id)
    .also { logger.debug("Found user: ${it?.name}") }
    ?: throw NotFoundException(id)
```

## Sealed Types as DSL Results

```kotlin
// DSL that produces a type-safe query
sealed interface QueryFilter {
    data class Equals(val field: String, val value: Any) : QueryFilter
    data class GreaterThan(val field: String, val value: Comparable<*>) : QueryFilter
    data class Contains(val field: String, val value: String) : QueryFilter
    data class And(val filters: List<QueryFilter>) : QueryFilter
    data class Or(val filters: List<QueryFilter>) : QueryFilter
}

@DslMarker
annotation class QueryDsl

@QueryDsl
class QueryBuilder {
    private val filters = mutableListOf<QueryFilter>()

    infix fun String.eq(value: Any) {
        filters.add(QueryFilter.Equals(this, value))
    }

    infix fun String.gt(value: Comparable<*>) {
        filters.add(QueryFilter.GreaterThan(this, value))
    }

    infix fun String.contains(value: String) {
        filters.add(QueryFilter.Contains(this, value))
    }

    fun or(block: QueryBuilder.() -> Unit) {
        val nested = QueryBuilder().apply(block)
        filters.add(QueryFilter.Or(nested.filters))
    }

    internal val result: QueryFilter
        get() = if (filters.size == 1) filters.first()
                else QueryFilter.And(filters)
}

fun query(block: QueryBuilder.() -> Unit): QueryFilter {
    return QueryBuilder().apply(block).result
}

// Usage
val filter = query {
    "status" eq "active"
    "age" gt 18
    or {
        "name" contains "Alice"
        "name" contains "Bob"
    }
}
```

## Value Classes for DSL Type Safety

```kotlin
@JvmInline
value class Pixels(val value: Int)

@JvmInline
value class Dp(val value: Float)

@JvmInline
value class Milliseconds(val value: Long)

// Extension properties for DSL-like syntax
val Int.px get() = Pixels(this)
val Int.dp get() = Dp(this.toFloat())
val Int.ms get() = Milliseconds(this.toLong())
val Int.seconds get() = Milliseconds(this * 1_000L)

// Usage
fun animate(duration: Milliseconds, delay: Milliseconds = 0.ms) { /* ... */ }

animate(duration = 300.ms, delay = 1.seconds)
// animate(duration = 300, delay = 1000) // Compile error -- type safety!
```

## Extension Functions as DSL Building Blocks

```kotlin
// Scoped extensions visible only in DSL context
class TestDsl {
    // These extensions only work inside TestDsl receivers
    fun String.shouldEqual(expected: String) {
        assertEquals(expected, this)
    }

    fun <T> T?.shouldNotBeNull(): T {
        assertNotNull(this)
        return this
    }

    fun <T> List<T>.shouldHaveSize(expected: Int) {
        assertEquals(expected, this.size)
    }
}

fun test(name: String, block: TestDsl.() -> Unit) {
    TestDsl().block()
}

// Usage
test("user lookup") {
    val user = repository.findById("1").shouldNotBeNull()
    user.name.shouldEqual("Alice")
    user.orders.shouldHaveSize(3)
}
```
