# Dependency Injection

## Constructor Injection

Spring Boot 3.4 uses constructor injection as the default and recommended DI pattern. A single-constructor class does not need `@Autowired`.

```java
@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final PaymentClient paymentClient;
    private final NotificationService notificationService;

    // No @Autowired needed — Spring auto-detects the single constructor
    public OrderService(
            OrderRepository orderRepository,
            PaymentClient paymentClient,
            NotificationService notificationService) {
        this.orderRepository = orderRepository;
        this.paymentClient = paymentClient;
        this.notificationService = notificationService;
    }
}
```

### Why Not Field Injection

| Aspect | Constructor Injection | Field Injection (`@Autowired`) |
|--------|----------------------|-------------------------------|
| Immutability | Fields are `final` | Fields are mutable |
| Testability | Instantiate with `new` + mocks | Requires Spring context or reflection |
| Required deps | Compiler enforces all params | Missing deps cause NPE at runtime |
| Circular deps | Fails fast at startup | Silently deferred (hides design issue) |

## @ConfigurationProperties with Records

```java
// src/main/java/com/example/config/AppProperties.java
package com.example.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app")
public record AppProperties(
    @NotBlank String name,
    @NotBlank String jwtSecret,
    @Positive int jwtExpirationMinutes,
    DatabaseProperties database,
    CorsProperties cors
) {
    public record DatabaseProperties(
        @Positive int poolSize,
        @Positive int maxOverflow
    ) {}

    public record CorsProperties(
        String[] allowedOrigins,
        String[] allowedMethods
    ) {}
}
```

```yaml
# application.yml
app:
  name: my-service
  jwt-secret: ${JWT_SECRET}
  jwt-expiration-minutes: 30
  database:
    pool-size: 20
    max-overflow: 10
  cors:
    allowed-origins: https://example.com
    allowed-methods: GET,POST,PUT,DELETE
```

```java
// Enable in main class or config
@SpringBootApplication
@EnableConfigurationProperties(AppProperties.class)
public class Application { ... }
```

Benefits of records for configuration:
- Immutable after construction.
- `@Validated` triggers JSR-380 validation at startup.
- Nested records map naturally to YAML structure.
- IDE provides autocompletion via `spring-boot-configuration-processor`.

## Bean Scopes

| Scope | Lifecycle | Default? |
|-------|-----------|----------|
| `singleton` | One instance per ApplicationContext | Yes |
| `prototype` | New instance per injection point | No |
| `request` | One instance per HTTP request | No (web only) |
| `session` | One instance per HTTP session | No (web only) |

```java
@Bean
@Scope("prototype")
public ReportGenerator reportGenerator() {
    return new ReportGenerator();
}
```

Injecting a prototype bean into a singleton gives a single instance. Use `ObjectProvider<T>` for lazy/prototype resolution:

```java
@Service
public class ReportService {

    private final ObjectProvider<ReportGenerator> generatorProvider;

    public ReportService(ObjectProvider<ReportGenerator> generatorProvider) {
        this.generatorProvider = generatorProvider;
    }

    public byte[] generate() {
        ReportGenerator generator = generatorProvider.getObject(); // new instance each call
        return generator.build();
    }
}
```

## Profiles

```java
@Configuration
@Profile("production")
public class ProductionConfig {

    @Bean
    public DataSource dataSource(AppProperties props) {
        var ds = new HikariDataSource();
        ds.setMaximumPoolSize(props.database().poolSize());
        return ds;
    }
}

@Configuration
@Profile("test")
public class TestConfig {

    @Bean
    public DataSource dataSource() {
        return new EmbeddedDatabaseBuilder()
            .setType(EmbeddedDatabaseType.H2)
            .build();
    }
}
```

Activate with: `spring.profiles.active=production` (env var or application.yml).

## Conditional Beans

```java
@Configuration
public class CacheConfig {

    @Bean
    @ConditionalOnProperty(name = "app.cache.enabled", havingValue = "true")
    public CacheManager redisCacheManager(RedisConnectionFactory factory) {
        return RedisCacheManager.builder(factory).build();
    }

    @Bean
    @ConditionalOnMissingBean(CacheManager.class)
    public CacheManager noOpCacheManager() {
        return new NoOpCacheManager();
    }
}
```

| Annotation | Condition |
|-----------|-----------|
| `@ConditionalOnProperty` | Property has specific value |
| `@ConditionalOnMissingBean` | No bean of this type exists |
| `@ConditionalOnClass` | Class is on classpath |
| `@ConditionalOnBean` | Another bean exists |
| `@ConditionalOnExpression` | SpEL expression evaluates to true |

## @Bean vs. Stereotype Annotations

| Use `@Component`/`@Service`/`@Repository` | Use `@Bean` in `@Configuration` |
|-------------------------------------------|--------------------------------|
| Classes you own and control | Third-party library classes |
| Simple, no-args or auto-injected constructors | Complex initialization logic |
| One implementation per interface | Multiple implementations (qualified) |

## Qualifier and Primary

```java
public interface NotificationSender {
    void send(String message);
}

@Service
@Primary  // Default when no qualifier specified
public class EmailSender implements NotificationSender { ... }

@Service("smsSender")
public class SmsSender implements NotificationSender { ... }

@Service
public class AlertService {

    private final NotificationSender defaultSender;
    private final NotificationSender smsSender;

    public AlertService(
            NotificationSender defaultSender,          // Gets EmailSender (@Primary)
            @Qualifier("smsSender") NotificationSender smsSender) {
        this.defaultSender = defaultSender;
        this.smsSender = smsSender;
    }
}
```

## Event-Driven Decoupling

```java
// Event record
public record OrderCreatedEvent(String orderId, String customerId, BigDecimal total) {}

// Publisher
@Service
public class OrderService {

    private final ApplicationEventPublisher eventPublisher;

    public OrderService(ApplicationEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public Order createOrder(OrderRequest request) {
        Order order = orderRepository.save(mapToEntity(request));
        eventPublisher.publishEvent(new OrderCreatedEvent(order.getId(), order.getCustomerId(), order.getTotal()));
        return order;
    }
}

// Listener
@Component
public class OrderEventListener {

    @EventListener
    public void handleOrderCreated(OrderCreatedEvent event) {
        // Send confirmation email, update analytics, etc.
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleAfterCommit(OrderCreatedEvent event) {
        // Only runs if the transaction commits successfully
    }
}
```

`@TransactionalEventListener` prevents notifications for rolled-back transactions.
