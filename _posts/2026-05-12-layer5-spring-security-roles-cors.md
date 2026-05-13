---
layout: post
title: "Layer 5 — Spring Security: Role-Based Authorization and CORS"
date: 2026-05-12 09:40:00 -0500
description: A deep dive into Spring Security's authorization layer — covering @PreAuthorize, tenant-scoped roles, CORS configuration mistakes, and the integration tests that validate the full security chain.
tags: [spring-security, authorization, cors, roles, java, spring-boot]
categories: architecture
series: security-layers
giscus_comments: true
related_posts: true
toc:
  sidebar: left
---

> This post is part of the [Security Auditing in a Multi-Tenant SaaS](/blog/2026/security-auditing-layers-multitenant-saas) series. Each post deep-dives one layer of the filter chain.

By the time a request reaches Spring Security's authorization layer, it has already cleared four checkpoints:

1. **nginx** — TLS terminated, tenant host header preserved
2. **TenantResolverFilter** — tenant identity established
3. **JwtAuthenticationFilter** — user identity established (or not)
4. **ApiKeyFilter** — machine identity established (or not)

Layer 5 answers the final question: **is this authenticated principal allowed to do what they're asking to do?**

This is also where CORS is configured — determining which frontend origins are permitted to make cross-origin requests to the API.

---

## Authorization vs Authentication

These terms are often conflated. In this filter chain they are strictly separated:

- **Authentication** (Layers 3 and 4): _Who are you?_ Verified by signature, token validity, key hash.
- **Authorization** (Layer 5): _Are you allowed to do this?_ Decided by roles, tenant context, and endpoint rules.

A user can be perfectly authenticated but unauthorized — a valid `ROLE_USER` JWT that tries to reach an `ROLE_ADMIN` endpoint should get `403 Forbidden`, not `401 Unauthorized`. The distinction matters both for security semantics and client error handling.

---

## The Role Model

In a multi-tenant SaaS, roles need to carry tenant scope. A user who is an admin for tenant A must not be able to access tenant B's admin endpoints — even with a valid token.

We enforce this at two levels:

**Level 1 — Token claims** (Layer 3): The JWT's `domain` claim is cross-checked against the resolved tenant context. A token for tenant A can't be presented to tenant B's API subdomain.

**Level 2 — Spring Security authorization** (Layer 5): `@PreAuthorize` checks roles. Roles are loaded from the JWT claims for the current tenant, so the role context is already scoped to the right tenant by the time authorization runs.

```java
// Roles in use
ROLE_USER        // standard authenticated user
ROLE_ADMIN       // tenant administrator (full access to tenant data)
ROLE_SUPERADMIN  // platform administrator (cross-tenant operations)
ROLE_API_CLIENT  // machine-to-machine (API key authenticated)
```

`ROLE_SUPERADMIN` is the only role that crosses tenant boundaries — and it's never issued via the normal JWT flow. It's only used for platform-level admin operations (provisioning, billing, monitoring).

---

## SecurityFilterChain Configuration

```java
@Configuration
@EnableMethodSecurity  // enables @PreAuthorize
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF for stateless API — session cookie uses SameSite=Lax instead
            .csrf(csrf -> csrf.disable())

            // CORS configured separately
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // Session management — stateless for API, but allow session for browser
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))

            // Authorization rules
            .authorizeHttpRequests(auth -> auth

                // Public endpoints — no auth required
                .requestMatchers(HttpMethod.GET, "/api/appoint/day/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/appoint/request").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/resources/public/**").permitAll()

                // Auth endpoints — permit all (they ARE the auth flow)
                .requestMatchers("/api/auth/**").permitAll()

                // Admin endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                // Platform endpoints — superadmin only
                .requestMatchers("/api/platform/**").hasRole("SUPERADMIN")

                // API client endpoints
                .requestMatchers("/api/automation/**").hasRole("API_CLIENT")

                // Everything else requires authentication
                .anyRequest().authenticated()
            );

        // Register filters in order
        http.addFilterBefore(tenantResolverFilter, UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(apiKeyFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
```

---

## Method-Level Authorization with @PreAuthorize

URL-based authorization (`authorizeHttpRequests`) is coarse-grained — it matches URL patterns to roles. Method-level authorization is fine-grained — it checks conditions at the controller or service method.

```java
@RestController
@RequestMapping("/api/clients")
public class CrmController {

    // Any authenticated user can list clients (for their tenant — data filtered by Hibernate)
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<ClientDto> listClients() { ... }

    // Only admins can update client records
    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ClientDto updateClient(@PathVariable UUID id, @RequestBody ClientUpdateDto dto) { ... }

    // Only admins can toggle consent — this is a compliance-sensitive operation
    @PatchMapping("/{id}/consent")
    @PreAuthorize("hasRole('ADMIN')")
    public void updateConsent(@PathVariable UUID id, @RequestBody ConsentDto dto) { ... }

    // Admins can delete, but not API clients — even if they have ROLE_API_CLIENT
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') and !hasRole('API_CLIENT')")
    public void deleteClient(@PathVariable UUID id) { ... }
}
```

**Why use both URL rules and `@PreAuthorize`?**
URL rules catch misconfigured requests early (before hitting the controller). `@PreAuthorize` is the authoritative check at the business logic boundary. Defense in depth — if a URL rule is accidentally too permissive, the method annotation is a second gate.

---

## CORS Configuration

CORS (Cross-Origin Resource Sharing) controls which browser origins can make requests to your API. It's a browser security mechanism — it does not protect server-to-server calls, but it does protect your users' sessions from being hijacked by malicious web pages.

### The Wrong Way

```java
// NEVER do this in production
config.setAllowedOriginPatterns(List.of("*"));
config.setAllowCredentials(true);  // This combination is especially dangerous
```

`allowedOriginPatterns("*")` with `allowCredentials(true)` is invalid in modern CORS specs and may be rejected by the browser — but more importantly, it signals a fundamental misunderstanding of the threat model. Credentials (cookies, auth headers) should never be sent to any origin.

### The Pattern to Avoid — Regex That Can Be Tricked

```java
// Looks safe, but can be tricked
config.setAllowedOriginPatterns(List.of("https://*.yourdomain.com"));
```

This pattern allows `https://evil-yourdomain.com` to pass the check if the regex is imprecise. Subdomain wildcards require careful implementation.

### The Right Way — Explicit Allowlist

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();

    // Explicit, complete list of allowed origins
    config.setAllowedOrigins(List.of(
        "https://www.tenant-a.example.com",
        "https://www.tenant-b.example.com",
        "https://admin.yoursaas.com"
    ));

    config.setAllowedMethods(List.of("GET", "POST", "PATCH", "DELETE", "OPTIONS"));

    config.setAllowedHeaders(List.of(
        "Authorization",
        "Content-Type",
        "X-API-KEY"
    ));

    config.setAllowCredentials(true);  // Required for cookies
    config.setMaxAge(3600L);           // Cache preflight for 1 hour

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", config);
    return source;
}
```

**For a multi-tenant system with dynamic tenant onboarding**, maintain the allowed origins list in the same place you store tenant domain configuration — loaded at startup, refreshable via a cache. When a new tenant is onboarded, their frontend domain is added to the CORS allowlist as part of the provisioning process.

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    // Load dynamically from tenant registry
    List<String> allowedOrigins = tenantRegistry.getAllDomains()
        .stream()
        .map(domain -> "https://www." + domain)
        .collect(Collectors.toList());

    // Add platform admin origin
    allowedOrigins.add("https://admin." + platformDomain);

    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(allowedOrigins);
    // ... rest of config
}
```

---

## Common Authorization Mistakes

### 1. Authorizing Reads but Not Writes

A common pattern: GET endpoints are secured, but PATCH/DELETE endpoints on the same resource are missed.

```java
// Secure the write endpoints explicitly — don't assume URL rules catch everything
@PatchMapping("/{id}")
@PreAuthorize("hasRole('ADMIN')")  // Don't forget this on write methods
public void update(@PathVariable UUID id, ...) { ... }
```

### 2. Trusting the Client for Role Escalation

If a client can pass their own role in a request body or query parameter, and the server uses it without re-validating from the token, that's a privilege escalation vulnerability.

```java
// WRONG — trusts client-provided role
@PostMapping
public void create(@RequestBody CreateDto dto) {
    String role = dto.getRole();  // attacker sets this to "ADMIN"
    userService.createWithRole(role);
}

// CORRECT — derive role from authenticated principal
@PostMapping
public void create(@RequestBody CreateDto dto,
                   @AuthenticationPrincipal UserDetails currentUser) {
    String role = determineAllowedRole(currentUser);  // derived from token, not request body
    userService.createWithRole(role);
}
```

### 3. Missing CORS Preflight Handling

Browsers send an `OPTIONS` preflight request before state-changing cross-origin requests. If your security config blocks `OPTIONS` requests (requiring authentication for all methods), CORS will silently fail.

```java
// Ensure OPTIONS is permitted (Spring Security handles this automatically if CORS is configured,
// but verify it's not being blocked by an overly broad auth rule)
.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
```

### 4. Using `@Secured` Instead of `@PreAuthorize`

`@Secured` only supports role names. `@PreAuthorize` supports SpEL expressions, which allows compound conditions (`hasRole('ADMIN') and !hasRole('API_CLIENT')`). Prefer `@PreAuthorize` for flexibility.

---

## Integration Tests

The most important tests at this layer are integration tests that exercise the complete filter chain — not mocked units.

```java
@SpringBootTest
@AutoConfigureMockMvc
class SecurityConfigIT {

    @Test
    void publicEndpoint_noAuth_returns200() throws Exception {
        mockMvc.perform(get("/api/appoint/day/2026-05-12")
                .header("Host", "api.tenant.example.com"))
               .andExpect(status().isOk());
    }

    @Test
    void protectedEndpoint_noAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/clients")
                .header("Host", "api.tenant.example.com"))
               .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpoint_userRole_adminEndpoint_returns403() throws Exception {
        String userToken = generateToken("ROLE_USER", "tenant.example.com");

        mockMvc.perform(get("/api/admin/users")
                .header("Host", "api.tenant.example.com")
                .header("Authorization", "Bearer " + userToken))
               .andExpect(status().isForbidden());
    }

    @Test
    void adminEndpoint_adminRole_returns200() throws Exception {
        String adminToken = generateToken("ROLE_ADMIN", "tenant.example.com");

        mockMvc.perform(get("/api/admin/users")
                .header("Host", "api.tenant.example.com")
                .header("Authorization", "Bearer " + adminToken))
               .andExpect(status().isOk());
    }

    @Test
    void corsPreflightRequest_allowedOrigin_returns200() throws Exception {
        mockMvc.perform(options("/api/clients")
                .header("Origin", "https://www.tenant.example.com")
                .header("Access-Control-Request-Method", "GET"))
               .andExpect(status().isOk())
               .andExpect(header().exists("Access-Control-Allow-Origin"));
    }

    @Test
    void corsPreflightRequest_unknownOrigin_noCorsHeader() throws Exception {
        mockMvc.perform(options("/api/clients")
                .header("Origin", "https://evil.com")
                .header("Access-Control-Request-Method", "GET"))
               .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }
}
```

```java
@SpringBootTest
@AutoConfigureMockMvc
class AdminTokenIT {

    @Test
    void adminApiKey_canAccessAdminEndpoints() throws Exception {
        mockMvc.perform(get("/api/admin/report/weekly")
                .header("Host", "api.tenant.example.com")
                .header("X-API-KEY", validAdminKey))
               .andExpect(status().isOk());
    }

    @Test
    void adminApiKey_cannotAccessSuperadminEndpoints() throws Exception {
        mockMvc.perform(get("/api/platform/tenants")
                .header("Host", "api.tenant.example.com")
                .header("X-API-KEY", validAdminKey))
               .andExpect(status().isForbidden());
    }
}
```

---

## Audit Checklist

```
Role Design
  [ ] Roles are documented with their permitted operations
  [ ] ROLE_SUPERADMIN is never issued via normal auth flow
  [ ] Role escalation via request body is not possible

URL-Based Authorization
  [ ] Public endpoints are explicitly listed (no implicit opens)
  [ ] /api/auth/** is allowed (not accidentally locked)
  [ ] OPTIONS method is not blocked (CORS preflight works)

Method-Level Authorization
  [ ] All POST/PATCH/DELETE endpoints have @PreAuthorize
  [ ] Read endpoints returning sensitive data have @PreAuthorize
  [ ] @PreAuthorize uses roles derived from token, not request body

CORS
  [ ] allowedOrigins is an explicit whitelist (no wildcard with credentials)
  [ ] Allowed origins list matches the tenant registry
  [ ] Unknown origin returns no Access-Control-Allow-Origin header
  [ ] CORS preflight (OPTIONS) returns correct headers for known origins

Tests
  [ ] Public endpoint, no auth → 200
  [ ] Protected endpoint, no auth → 401
  [ ] Protected endpoint, wrong role → 403
  [ ] Protected endpoint, correct role → 200
  [ ] CORS: known origin → Access-Control-Allow-Origin present
  [ ] CORS: unknown origin → Access-Control-Allow-Origin absent
  [ ] Admin API key → admin endpoints accessible
  [ ] Admin API key → superadmin endpoints blocked
```

---

## The Full Chain in Perspective

This is the final layer. When all five layers are working correctly, a request has passed:

| Layer                   | Concern                  | Failure Response           |
| ----------------------- | ------------------------ | -------------------------- |
| nginx                   | TLS, rate limit, logging | Connection refused / 429   |
| TenantResolverFilter    | Tenant identity          | 400 Bad Request            |
| JwtAuthenticationFilter | User identity            | 401 Unauthorized           |
| ApiKeyFilter            | Machine identity         | 401 Unauthorized           |
| Spring Security         | Authorization, CORS      | 403 Forbidden / CORS error |

Each layer has a single job. Each layer has tests. Each layer fails explicitly rather than silently.

The result is a security chain you can audit by reading down the filter order — and one where a failure at any layer is visible, testable, and fixable without touching the others.

---

_This concludes the five-layer deep-dive series. Return to the overview: [Security Auditing in a Multi-Tenant SaaS: Layered Filters, JWT, and API Keys](/blog/2026/security-auditing-layers-multitenant-saas)_
