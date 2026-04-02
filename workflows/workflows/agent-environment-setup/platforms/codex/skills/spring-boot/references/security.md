# Security

## Spring Security 6 Architecture

Spring Security 6 removed `WebSecurityConfigurerAdapter`. All configuration uses the `SecurityFilterChain` bean with the lambda DSL.

```
Request -> SecurityFilterChain -> Authentication Filter -> AuthenticationManager
    -> AuthorizationFilter -> Controller
```

## Basic SecurityFilterChain

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity  // Enables @PreAuthorize, @PostAuthorize
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())  // Disable for stateless APIs
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/products/**").hasRole("MANAGER")
                .anyRequest().authenticated())
            .oauth2ResourceServer(oauth2 ->
                oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthConverter())))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(new BearerTokenAuthenticationEntryPoint())
                .accessDeniedHandler(new BearerTokenAccessDeniedHandler()))
            .build();
    }
}
```

## JWT Resource Server

### Using Spring's Built-in JWT Support

```yaml
# application.yml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://auth.example.com/  # Auto-discovers JWK Set URI
          # OR specify directly:
          # jwk-set-uri: https://auth.example.com/.well-known/jwks.json
```

### Custom JWT Authentication Converter

Map JWT claims to Spring Security authorities.

```java
@Bean
public JwtAuthenticationConverter jwtAuthConverter() {
    var grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
    grantedAuthoritiesConverter.setAuthoritiesClaimName("roles");
    grantedAuthoritiesConverter.setAuthorityPrefix("ROLE_");

    var converter = new JwtAuthenticationConverter();
    converter.setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
    return converter;
}
```

### Custom JWT Decoder for Self-Issued Tokens

```java
@Bean
public JwtDecoder jwtDecoder(AppProperties props) {
    SecretKeySpec key = new SecretKeySpec(
        props.jwtSecret().getBytes(),
        "HmacSHA256"
    );
    return NimbusJwtDecoder.withSecretKey(key).build();
}
```

## Method Security

```java
@Service
@Transactional(readOnly = true)
public class ProjectService {

    // Only project owners can update
    @PreAuthorize("#project.ownerId == authentication.principal.claims['sub']")
    @Transactional
    public Project update(Project project) {
        return projectRepository.save(project);
    }

    // Filter results to only owned projects
    @PostFilter("filterObject.ownerId == authentication.principal.claims['sub']")
    public List<Project> findAll() {
        return projectRepository.findAll();
    }

    // Only admins can delete
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void delete(Long id) {
        projectRepository.deleteById(id);
    }

    // Custom SpEL with bean reference
    @PreAuthorize("@projectSecurity.canAccess(#id, authentication)")
    public Project findById(Long id) {
        return projectRepository.findById(id).orElseThrow();
    }
}
```

### Custom Security Expression

```java
@Component("projectSecurity")
public class ProjectSecurityEvaluator {

    private final ProjectRepository projectRepository;

    public ProjectSecurityEvaluator(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    public boolean canAccess(Long projectId, Authentication authentication) {
        var jwt = (Jwt) authentication.getPrincipal();
        String userId = jwt.getClaimAsString("sub");
        return projectRepository.existsByIdAndOwnerId(projectId, userId);
    }
}
```

## CORS Configuration

```java
@Bean
public CorsConfigurationSource corsConfigurationSource(AppProperties props) {
    var config = new CorsConfiguration();
    config.setAllowedOrigins(List.of(props.cors().allowedOrigins()));
    config.setAllowedMethods(List.of(props.cors().allowedMethods()));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    config.setExposedHeaders(List.of("X-Request-Id"));
    config.setAllowCredentials(true);
    config.setMaxAge(600L);

    var source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", config);
    return source;
}
```

Add `.cors(cors -> cors.configurationSource(corsConfigurationSource()))` to the SecurityFilterChain.

## Custom Authentication Filter

For non-standard auth (API keys, custom headers):

```java
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    private final ApiKeyService apiKeyService;

    public ApiKeyAuthFilter(ApiKeyService apiKeyService) {
        this.apiKeyService = apiKeyService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {
        String apiKey = request.getHeader("X-API-Key");

        if (apiKey != null) {
            var client = apiKeyService.validateKey(apiKey);
            if (client != null) {
                var auth = new UsernamePasswordAuthenticationToken(
                    client, null, client.getAuthorities());
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        filterChain.doFilter(request, response);
    }
}
```

Register in SecurityFilterChain:

```java
.addFilterBefore(new ApiKeyAuthFilter(apiKeyService), UsernamePasswordAuthenticationFilter.class)
```

## Security Testing

### MockMvc with @WithMockUser

```java
@WebMvcTest(ProductController.class)
@Import(SecurityConfig.class)
class ProductControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProductService productService;

    @Test
    void publicEndpoint_noAuth_returns200() throws Exception {
        mockMvc.perform(get("/api/products"))
            .andExpect(status().isOk());
    }

    @Test
    void protectedEndpoint_noAuth_returns401() throws Exception {
        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminEndpoint_adminRole_returns200() throws Exception {
        when(productService.create(any())).thenReturn(someProduct());

        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name": "Widget", "sku": "WDG-001", "price": 9.99}
                    """))
            .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(roles = "USER")
    void adminEndpoint_userRole_returns403() throws Exception {
        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isForbidden());
    }
}
```

### Testing with JWT

```java
@Test
void protectedEndpoint_withJwt() throws Exception {
    mockMvc.perform(get("/api/profile")
            .with(jwt()
                .jwt(jwt -> jwt
                    .claim("sub", "user-123")
                    .claim("roles", List.of("USER")))))
        .andExpect(status().isOk());
}
```

## Security Checklist

| Check | Configuration |
|-------|--------------|
| Stateless sessions | `SessionCreationPolicy.STATELESS` |
| CSRF disabled (API-only) | `.csrf(csrf -> csrf.disable())` |
| JWT validation | `issuer-uri` or `jwk-set-uri` configured |
| Authority mapping | `JwtGrantedAuthoritiesConverter` with correct claim |
| Method security | `@EnableMethodSecurity` + `@PreAuthorize` |
| CORS | Explicit origins, methods, and headers |
| Error handling | Custom `AuthenticationEntryPoint` and `AccessDeniedHandler` |
| Password encoding | `BCryptPasswordEncoder` with strength >= 12 |
