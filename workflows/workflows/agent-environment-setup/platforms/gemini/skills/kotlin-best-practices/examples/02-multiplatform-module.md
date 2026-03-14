# Example: Kotlin Multiplatform Shared Module with Flow

## Scenario

A KMP project shares an order tracking domain between Android and iOS apps. The shared module contains sealed order states, a repository interface returning Flow, kotlinx.serialization models for the REST API, and expect/actual declarations for platform logging.

## Module Structure

```
shared/
  build.gradle.kts
  src/
    commonMain/kotlin/com/example/orders/
      model/OrderState.kt
      model/ApiModels.kt
      repository/OrderRepository.kt
      platform/Logger.kt
    androidMain/kotlin/com/example/orders/
      platform/Logger.android.kt
    iosMain/kotlin/com/example/orders/
      platform/Logger.ios.kt
```

## build.gradle.kts

```kotlin
plugins {
    kotlin("multiplatform")
    kotlin("plugin.serialization")
    id("com.android.library")
}

kotlin {
    androidTarget()
    iosX64()
    iosArm64()
    iosSimulatorArm64()

    sourceSets {
        commonMain.dependencies {
            implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.9.0")
            implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
            implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.6.1")
        }
        commonTest.dependencies {
            implementation(kotlin("test"))
            implementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.9.0")
            implementation("app.cash.turbine:turbine:1.2.0")
        }
    }
}
```

## commonMain: Domain Model

### model/OrderState.kt

```kotlin
package com.example.orders.model

import kotlinx.datetime.Instant
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
sealed interface OrderState {
    val orderId: String
    val updatedAt: Instant

    @Serializable
    @SerialName("placed")
    data class Placed(
        override val orderId: String,
        override val updatedAt: Instant,
        val itemCount: Int,
    ) : OrderState

    @Serializable
    @SerialName("confirmed")
    data class Confirmed(
        override val orderId: String,
        override val updatedAt: Instant,
        val estimatedDelivery: Instant,
    ) : OrderState

    @Serializable
    @SerialName("shipped")
    data class Shipped(
        override val orderId: String,
        override val updatedAt: Instant,
        val trackingNumber: String,
        val carrier: String,
    ) : OrderState

    @Serializable
    @SerialName("delivered")
    data class Delivered(
        override val orderId: String,
        override val updatedAt: Instant,
        val deliveredAt: Instant,
        val signedBy: String?,
    ) : OrderState

    @Serializable
    @SerialName("cancelled")
    data class Cancelled(
        override val orderId: String,
        override val updatedAt: Instant,
        val reason: String,
    ) : OrderState
}

// Exhaustive state description -- compiler enforces all branches
fun OrderState.displayStatus(): String = when (this) {
    is OrderState.Placed -> "Order placed ($itemCount items)"
    is OrderState.Confirmed -> "Confirmed, delivery by $estimatedDelivery"
    is OrderState.Shipped -> "Shipped via $carrier ($trackingNumber)"
    is OrderState.Delivered -> "Delivered" + (signedBy?.let { ", signed by $it" } ?: "")
    is OrderState.Cancelled -> "Cancelled: $reason"
}
```

### model/ApiModels.kt

```kotlin
package com.example.orders.model

import kotlinx.serialization.Serializable

@Serializable
data class OrderListResponse(
    val orders: List<OrderState>,
    val totalCount: Int,
    val nextCursor: String? = null,
)
```

### repository/OrderRepository.kt

```kotlin
package com.example.orders.repository

import com.example.orders.model.OrderState
import kotlinx.coroutines.flow.Flow

interface OrderRepository {
    /** Emits the current state whenever the order updates. */
    fun observeOrder(orderId: String): Flow<OrderState>

    /** Emits the full list whenever any order changes. */
    fun observeAllOrders(): Flow<List<OrderState>>

    /** One-shot fetch with network call. */
    suspend fun refreshOrders()
}
```

## commonMain: Platform Abstraction

### platform/Logger.kt

```kotlin
package com.example.orders.platform

// expect declaration -- each platform provides the actual implementation
expect fun logDebug(tag: String, message: String)
expect fun logError(tag: String, message: String, throwable: Throwable? = null)
```

## androidMain: Platform Implementation

### platform/Logger.android.kt

```kotlin
package com.example.orders.platform

import android.util.Log

actual fun logDebug(tag: String, message: String) {
    Log.d(tag, message)
}

actual fun logError(tag: String, message: String, throwable: Throwable?) {
    if (throwable != null) {
        Log.e(tag, message, throwable)
    } else {
        Log.e(tag, message)
    }
}
```

## iosMain: Platform Implementation

### platform/Logger.ios.kt

```kotlin
package com.example.orders.platform

import platform.Foundation.NSLog

actual fun logDebug(tag: String, message: String) {
    NSLog("[$tag] DEBUG: $message")
}

actual fun logError(tag: String, message: String, throwable: Throwable?) {
    val suffix = throwable?.let { " | ${it.message}" } ?: ""
    NSLog("[$tag] ERROR: $message$suffix")
}
```

## Testing the Shared Module

### commonTest: OrderStateTest.kt

```kotlin
package com.example.orders.model

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.runTest
import app.cash.turbine.test
import kotlin.test.*

class OrderRepositoryTest {

    @Test
    fun `observeOrder emits state updates`() = runTest {
        val stateFlow = MutableStateFlow<OrderState>(testPlacedOrder)
        val repository = FakeOrderRepository(stateFlow)

        repository.observeOrder("order-1").test {
            assertEquals("order-1", awaitItem().orderId)
            assertTrue(awaitItem() is OrderState.Placed)

            stateFlow.value = testShippedOrder
            val shipped = awaitItem()
            assertTrue(shipped is OrderState.Shipped)
            assertEquals("TRACK-123", (shipped as OrderState.Shipped).trackingNumber)

            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `displayStatus is exhaustive over all states`() {
        // If a new OrderState variant is added without updating displayStatus,
        // this test will fail to compile.
        val states = listOf(
            testPlacedOrder,
            testConfirmedOrder,
            testShippedOrder,
            testDeliveredOrder,
            testCancelledOrder,
        )
        states.forEach { state ->
            assertFalse(state.displayStatus().isBlank(), "Status should not be blank for $state")
        }
    }
}
```

## Key Decisions

1. **Sealed interface in `commonMain`** ensures all order states are defined in shared code and the `when` expression is exhaustive on every platform.
2. **`kotlinx.serialization`** with `@SerialName` discriminators handles polymorphic JSON serialization across all platforms (no Gson/Jackson).
3. **`kotlinx.datetime.Instant`** replaces `java.time.Instant` for multiplatform compatibility.
4. **`Flow<T>` in the repository interface** provides reactive data access that integrates with Android's `collectAsState()` and iOS's `collect {}` via SKIE or similar bridging.
5. **`expect`/`actual` for logging** demonstrates the thinnest possible platform layer -- only I/O that genuinely differs across platforms uses this mechanism.
6. **Turbine** in `commonTest` provides a clean API for testing Flow emissions with timeout and ordering guarantees.
