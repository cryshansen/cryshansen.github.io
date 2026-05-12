---
layout: post
title: "Layer 3 — JWT Authentication: Stateless Identity with Short-Lived Tokens"
date: 2026-05-12 09:20:00 -0500
description: A deep dive into JWT authentication in a Spring Boot multi-tenant API — covering algorithm choice, claim design, expiry, token validation order, and the tests that prove it's working.
tags: [jwt, authentication, spring-boot, security, oauth2, java]
categories: architecture
series: security-layers
giscus_comments: true
related_posts: true
toc:
  sidebar: left
---

> This post is part of the [Security Auditing in a Multi-Tenant SaaS](/blog/2026/security-auditing-layers-multitenant-saas) series. Each post deep-dives one layer of the filter chain.

By the time a request reaches the JWT filter, nginx has already terminated TLS ([Layer 1](/blog/2026/layer1-nginx-ssl-termination)) and the tenant is resolved ([Layer 2](/blog/2026/layer2-tenant-resolution)). The system knows *which* customer this request is for. The JWT filter answers the next question: **who is the user, and are they who they say they are?**

---

## Why JWTs for a SaaS API?

JWTs are a good fit for this architecture because:

- **Stateless** — the server doesn't need to query a session store for every request. The token carries its own claims.
- **Self-contained** — roles, tenant domain, and user identity travel together in one verifiable payload.
- **Works across services** — a token issued by the main API can be verified by other services (ML scorer, Lambda functions) without a shared session store.

The tradeoff: a JWT cannot be revoked before expiry without additional infrastructure (a deny-list or short-lived tokens + rotation). We manage this with a 1-hour expiry and session cookies for browser clients.

---

## Algorithm Choice

JWTs support multiple signing algorithms. The choice matters significantly:

| Algorithm | Type | Key Material | Use Case |
|---|---|---|---|
| `HS256` | Symmetric (HMAC) | Single shared secret | Internal API, same process issues and verifies |
| `RS256` | Asymmetric (RSA) | Private key signs, public key verifies | External IdP, third-party verification |
| `none` | None | — | **Never use. A well-known attack vector.** |

We use **HS256** for tokens issued by our own API and **RS256** for tokens issued by external identity providers (e.g., Google OAuth2). The algorithm must be explicitly whitelisted — never inferred from the token header.

```java
// WRONG — trusts the algorithm declared in the token
Jwts.parser().parseClaimsJws(token);

// CORRECT — explicitly require HS256
Jwts.parserBuilder()
    .setSigningKey(secretKey)
    .requireAlgorithm("HS256")
    .build()
    .parseClaimsJws(token);
```

**The `alg: none` attack:** An attacker can craft a JWT with `"alg": "none"` in the header and an empty signature. A parser that trusts the token's declared algorithm will skip signature verification entirely and accept the forged token. Always specify the algorithm on the parser, never on the token.

---

## Token Structure and Claims

A JWT has three parts: header, payload (claims), and signature. The payload is what matters for application logic:

```json
{
  "sub": "user-uuid-here",
  "email": "alice@example.com",
  "domain": "tenant.example.com",
  "roles": ["ROLE_ADMIN"],
  "iat": 1746000000,
  "exp": 1746003600
}
```

**Claim design decisions:**

- **`sub`** — the stable user identifier (UUID, not email, so it survives email changes)
- **`domain`** — the tenant domain, baked into the token. This is a second layer of tenant isolation: even if the JWT filter ran before the tenant filter, the token itself carries the tenant context. We cross-check this against `TenantContext` as a defense-in-depth measure.
- **`roles`** — kept as a list so multi-role users are handled naturally
- **`iat` / `exp`** — issued-at and expiry, both validated on parse. `exp - iat = 3600` (1 hour)
- **No sensitive data in claims** — JWT payloads are base64-encoded, not encrypted. Anyone with the token can read the claims. Never put passwords, PII beyond an identifier, or internal system details in a JWT.

---

## The Filter Implementation

```java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        // No Bearer token — pass through, let Spring Security decide
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        try {
            Claims claims = jwtUtil.validateAndParseClaims(token);

            // Cross-check token domain with resolved tenant context
            String tokenDomain = claims.get("domain", String.class);
            String tenantDomain = TenantContext.getCurrentTenant();
            if (!tokenDomain.equals(tenantDomain)) {
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token domain mismatch");
                return;
            }

            // Build Spring Security authentication from claims
            UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                    claims.getSubject(),
                    null,
                    AuthorityUtils.createAuthorityList(
                        claims.get("roles", List.class).toArray(new String[0])
                    )
                );

            SecurityContextHolder.getContext().setAuthentication(auth);

        } catch (ExpiredJwtException e) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token expired");
            return;
        } catch (JwtException e) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid token");
            return;
        }

        chain.doFilter(request, response);
    }
}
```

**Key design choices in this filter:**

1. **Missing token is not an error** — the filter passes through if no `Authorization` header is present. Whether the endpoint requires auth is decided by Spring Security's `@PreAuthorize` annotations downstream (Layer 5). This separation means the JWT filter doesn't need to know which endpoints are public.

2. **Token domain cross-check** — compares the `domain` claim against the tenant context set in Layer 2. A valid token from one tenant cannot be used against another tenant's API subdomain.

3. **Specific error handling** — `ExpiredJwtException` and `JwtException` produce `401`, not `500`. This matters for client error handling and also prevents exception stack traces from leaking internal details in the response body.

---

## Token Issuance

Tokens are issued at login:

```java
public String generateToken(User user, String tenantDomain) {
    Date now = new Date();
    Date expiry = new Date(now.getTime() + Duration.ofHours(1).toMillis());

    return Jwts.builder()
        .setSubject(user.getId().toString())
        .claim("email", user.getEmail())
        .claim("domain", tenantDomain)
        .claim("roles", user.getRoles())
        .setIssuedAt(now)
        .setExpiration(expiry)
        .signWith(secretKey, SignatureAlgorithm.HS256)
        .compact();
}
```

**Secret key management:**
The signing secret must never be in source code. Load it from an environment variable at startup:

```java
@Value("${jwt.secret}")
private String jwtSecret;

@Bean
public SecretKey jwtSecretKey() {
    byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
    return Keys.hmacShaKeyFor(keyBytes);
}
```

The secret should be at least 256 bits (32 bytes) of random data, base64-encoded. Generate with:

```bash
openssl rand -base64 32
```

Store in your environment or secrets manager, never in `application.properties` or committed to git.

---

## Browser Clients — The Session Cookie Layer

Browser clients face a UX problem with 1-hour JWT expiry: users get logged out mid-session. We solve this with a parallel session cookie:

- On login, the server sets a `HttpOnly; Secure; SameSite=Lax` cookie with a sliding expiry (e.g., 7 days)
- On subsequent requests, the browser sends the cookie automatically
- If the JWT has expired, the server can issue a fresh JWT using the session cookie
- The API key filter (Layer 4) respects an existing valid session and does not interfere with it

```
Browser login flow:
  POST /api/auth/login
  ← 200 OK
  ← Set-Cookie: session=<id>; HttpOnly; Secure; SameSite=Lax; Max-Age=604800
  ← Body: { token: "<jwt>" }

Subsequent requests (JWT still valid):
  GET /api/... 
  Authorization: Bearer <jwt>
  Cookie: session=<id>
  → JWT filter authenticates from Bearer token

After JWT expiry (session still valid):
  GET /api/...
  Cookie: session=<id>  (no Authorization header)
  → Session filter issues fresh JWT transparently
```

**SameSite=Lax** protects against CSRF by default: the cookie is only sent on same-site requests and top-level cross-site GET navigations. State-changing requests (POST, PATCH, DELETE) from cross-origin pages don't include the cookie.

---

## Google OAuth2 — External Identity Provider

For "Sign in with Google", the flow produces a Google-issued ID token (RS256), which we validate against Google's public keys:

```java
// Validate Google ID token
GoogleIdToken idToken = verifier.verify(idTokenString);
if (idToken == null) {
    throw new UnauthorizedException("Invalid Google token");
}

GoogleIdToken.Payload payload = idToken.getPayload();
String email = payload.getEmail();
boolean emailVerified = payload.getEmailVerified();

// Map to internal user and issue our own JWT
User user = userService.findOrCreateFromGoogle(email, tenantDomain);
String internalJwt = jwtUtil.generateToken(user, tenantDomain);
```

**Never trust a Google token without verifying it.** The `verifier.verify()` call:
1. Checks the signature against Google's current public keys (fetched and cached from `https://www.googleapis.com/oauth2/v3/certs`)
2. Validates the `aud` claim matches your registered client ID
3. Validates the `exp` claim

After verification, we issue our own internal JWT — downstream systems only need to know about one token format.

---

## Testing

```java
class JwtAuthenticationFilterTest {

    @Test
    void validToken_authenticatesAndSetsSecurityContext() throws Exception {
        String token = jwtUtil.generateToken(testUser, "tenant.example.com");

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        // Assume TenantContext already set by Layer 2 filter
        TenantContext.setCurrentTenant("tenant.example.com");

        filter.doFilterInternal(request, response, chain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.isAuthenticated()).isTrue();
    }

    @Test
    void expiredToken_returns401() throws Exception {
        String expiredToken = generateExpiredToken(testUser, "tenant.example.com");

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + expiredToken);
        TenantContext.setCurrentTenant("tenant.example.com");

        filter.doFilterInternal(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(401);
    }

    @Test
    void tokenDomainMismatch_returns401() throws Exception {
        // Token issued for tenant A, but request is for tenant B
        String token = jwtUtil.generateToken(testUser, "tenant-a.example.com");

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        TenantContext.setCurrentTenant("tenant-b.example.com");  // different tenant

        filter.doFilterInternal(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(401);
    }

    @Test
    void noAuthHeader_passesThroughToNextFilter() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        // No Authorization header

        filter.doFilterInternal(request, response, chain);

        verify(chain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void algNoneToken_isRejected() throws Exception {
        String forgedToken = buildAlgNoneToken(testUser);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + forgedToken);

        filter.doFilterInternal(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(401);
    }
}
```

---

## Audit Checklist

```
Algorithm
  [ ] Signing algorithm is explicitly whitelisted in the parser
  [ ] alg:none token is rejected (test exists)
  [ ] HS256 secret is >= 256 bits of entropy
  [ ] RS256 public keys are cached with TTL for external IdP

Claims
  [ ] exp claim is validated on every parse
  [ ] domain claim is cross-checked against TenantContext
  [ ] No sensitive data (passwords, PII) in token payload
  [ ] sub is a stable UUID, not email

Secret Management
  [ ] JWT secret loaded from environment variable, never from source code
  [ ] Secret is not logged (check logging config)
  [ ] Secret rotation procedure is documented

Session Cookie
  [ ] HttpOnly flag set (JS cannot read the cookie)
  [ ] Secure flag set (only sent over HTTPS)
  [ ] SameSite=Lax set (CSRF protection)
  [ ] Max-Age is set (cookie expires; not a session-only cookie)

Tests
  [ ] Valid token → 200, SecurityContext populated
  [ ] Expired token → 401
  [ ] Token domain mismatch → 401
  [ ] No auth header → passes through (endpoint decides)
  [ ] alg:none token → 401
  [ ] Tampered signature → 401
```

---

*Next in the series: [Layer 4 — API Key Authentication: Securing Machine-to-Machine Requests](/blog/2026/layer4-api-key-authentication)*
