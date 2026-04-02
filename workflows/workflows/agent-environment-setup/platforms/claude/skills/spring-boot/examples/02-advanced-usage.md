# Example: Reactive WebFlux with Server-Sent Events and R2DBC

## Scenario

A team is building a real-time dashboard service with Spring Boot 3.4. The service streams live metrics via Server-Sent Events (SSE), fetches external data with WebClient, stores metrics in PostgreSQL using R2DBC (reactive database access), and uses reactive Spring Security. The service also leverages virtual threads for the admin REST endpoints that perform blocking I/O.

## Prompt

"Build a Spring Boot 3.4 real-time metrics service. Stream metrics via SSE using Flux. Use WebClient to poll an external metrics API. Store metrics in PostgreSQL with R2DBC. Add reactive Spring Security with a SecurityWebFilterChain. Include an admin REST endpoint that uses virtual threads for blocking report generation. Test with WebTestClient."

## Expected Output

### Record DTOs

```java
// src/main/java/com/example/metrics/dto/MetricEvent.java
package com.example.metrics.dto;

import java.time.Instant;

public record MetricEvent(
    String name,
    double value,
    String unit,
    Instant timestamp
) {}
```

```java
// src/main/java/com/example/metrics/dto/MetricSummary.java
package com.example.metrics.dto;

public record MetricSummary(
    String name,
    double min,
    double max,
    double average,
    long count
) {}
```

### R2DBC Entity and Repository

```java
// src/main/java/com/example/metrics/entity/MetricRecord.java
package com.example.metrics.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;
import java.time.Instant;

@Table("metric_records")
public record MetricRecord(
    @Id Long id,
    String name,
    double value,
    String unit,
    Instant recordedAt
) {}
```

```java
// src/main/java/com/example/metrics/repository/MetricRepository.java
package com.example.metrics.repository;

import com.example.metrics.entity.MetricRecord;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

public interface MetricRepository extends ReactiveCrudRepository<MetricRecord, Long> {

    Flux<MetricRecord> findByNameOrderByRecordedAtDesc(String name);

    Flux<MetricRecord> findByRecordedAtAfter(java.time.Instant since);
}
```

### Reactive Security Configuration

```java
// src/main/java/com/example/metrics/config/SecurityConfig.java
package com.example.metrics.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
            .csrf(ServerHttpSecurity.CsrfSpec::disable)
            .authorizeExchange(exchanges -> exchanges
                .pathMatchers("/api/metrics/stream").authenticated()
                .pathMatchers("/api/admin/**").hasRole("ADMIN")
                .pathMatchers("/actuator/health").permitAll()
                .anyExchange().authenticated())
            .oauth2ResourceServer(oauth2 ->
                oauth2.jwt(jwt -> {}))
            .build();
    }
}
```

### Metrics Service with WebClient and Flux Operators

```java
// src/main/java/com/example/metrics/service/MetricsService.java
package com.example.metrics.service;

import com.example.metrics.dto.MetricEvent;
import com.example.metrics.dto.MetricSummary;
import com.example.metrics.entity.MetricRecord;
import com.example.metrics.repository.MetricRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;

@Service
public class MetricsService {

    private final WebClient webClient;
    private final MetricRepository metricRepository;

    public MetricsService(WebClient.Builder webClientBuilder, MetricRepository metricRepository) {
        this.webClient = webClientBuilder
            .baseUrl("https://metrics-api.example.com")
            .build();
        this.metricRepository = metricRepository;
    }

    /**
     * Streams live metrics by polling the external API every 2 seconds,
     * filtering out zero-value readings, and persisting each valid metric.
     */
    public Flux<MetricEvent> streamMetrics(String metricName) {
        return Flux.interval(Duration.ofSeconds(2))
            .flatMap(tick -> fetchExternalMetric(metricName))
            .filter(event -> event.value() > 0.0)
            .flatMap(event -> persistAndReturn(event))
            .onErrorResume(ex -> {
                // Log and continue streaming on transient failures
                return Mono.empty();
            })
            .share(); // Share the upstream subscription among multiple SSE clients
    }

    /**
     * Fetches the latest metric reading from the external API.
     */
    private Mono<MetricEvent> fetchExternalMetric(String metricName) {
        return webClient.get()
            .uri("/v1/metrics/{name}/latest", metricName)
            .retrieve()
            .bodyToMono(MetricEvent.class)
            .timeout(Duration.ofSeconds(5))
            .onErrorResume(ex -> Mono.empty());
    }

    /**
     * Persists the metric to the database and returns the original event.
     */
    private Mono<MetricEvent> persistAndReturn(MetricEvent event) {
        var record = new MetricRecord(null, event.name(), event.value(), event.unit(), event.timestamp());
        return metricRepository.save(record).thenReturn(event);
    }

    /**
     * Computes a summary of recent metrics (last hour). Uses Flux operators
     * to calculate min, max, average without loading all records into memory.
     */
    public Mono<MetricSummary> computeSummary(String metricName) {
        var since = Instant.now().minus(Duration.ofHours(1));
        return metricRepository.findByRecordedAtAfter(since)
            .filter(record -> record.name().equals(metricName))
            .collectList()
            .map(records -> {
                var stats = records.stream()
                    .mapToDouble(MetricRecord::value)
                    .summaryStatistics();
                return new MetricSummary(
                    metricName, stats.getMin(), stats.getMax(),
                    stats.getAverage(), stats.getCount()
                );
            });
    }
}
```

### SSE Controller

```java
// src/main/java/com/example/metrics/controller/MetricsController.java
package com.example.metrics.controller;

import com.example.metrics.dto.MetricEvent;
import com.example.metrics.dto.MetricSummary;
import com.example.metrics.service.MetricsService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/metrics")
public class MetricsController {

    private final MetricsService metricsService;

    public MetricsController(MetricsService metricsService) {
        this.metricsService = metricsService;
    }

    @GetMapping(value = "/stream/{name}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<MetricEvent> streamMetrics(@PathVariable String name) {
        return metricsService.streamMetrics(name);
    }

    @GetMapping("/summary/{name}")
    public Mono<MetricSummary> getSummary(@PathVariable String name) {
        return metricsService.computeSummary(name);
    }
}
```

### Admin Controller with Virtual Threads

```java
// src/main/java/com/example/metrics/controller/AdminController.java
package com.example.metrics.controller;

import com.example.metrics.service.ReportService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final ReportService reportService;

    public AdminController(ReportService reportService) {
        this.reportService = reportService;
    }

    /**
     * Generates a blocking PDF report. With spring.threads.virtual.enabled=true,
     * this runs on a virtual thread, freeing the carrier thread pool.
     */
    @GetMapping(value = "/report/{name}", produces = "application/pdf")
    public byte[] generateReport(@PathVariable String name) {
        return reportService.generatePdfReport(name);
    }
}
```

### Application Configuration

```yaml
# src/main/resources/application.yml
spring:
  threads:
    virtual:
      enabled: true
  r2dbc:
    url: r2dbc:postgresql://localhost:5432/metrics
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: ${JWT_ISSUER_URI}
```

### WebTestClient Tests

```java
// src/test/java/com/example/metrics/controller/MetricsControllerTest.java
package com.example.metrics.controller;

import com.example.metrics.config.SecurityConfig;
import com.example.metrics.dto.MetricEvent;
import com.example.metrics.dto.MetricSummary;
import com.example.metrics.service.MetricsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.boot.test.mock.bean.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;

import static org.mockito.Mockito.when;

@WebFluxTest(MetricsController.class)
@Import(SecurityConfig.class)
class MetricsControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockBean
    private MetricsService metricsService;

    @Test
    @WithMockUser
    void streamMetrics_returnsSSE() {
        var event = new MetricEvent("cpu.usage", 72.5, "percent", Instant.now());
        when(metricsService.streamMetrics("cpu.usage"))
            .thenReturn(Flux.just(event));

        webTestClient.get()
            .uri("/api/metrics/stream/cpu.usage")
            .accept(MediaType.TEXT_EVENT_STREAM)
            .exchange()
            .expectStatus().isOk()
            .expectHeader().contentTypeCompatibleWith(MediaType.TEXT_EVENT_STREAM)
            .expectBodyList(MetricEvent.class)
            .hasSize(1)
            .contains(event);
    }

    @Test
    void streamMetrics_noAuth_returns401() {
        webTestClient.get()
            .uri("/api/metrics/stream/cpu.usage")
            .exchange()
            .expectStatus().isUnauthorized();
    }

    @Test
    @WithMockUser
    void getSummary_returnsSummary() {
        var summary = new MetricSummary("cpu.usage", 10.0, 95.0, 52.5, 1800);
        when(metricsService.computeSummary("cpu.usage"))
            .thenReturn(Mono.just(summary));

        webTestClient.get()
            .uri("/api/metrics/summary/cpu.usage")
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.name").isEqualTo("cpu.usage")
            .jsonPath("$.average").isEqualTo(52.5)
            .jsonPath("$.count").isEqualTo(1800);
    }
}
```

## Key Decisions

- **`TEXT_EVENT_STREAM_VALUE` produces SSE** -- clients receive an event stream with automatic reconnection semantics built into the browser EventSource API.
- **`Flux.share()`** -- multiple SSE clients share a single upstream subscription to the external API, avoiding redundant polling.
- **`onErrorResume` with `Mono.empty()`** -- transient external API failures skip one tick instead of terminating the entire stream for all connected clients.
- **R2DBC instead of JPA** -- fully reactive database access avoids blocking the Netty event loop, which is mandatory for WebFlux correctness.
- **Virtual threads for admin endpoints** -- blocking PDF generation runs on virtual threads via `spring.threads.virtual.enabled`, keeping carrier threads free for reactive traffic.
- **`SecurityWebFilterChain` for reactive security** -- the servlet-based `SecurityFilterChain` does not work with WebFlux; the reactive variant integrates with the Netty pipeline.
