# Java-Kotlin Interop Reference

## Calling Java from Kotlin

### Nullability of Java Types

Java types without nullability annotations are **platform types** in Kotlin, denoted as `Type!`. They can be treated as either nullable or non-nullable, but incorrect assumptions crash at runtime.

```kotlin
// Java code
public class UserRepository {
    public User findById(String id) { ... }  // May return null
    public List<User> findAll() { ... }      // May return null list
}

// Kotlin: platform types are dangerous
val user = repository.findById("1")  // Type is User! (platform type)
user.name  // Compiles, but NPE if user is null

// SAFE: treat as nullable until proven otherwise
val user: User? = repository.findById("1")
val name = user?.name ?: "Unknown"

// BEST: add @Nullable/@NonNull to the Java code
// Java:
@Nullable public User findById(String id) { ... }
@NonNull public List<User> findAll() { ... }
```

### Annotations That Kotlin Recognizes

| Annotation Source | @Nullable | @NonNull |
| --- | --- | --- |
| JSpecify | `@Nullable` | `@NonNull` |
| JetBrains | `@Nullable` | `@NotNull` |
| JSR-305 | `@Nullable` | `@Nonnull` |
| Android | `@Nullable` | `@NonNull` |
| Eclipse | `@Nullable` | `@NonNull` |

**Recommendation**: Use JSpecify annotations (`org.jspecify:jspecify`) as they are becoming the standard.

### Java Collections in Kotlin

```kotlin
// Java collections are mutable in Kotlin
val javaList: MutableList<String> = JavaClass.getNames()  // MutableList
val kotlinList: List<String> = javaList  // Upcast to read-only view
// But javaList and kotlinList share the same backing list!
// Mutations via javaList are visible through kotlinList.

// SAFE: copy if immutability is required
val safeCopy: List<String> = javaList.toList()
```

### SAM Conversions (Java Functional Interfaces)

```kotlin
// Java
public interface Callback<T> {
    void onResult(T result);
}

public void fetchAsync(Callback<User> callback) { ... }

// Kotlin: SAM conversion -- lambda instead of anonymous class
service.fetchAsync { user ->
    println(user.name)
}

// Kotlin: explicit SAM constructor (when ambiguous)
service.fetchAsync(Callback { user ->
    println(user.name)
})
```

## Calling Kotlin from Java

### @JvmStatic for Companion Object Methods

```kotlin
class UserValidator {
    companion object {
        @JvmStatic
        fun isValid(email: String): Boolean = email.contains("@")

        // Without @JvmStatic:
        // Java: UserValidator.Companion.isValid(email) -- awkward
        // With @JvmStatic:
        // Java: UserValidator.isValid(email) -- natural
    }
}
```

### @JvmField for Direct Field Access

```kotlin
class Config {
    @JvmField val maxRetries = 3
    // Without @JvmField: Java calls config.getMaxRetries()
    // With @JvmField: Java calls config.maxRetries (direct field access)
}

// Most useful for constants
object Constants {
    @JvmField val MAX_CONNECTIONS = 100
    // Java: Constants.MAX_CONNECTIONS (no getter)
}
```

### @JvmOverloads for Default Parameters

```kotlin
class HttpClient {
    @JvmOverloads
    fun request(
        url: String,
        method: String = "GET",
        headers: Map<String, String> = emptyMap(),
        timeout: Long = 5000,
    ): Response { ... }
}

// Java can now call:
// client.request("https://api.example.com")
// client.request("https://api.example.com", "POST")
// client.request("https://api.example.com", "POST", headers)
// Without @JvmOverloads, Java must pass ALL parameters
```

### @JvmName for Name Conflicts

```kotlin
// Kotlin allows overloading by return type (via name mangling)
// but Java does not. Use @JvmName to avoid conflicts.

@JvmName("getStringUsers")
fun getUsers(): List<String> = listOf("Alice", "Bob")

@JvmName("getUserObjects")
fun getUsers(): List<User> = listOf(User("Alice"), User("Bob"))
```

### Exposing Kotlin Extension Functions to Java

```kotlin
// Extension function
fun String.toSlug(): String = this.lowercase().replace(" ", "-")

// Generated Java signature:
// public static String toSlug(String receiver)
// Java: StringExtensionsKt.toSlug("Hello World")

// Use @JvmName on the file to change the generated class name
@file:JvmName("StringUtils")
package com.example.util

fun String.toSlug(): String = this.lowercase().replace(" ", "-")
// Java: StringUtils.toSlug("Hello World")
```

## Migration Patterns

### Gradual Java-to-Kotlin Migration

1. **Start with data classes**: Convert Java POJOs/DTOs to Kotlin data classes first. They have no behavior, so risk is low.

2. **Convert utility classes**: Static utility methods become top-level functions or extension functions.

3. **Convert tests**: Kotlin tests are often half the lines. JUnit 5 works identically.

4. **Convert services last**: These have the most behavior and integration points.

```kotlin
// Step 1: Java DTO -> Kotlin data class
// Before (Java, ~60 lines with equals/hashCode/toString)
public class UserDto {
    private final String id;
    private final String name;
    // ... constructor, getters, equals, hashCode, toString
}

// After (Kotlin, 1 line)
data class UserDto(val id: String, val name: String)
```

### Annotation Processing (kapt vs KSP)

```kotlin
// kapt (Kotlin Annotation Processing Tool) -- wraps Java annotation processors
// Slower because it generates Java stubs first
plugins {
    kotlin("kapt")
}
dependencies {
    kapt("com.google.dagger:dagger-compiler:2.51")
}

// KSP (Kotlin Symbol Processing) -- native Kotlin processing
// 2x faster than kapt, direct Kotlin AST access
plugins {
    id("com.google.devtools.ksp") version "2.1.0-1.0.29"
}
dependencies {
    ksp("io.insert-koin:koin-ksp-compiler:1.4.0")
}

// Migration: prefer KSP when the library supports it
// Libraries with KSP support: Room, Moshi, Koin, Hilt (experimental)
// Libraries requiring kapt: Dagger (classic), some legacy processors
```

### Build Configuration for Mixed Projects

```kotlin
// build.gradle.kts for a project with both Java and Kotlin
plugins {
    kotlin("jvm") version "2.1.0"
    java
}

kotlin {
    jvmToolchain(21)

    compilerOptions {
        jvmTarget = JvmTarget.JVM_21
        freeCompilerArgs.addAll(
            "-Xjvm-default=all",     // Generate default methods in interfaces
            "-opt-in=kotlin.RequiresOptIn",
        )
    }
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

// Source layout: Java and Kotlin sources can coexist
// src/main/java/   -- Java files
// src/main/kotlin/ -- Kotlin files
// Both are compiled together with cross-references working
```

## Common Interop Pitfalls

| Issue | Cause | Fix |
| --- | --- | --- |
| NPE from Java return | Platform types treated as non-null | Annotate Java with `@Nullable` or treat as `Type?` in Kotlin |
| `UnsupportedOperationException` from `List.add()` | Kotlin's `listOf()` returns unmodifiable list | Use `mutableListOf()` or `ArrayList()` when Java callers need mutability |
| `NoSuchMethodError` at runtime | Kotlin inline class erased to primitive | Add `@JvmInline` and check generated bytecode |
| Cannot access Kotlin `internal` from Java | `internal` becomes `public` in bytecode (mangled name) | Use `@JvmName` or restructure visibility |
| Java cannot call Kotlin default parameters | Java does not support default values | Add `@JvmOverloads` to the Kotlin function |
| Coroutines not callable from Java | `suspend` functions have a `Continuation` parameter | Wrap in a non-suspend function returning `CompletableFuture` |

### Exposing Coroutines to Java

```kotlin
// Kotlin coroutine
suspend fun getUser(id: String): User { ... }

// Java-friendly wrapper
fun getUserFuture(id: String): CompletableFuture<User> {
    return scope.future { getUser(id) }
}

// Or using kotlinx-coroutines-jdk8
import kotlinx.coroutines.future.future

fun getUserFuture(id: String): CompletableFuture<User> =
    scope.future { getUser(id) }
```
