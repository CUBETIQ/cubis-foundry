# Example: Secure REST API with Spring Security 6

## Scenario

A team is building a product catalog API with Spring Boot 3.4. They need CRUD endpoints protected by JWT authentication, role-based access control for admin-only operations, Java records for DTOs, and controller-layer tests with MockMvc that verify security rules.

## Prompt

"Create a Spring Boot 3.4 product catalog API. Use Java records for ProductRequest and ProductResponse. Implement Spring Security 6 with JWT bearer token authentication using the lambda DSL. Add @PreAuthorize for admin-only create and delete. Include a ProductController, ProductService, and a @WebMvcTest that tests both authorized and unauthorized access."

## Expected Output

### Record DTOs

```java
// src/main/java/com/example/catalog/dto/ProductRequest.java
package com.example.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record ProductRequest(
    @NotBlank @Size(max = 200) String name,
    @NotBlank @Size(max = 50) String sku,
    @Size(max = 2000) String description,
    @Positive BigDecimal price,
    @Positive Integer stockQuantity
) {}
```

```java
// src/main/java/com/example/catalog/dto/ProductResponse.java
package com.example.catalog.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record ProductResponse(
    Long id,
    String name,
    String sku,
    String description,
    BigDecimal price,
    Integer stockQuantity,
    Instant createdAt,
    Instant updatedAt
) {}
```

### Spring Security Configuration

```java
// src/main/java/com/example/catalog/config/SecurityConfig.java
package com.example.catalog.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                .anyRequest().authenticated())
            .oauth2ResourceServer(oauth2 ->
                oauth2.jwt(jwt -> jwt.decoder(jwtDecoder())))
            .build();
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        return NimbusJwtDecoder
            .withJwkSetUri("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}")
            .build();
    }
}
```

### Controller

```java
// src/main/java/com/example/catalog/controller/ProductController.java
package com.example.catalog.controller;

import com.example.catalog.dto.ProductRequest;
import com.example.catalog.dto.ProductResponse;
import com.example.catalog.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public List<ProductResponse> listProducts() {
        return productService.findAll();
    }

    @GetMapping("/{id}")
    public ProductResponse getProduct(@PathVariable Long id) {
        return productService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public ProductResponse createProduct(@Valid @RequestBody ProductRequest request) {
        return productService.create(request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteProduct(@PathVariable Long id) {
        productService.delete(id);
    }
}
```

### Service

```java
// src/main/java/com/example/catalog/service/ProductService.java
package com.example.catalog.service;

import com.example.catalog.dto.ProductRequest;
import com.example.catalog.dto.ProductResponse;
import com.example.catalog.entity.Product;
import com.example.catalog.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<ProductResponse> findAll() {
        return productRepository.findAll().stream()
            .map(this::toResponse)
            .toList();
    }

    public ProductResponse findById(Long id) {
        return productRepository.findById(id)
            .map(this::toResponse)
            .orElseThrow(() -> new NoSuchElementException("Product not found: " + id));
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        var product = new Product();
        product.setName(request.name());
        product.setSku(request.sku());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setStockQuantity(request.stockQuantity());

        return toResponse(productRepository.save(product));
    }

    @Transactional
    public void delete(Long id) {
        if (!productRepository.existsById(id)) {
            throw new NoSuchElementException("Product not found: " + id);
        }
        productRepository.deleteById(id);
    }

    private ProductResponse toResponse(Product product) {
        return new ProductResponse(
            product.getId(), product.getName(), product.getSku(),
            product.getDescription(), product.getPrice(),
            product.getStockQuantity(), product.getCreatedAt(),
            product.getUpdatedAt()
        );
    }
}
```

### WebMvcTest

```java
// src/test/java/com/example/catalog/controller/ProductControllerTest.java
package com.example.catalog.controller;

import com.example.catalog.config.SecurityConfig;
import com.example.catalog.dto.ProductResponse;
import com.example.catalog.service.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.bean.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProductController.class)
@Import(SecurityConfig.class)
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProductService productService;

    @Test
    void listProducts_noAuth_returns200() throws Exception {
        var product = new ProductResponse(
            1L, "Widget", "WDG-001", "A widget",
            BigDecimal.valueOf(9.99), 100, Instant.now(), Instant.now()
        );
        when(productService.findAll()).thenReturn(List.of(product));

        mockMvc.perform(get("/api/products"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].name").value("Widget"));
    }

    @Test
    void createProduct_noAuth_returns401() throws Exception {
        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"Widget","sku":"WDG-001","price":9.99,"stockQuantity":100}
                    """))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "USER")
    void createProduct_userRole_returns403() throws Exception {
        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"Widget","sku":"WDG-001","price":9.99,"stockQuantity":100}
                    """))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createProduct_adminRole_returns201() throws Exception {
        var response = new ProductResponse(
            1L, "Widget", "WDG-001", null,
            BigDecimal.valueOf(9.99), 100, Instant.now(), Instant.now()
        );
        when(productService.create(org.mockito.ArgumentMatchers.any()))
            .thenReturn(response);

        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"Widget","sku":"WDG-001","price":9.99,"stockQuantity":100}
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("Widget"));
    }
}
```

## Key Decisions

- **Lambda DSL for SecurityFilterChain** -- Spring Security 6 removed the adapter pattern; the lambda DSL is the only supported approach.
- **GET endpoints are `permitAll`** -- read-only catalog browsing does not require authentication; write operations require ADMIN role.
- **`@PreAuthorize` on methods** -- declarative, auditable, and testable with `@WithMockUser` in slice tests.
- **Records for DTOs** -- immutable, concise, and clearly separate from mutable JPA entities.
- **`@Transactional(readOnly = true)` at class level** -- optimizes all read queries; write methods override with `@Transactional`.
