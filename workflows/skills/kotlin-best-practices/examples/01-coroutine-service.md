# Example: Coroutine-Based Service with Graceful Degradation

## Scenario

A user profile service fetches a user from the database, then enriches the profile with data from 3 independent external APIs (preferences, activity feed, recommendations). The total operation has a 2-second deadline. If any enrichment call fails, the service returns partial data rather than failing the entire request.

## Implementation

### UserProfileService.kt

```kotlin
import kotlinx.coroutines.*

class UserProfileService(
    private val userRepository: UserRepository,
    private val preferencesClient: PreferencesClient,
    private val activityClient: ActivityClient,
    private val recommendationsClient: RecommendationsClient,
) {

    suspend fun getEnrichedProfile(userId: UserId): EnrichedProfile {
        // Overall 2-second deadline for the entire operation
        return withTimeout(2_000) {
            val user = withContext(Dispatchers.IO) {
                userRepository.findById(userId)
                    ?: throw UserNotFoundException(userId)
            }

            // supervisorScope: if one enrichment fails, others continue
            supervisorScope {
                val preferences = async {
                    fetchWithFallback("preferences") {
                        preferencesClient.getPreferences(userId)
                    }
                }
                val activity = async {
                    fetchWithFallback("activity") {
                        activityClient.getRecentActivity(userId, limit = 20)
                    }
                }
                val recommendations = async {
                    fetchWithFallback("recommendations") {
                        recommendationsClient.getRecommendations(userId)
                    }
                }

                EnrichedProfile(
                    user = user,
                    preferences = preferences.await(),
                    recentActivity = activity.await(),
                    recommendations = recommendations.await(),
                )
            }
        }
    }

    /**
     * Wraps an enrichment call with individual timeout and error handling.
     * Returns null on failure instead of throwing, enabling partial results.
     * Critically: rethrows CancellationException to preserve structured concurrency.
     */
    private suspend fun <T> fetchWithFallback(
        source: String,
        block: suspend () -> T,
    ): T? {
        return try {
            withTimeout(1_500) {
                withContext(Dispatchers.IO) {
                    block()
                }
            }
        } catch (e: CancellationException) {
            // Never swallow CancellationException -- it breaks structured concurrency
            throw e
        } catch (e: Exception) {
            logger.warn("Enrichment from $source failed, returning partial data", e)
            null
        }
    }
}
```

### Domain types

```kotlin
import kotlinx.serialization.Serializable

@JvmInline
value class UserId(val value: String)

data class EnrichedProfile(
    val user: User,
    val preferences: UserPreferences?,    // null = unavailable
    val recentActivity: List<Activity>?,  // null = unavailable
    val recommendations: List<Recommendation>?, // null = unavailable
) {
    val isFullyEnriched: Boolean
        get() = preferences != null && recentActivity != null && recommendations != null

    val availableSections: List<String>
        get() = buildList {
            add("user")
            if (preferences != null) add("preferences")
            if (recentActivity != null) add("activity")
            if (recommendations != null) add("recommendations")
        }
}

class UserNotFoundException(userId: UserId) :
    RuntimeException("User not found: ${userId.value}")
```

### Testing with runTest and Turbine

```kotlin
import kotlinx.coroutines.test.*
import kotlin.test.*

class UserProfileServiceTest {

    private val testDispatcher = StandardTestDispatcher()

    @Test
    fun `returns partial profile when one enrichment fails`() = runTest {
        val service = UserProfileService(
            userRepository = FakeUserRepository(testUser),
            preferencesClient = FakePreferencesClient(testPreferences),
            activityClient = FailingActivityClient(RuntimeException("timeout")),
            recommendationsClient = FakeRecommendationsClient(testRecommendations),
        )

        val profile = service.getEnrichedProfile(UserId("user-1"))

        assertNotNull(profile.preferences)
        assertNull(profile.recentActivity, "Activity should be null when API fails")
        assertNotNull(profile.recommendations)
        assertFalse(profile.isFullyEnriched)
        assertEquals(listOf("user", "preferences", "recommendations"), profile.availableSections)
    }

    @Test
    fun `throws TimeoutCancellationException when deadline exceeded`() = runTest {
        val service = UserProfileService(
            userRepository = FakeUserRepository(testUser),
            preferencesClient = SlowClient(delay = 3_000), // Exceeds 2s deadline
            activityClient = SlowClient(delay = 3_000),
            recommendationsClient = SlowClient(delay = 3_000),
        )

        assertFailsWith<TimeoutCancellationException> {
            service.getEnrichedProfile(UserId("user-1"))
        }
    }
}
```

## Key Decisions

1. **`supervisorScope`** ensures that if the preferences API fails, the activity and recommendations calls continue rather than being cancelled.
2. **`withTimeout(2_000)`** at the top level enforces the overall deadline. Individual calls use `withTimeout(1_500)` to leave headroom.
3. **Nullable return types** model partial success -- `null` means "this enrichment is unavailable" rather than throwing an exception.
4. **`CancellationException` is always rethrown** in `fetchWithFallback`. Catching it would break the structured concurrency contract and prevent the 2-second timeout from working.
5. **`Dispatchers.IO`** is used via `withContext` for all blocking network/database calls, keeping the calling dispatcher free.
6. **`value class UserId`** provides type safety at zero runtime cost, preventing `String` mix-ups between user IDs and other string parameters.
