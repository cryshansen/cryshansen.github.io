---
layout: post
title: "Layer 4 — API Key Authentication: Securing Machine-to-Machine Requests"
date: 2026-05-12 09:30:00 -0500
description: A deep dive into API key authentication in a Spring Boot multi-tenant API — covering when to use keys vs JWTs, hashing at rest, the session passthrough bug, and a complete test matrix.
tags: [api-key, authentication, spring-boot, security, automation, java]
categories: architecture
series: security-layers
giscus_comments: true
related_posts: true
toc:
  sidebar: left
---

> This post is part of the [Security Auditing in a Multi-Tenant SaaS](/blog/2026/security-auditing-layers-multitenant-saas) series. Each post deep-dives one layer of the filter chain.

JWTs work well for human users. A person logs in, gets a token, and uses it for the next hour. But scheduled jobs, internal automation scripts, and admin tooling don't have a human at the keyboard to re-authenticate. They need a credential that works unattended.

API keys solve this — but they introduce their own set of risks that need to be managed carefully.

---

## When to Use API Keys vs JWTs

| Scenario | Auth Method | Why |
|---|---|---|
| User logs in via browser | JWT + session cookie | Short-lived, tied to identity, revocable via session |
| Mobile client makes API calls | JWT | Stateless, short-lived |
| Scheduled job (nightly report) | API key | Unattended, no human to re-auth |
| Internal admin tooling | API key | Trusted internal caller, long-lived credential |
| External webhook receiver | API key + signature | Inbound, no session possible |
| Service-to-service (ML scorer) | API key or mTLS | Machine identity, no user context |

The key distinction is **attended vs. unattended**. If there's a human who can re-authenticate, use JWTs. If the caller is a machine running on a schedule or reacting to events, use an API key.

---

## The Filter

The API key filter sits after the JWT filter in the chain. By the time a request reaches this filter, one of two things is true:
1. The JWT filter already authenticated the request (SecurityContext is populated)
2. No valid JWT was found (SecurityContext is empty)

```java
@Component
@Order(3)  // after TenantResolver (1) and JwtFilter (2)
public class ApiKeyFilter extends OncePerRequestFilter {

    private final ApiKeyService apiKeyService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        // CRITICAL: If a valid session/JWT already authenticated this request, skip.
        // This is the session passthrough fix — see below.
        Authentication existingAuth = SecurityContextHolder.getContext().getAuthentication();
        if (existingAuth != null && existingAuth.isAuthenticated()) {
            chain.doFilter(request, response);
            return;
        }

        String apiKey = request.getHeader("X-API-KEY");

        if (apiKey == null || apiKey.isBlank()) {
            // No API key provided — pass through. Spring Security decides if auth is required.
            chain.doFilter(request, response);
            return;
        }

        // Validate the key
        ApiKeyPrincipal principal = apiKeyService.validate(apiKey, TenantContext.getCurrentTenant());

        if (principal == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid API key");
            return;
        }

        // Set authentication in SecurityContext
        ApiKeyAuthenticationToken auth = new ApiKeyAuthenticationToken(
            principal,
            principal.getAuthorities()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);

        chain.doFilter(request, response);
    }
}
```

---

## The Session Passthrough Bug

This filter has a subtle interaction with the JWT/session filter that produced a real production bug worth documenting.

**The scenario:**
1. A browser user is logged in with a valid session cookie
2. The user's request reaches the API key filter
3. The request happens to include an `X-API-KEY` header (e.g., from a browser extension, a misconfigured fetch call, or a developer testing tool)
4. That API key is invalid
5. The filter returns `401` — even though the user has a perfectly valid session

The user sees a confusing `401 Unauthorized` with no apparent reason.

**The fix:**
Check whether the `SecurityContext` already contains a valid authentication before evaluating the API key header. If auth already exists, the filter is a no-op. The session is authoritative; the API key header is irrelevant.

```java
// This check must be FIRST in the filter, before reading X-API-KEY
Authentication existingAuth = SecurityContextHolder.getContext().getAuthentication();
if (existingAuth != null && existingAuth.isAuthenticated()) {
    chain.doFilter(request, response);
    return;
}
```

This is a good example of why filter ordering and precedence must be explicitly tested, not assumed.

---

## Storing API Keys Securely

An API key is a secret credential. Storing it in plaintext in the database means a database breach exposes every key immediately.

**The pattern:** store a hash of the key, validate by hashing the incoming value and comparing.

```java
// On key creation — return the plaintext key to the caller ONCE
public ApiKeyCreationResult createKey(String tenantDomain, String label) {
    String rawKey = generateSecureKey();       // 32 bytes of SecureRandom, base64url-encoded
    String hashedKey = hash(rawKey);           // SHA-256 or bcrypt

    ApiKey entity = new ApiKey();
    entity.setDomain(tenantDomain);
    entity.setLabel(label);
    entity.setKeyHash(hashedKey);
    entity.setCreatedAt(Instant.now());
    entity.setLastUsedAt(null);
    repository.save(entity);

    // Return plaintext key to caller — this is the ONLY time it's available
    return new ApiKeyCreationResult(entity.getId(), rawKey);
}

// On validation — hash the incoming key and compare
public ApiKeyPrincipal validate(String rawKey, String tenantDomain) {
    String hash = hash(rawKey);
    return repository.findByKeyHashAndDomain(hash, tenantDomain)
                     .map(key -> {
                         key.setLastUsedAt(Instant.now());  // audit trail
                         repository.save(key);
                         return new ApiKeyPrincipal(key);
                     })
                     .orElse(null);
}
```

**Hashing algorithm choice:**
- **SHA-256**: Fast, appropriate for API keys since the keys are long (256 bits of entropy) — brute force is infeasible regardless of hash speed.
- **bcrypt**: Better for passwords (short, user-chosen secrets). Adds latency for a high-volume API key endpoint.

For API keys with high entropy, SHA-256 is standard and widely used (GitHub, Stripe, and others follow this pattern).

**Key format:**
Prefix your keys with a recognizable pattern so they're easy to identify if accidentally leaked in logs, screenshots, or error messages:

```
myapp_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
^           ^
prefix      32 random bytes (base64url)
```

GitHub, Stripe, and Anthropic all use this pattern. Tools like `git secrets` and secret scanning in GitHub can be configured to catch these prefixes before they're committed.

---

## Key Scoping and Tenant Isolation

API keys must be tenant-scoped. A key for tenant A must not work against tenant B's API subdomain.

The `validate()` method above passes `tenantDomain` from `TenantContext` and matches it against the key's stored domain. A valid key for the wrong tenant returns `null` and the filter returns `401`.

This means:
- Keys can't be shared across tenants even intentionally
- A compromised key for one tenant doesn't affect others
- The tenant domain is part of the key's identity, visible in audit logs

---

## Rotation and Revocation

Unlike JWTs, API keys don't expire automatically. This is their advantage (no re-auth) and their liability (a leaked key stays valid until explicitly revoked).

**Rotation procedure:**
1. Create a new key (system returns plaintext once)
2. Update the caller (scheduled job, script) with the new key
3. Verify the new key is working
4. Delete the old key

This is a zero-downtime rotation if done carefully. The two keys coexist briefly during the switchover.

**Audit trail:**
The `lastUsedAt` timestamp on each key makes it possible to:
- Identify keys that haven't been used in 90+ days (candidates for removal)
- Detect unexpected usage patterns (a key used at 3am that normally runs at midnight)
- Confirm a rotated key is no longer being used before deletion

---

## Endpoint Allowlist

Not every endpoint should accept API key authentication. Admin endpoints for bulk operations, data exports, or configuration changes should require explicit allowlisting rather than being implicitly available to any valid key.

```java
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(auth -> auth
            // Public endpoints — no auth required
            .requestMatchers("/api/appoint/day/**", "/api/appoint/request").permitAll()

            // API-key-accessible admin endpoints — explicitly listed
            .requestMatchers("/api/admin/report/weekly").hasAuthority("ROLE_API_CLIENT")
            .requestMatchers("/api/admin/import/csv").hasAuthority("ROLE_API_CLIENT")

            // Everything else requires JWT-based auth
            .anyRequest().hasAnyRole("USER", "ADMIN")
        );
        return http.build();
    }
}
```

This makes the attack surface explicit: you can read the security config and know exactly which endpoints an API key can reach.

---

## Testing

The test matrix for the API key filter must cover all the interaction cases, especially the session passthrough scenarios:

```java
class ApiKeyFilterTest {

    @Test
    void validApiKey_authenticatesRequest() throws Exception {
        String key = "myapp_test_validkeyvalue";
        when(apiKeyService.validate(key, "tenant.example.com"))
            .thenReturn(new ApiKeyPrincipal("tenant.example.com", List.of("ROLE_API_CLIENT")));

        request.addHeader("X-API-KEY", key);
        TenantContext.setCurrentTenant("tenant.example.com");

        filter.doFilterInternal(request, response, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(response.getStatus()).isNotEqualTo(401);
    }

    @Test
    void invalidApiKey_returns401() throws Exception {
        when(apiKeyService.validate(any(), any())).thenReturn(null);

        request.addHeader("X-API-KEY", "myapp_test_badkey");

        filter.doFilterInternal(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(401);
    }

    @Test
    void noApiKey_passesThroughToNextFilter() throws Exception {
        // No X-API-KEY header — chain should continue
        filter.doFilterInternal(request, response, chain);

        verify(chain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    // THE CRITICAL SESSION PASSTHROUGH TEST
    @Test
    void existingValidSession_withInvalidApiKey_doesNotReturn401() throws Exception {
        // Simulate a valid session already in the SecurityContext (set by JWT filter)
        Authentication existingAuth = new UsernamePasswordAuthenticationToken(
            "alice", null, AuthorityUtils.createAuthorityList("ROLE_USER")
        );
        SecurityContextHolder.getContext().setAuthentication(existingAuth);

        // Add an invalid API key header (simulates browser extension / bad client config)
        request.addHeader("X-API-KEY", "myapp_test_invalidkey");
        when(apiKeyService.validate(any(), any())).thenReturn(null);

        filter.doFilterInternal(request, response, chain);

        // MUST pass through — the existing session should NOT be invalidated
        verify(chain).doFilter(request, response);
        assertThat(response.getStatus()).isNotEqualTo(401);
    }

    @Test
    void validApiKey_wrongTenant_returns401() throws Exception {
        // Key is valid for tenant-a, but request is for tenant-b
        when(apiKeyService.validate(any(), eq("tenant-b.example.com"))).thenReturn(null);

        request.addHeader("X-API-KEY", "myapp_test_tenantakey");
        TenantContext.setCurrentTenant("tenant-b.example.com");

        filter.doFilterInternal(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(401);
    }
}
```

---

## Audit Checklist

```
Key Storage
  [ ] API keys are stored as hashes (SHA-256 or bcrypt), never plaintext
  [ ] Plaintext key is returned exactly once at creation, not stored
  [ ] Keys have a recognizable prefix for secret scanning

Key Design
  [ ] Keys are >= 256 bits of entropy (32 bytes from SecureRandom)
  [ ] Keys are tenant-scoped — cross-tenant use is rejected
  [ ] lastUsedAt is updated on every successful validation (audit trail)

Filter Logic
  [ ] Existing valid session → filter is a no-op (session passthrough)
  [ ] No X-API-KEY header → passes through (endpoint decides)
  [ ] Invalid key → 401 (not 403, not 500)
  [ ] Valid key, wrong tenant → 401

Endpoint Control
  [ ] API-key-accessible endpoints are explicitly listed, not open-ended
  [ ] ROLE_API_CLIENT is distinct from ROLE_USER and ROLE_ADMIN
  [ ] Sensitive endpoints (bulk delete, export) require additional scope or are excluded

Lifecycle
  [ ] Rotation procedure is documented and tested
  [ ] Keys unused for 90+ days are flagged for review
  [ ] Revocation removes the key immediately (no TTL/cache delay)

Tests
  [ ] Valid key → authenticated
  [ ] Invalid key → 401
  [ ] No key → passes through
  [ ] Valid session + invalid key → passes through (not 401)
  [ ] Valid key + wrong tenant → 401
```

---

*Next in the series: [Layer 5 — Spring Security: Role-Based Authorization and CORS](/blog/2026/layer5-spring-security-roles-cors)*

---

> **A note on publishing this post:** The first push of this article was rejected by GitHub's secret scanner because the example key format (`sk_live_...`) matched Stripe's live API key regex exactly. A blog post about API key security, blocked for containing what looked like a real API key. The examples were updated to use a clearly app-namespaced prefix (`myapp_live_...`) instead. This is the secret scanning feature working exactly as intended — and a good reminder that realistic-looking placeholder values in documentation are a real source of accidental secret exposure.
