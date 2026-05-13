---
layout: post
title: "Security Auditing in a Multi-Tenant SaaS: Layered Filters, JWT, and API Keys"
date: 2026-05-12
description: A practical walkthrough of how a layered security filter chain protects a multi-tenant Spring Boot API — covering SSL termination, tenant isolation, JWT validation, API key auth, and role-based access.
tags: [security, spring-boot, multi-tenant, jwt, saas, devops]
categories: architecture
giscus_comments: true
related_posts: false
toc:
  sidebar: left
---

When you run a single API instance serving multiple tenants, security isn't a single gate — it's a chain of responsibility. Each layer in the chain handles one concern and hands off to the next. This post walks through how we structured that chain in a Spring Boot 3 application sitting behind nginx, and what auditing each layer looks like in practice.

---

## The Problem Space

A multi-tenant SaaS API has a harder security job than a single-tenant one. Every request must answer two questions before touching business logic:

1. **Who is this?** (authentication)
2. **Which tenant do they belong to — and are they allowed to act here?** (tenant isolation + authorization)

Get either wrong and you risk data leakage across tenant boundaries, which is often worse than a simple auth bypass.

Our stack: **nginx → Spring Boot 3 / Java 21**, with Supabase (PostgreSQL) as the backing store and AWS SES for email. The filter chain runs on every inbound HTTP request.

---

## The Filter Chain

```
Incoming Request
  └─▶ nginx (SSL termination, Let's Encrypt)
        └─▶ TenantResolverFilter  (domain → tenant context)
              └─▶ JwtAuthenticationFilter  (Bearer token)
                    └─▶ ApiKeyFilter  (X-API-KEY header)
                          └─▶ Spring Security (@PreAuthorize, CORS)
                                └─▶ Controller
```

Each filter has a single job. Let's audit each one.

---

## Layer 1 — SSL Termination at nginx

**What it does:** All traffic arrives at nginx on port 443. nginx terminates TLS using Let's Encrypt certificates (auto-renewed via certbot every 90 days) and proxies plain HTTP to the backend on an internal port.

**Why it matters for auditing:**
- You can inspect TLS version and cipher suite configuration in one place (`ssl_protocols`, `ssl_ciphers` directives).
- Certificate expiry is the #1 cause of embarrassing production outages. Automating renewal and adding a monitoring alert (e.g., check cert expiry > 14 days) closes that gap.
- All access logs at this layer capture real client IPs before any forwarding happens — important for rate limiting and abuse detection.

**Audit checklist:**
- [ ] TLS 1.2 minimum, TLS 1.3 preferred
- [ ] Weak ciphers (`RC4`, `DES`, `3DES`) explicitly disabled
- [ ] `X-Forwarded-For` and `X-Real-IP` headers set correctly so the app sees the real client IP
- [ ] `certbot renew --dry-run` passes cleanly
- [ ] Access log format includes `$request_time` and `$upstream_response_time` for latency auditing

---

## Layer 2 — Tenant Resolution

**What it does:** A servlet filter reads the `Host` header from every request and sets a thread-local `TenantContext` with the resolved domain. Downstream, Hibernate applies a `@Filter` that appends `WHERE domain = :tenantDomain` to every query.

**Why it matters for auditing:**
This is the layer most unique to multi-tenant systems and the one most likely to be overlooked. If tenant context is missing or incorrectly set, a query could return rows from the wrong tenant — a silent data breach.

**What to verify:**
```java
// Every repository query should be scoped — never bare
// Bad:  SELECT * FROM appointments
// Good: SELECT * FROM appointments WHERE domain = 'tenant-a.example.com'
```

**Audit checklist:**
- [ ] Unit test: request with `Host: tenant-a.example.com` never returns data belonging to `tenant-b.example.com`
- [ ] Integration test: filter chain with no `Host` header returns `400 Bad Request`, never falls through to a default tenant
- [ ] Hibernate filter is enabled on *all* entities that carry tenant data (easy to miss a new entity)
- [ ] Thread-local context is cleared in a `finally` block — not clearing it in a thread pool causes context bleed between requests

---

## Layer 3 — JWT Authentication

**What it does:** Reads the `Authorization: Bearer <token>` header, validates the signature (HS256 or RS256 depending on issuer), checks expiry, and sets the Spring `SecurityContext`.

**Key decisions worth auditing:**

| Setting | Our Choice | Why |
|---|---|---|
| Algorithm | HS256 (internal) / RS256 (OAuth2) | Symmetric for speed internally; asymmetric for external IdP |
| Expiry | 1 hour | Short enough to limit blast radius on token leak |
| Refresh | Sliding session cookie | Browser clients don't re-auth every hour |
| Claims | `sub`, `domain`, `roles` | Tenant domain baked into the token — double-checks TenantContext |

**Audit checklist:**
- [ ] Algorithm is explicitly whitelisted — never `"alg": "none"`
- [ ] Expiry (`exp`) claim is validated, not just parsed
- [ ] Token domain claim is cross-checked against the resolved tenant context (defense in depth)
- [ ] Failed validation returns `401`, not `403` — the distinction matters for client error handling
- [ ] Secrets are in environment variables, never in source code or `application.properties`

---

## Layer 4 — API Key Filter

**What it does:** Some endpoints (internal automation, admin tooling, scheduled jobs) authenticate with a static `X-API-KEY` header instead of a JWT. The filter checks for this header and, if valid, marks the request as authenticated and skips JWT validation.

**The subtle bug we fixed — session passthrough:**

Early versions of this filter had a precedence issue: a valid session cookie could be overridden by an invalid API key header, producing a confusing `401` for legitimately authenticated browser sessions. The fix was explicit: if a valid session already exists in the `SecurityContext`, the API key filter is a no-op.

```java
// Pseudocode — check existing auth before evaluating API key
if (SecurityContextHolder.getContext().getAuthentication() != null
    && SecurityContextHolder.getContext().getAuthentication().isAuthenticated()) {
    chain.doFilter(request, response);
    return;
}
```

**Audit checklist:**
- [ ] API keys are hashed at rest — never stored in plaintext
- [ ] Key rotation procedure is documented and tested
- [ ] Endpoints accepting API key auth are explicitly enumerated — not a blanket allowance
- [ ] Test case: valid session + invalid API key header → request succeeds (not `401`)
- [ ] Test case: no session + valid API key header → request succeeds
- [ ] Test case: no session + invalid API key header → `401`

---

## Layer 5 — Spring Security: Roles and CORS

**What it does:** `@PreAuthorize` annotations on controller methods enforce role-based access. CORS configuration whitelists specific frontend origins.

**Roles in a multi-tenant context:**
Roles need to carry tenant scope — a `ROLE_ADMIN` for tenant A must not grant admin access to tenant B's endpoints. We enforce this at two levels: the JWT `roles` claim is tenant-scoped, and `@PreAuthorize` expressions check both role and tenant context.

**CORS audit:**
CORS misconfigurations are a common finding in security reviews. The pattern to avoid:

```java
// BAD — reflects any origin
config.setAllowedOriginPatterns(List.of("*"));

// GOOD — explicit whitelist
config.setAllowedOrigins(List.of(
    "https://www.tenant-a.example.com",
    "https://www.tenant-b.example.com"
));
```

**Audit checklist:**
- [ ] CORS allowed origins are a static whitelist, not a regex that can be tricked (e.g., `evil-tenant-a.example.com`)
- [ ] `@PreAuthorize` is present on all state-changing endpoints (POST, PATCH, DELETE)
- [ ] Read endpoints that return sensitive data also carry `@PreAuthorize` — not just writes
- [ ] A dedicated integration test hits each secured endpoint without auth and expects `401`/`403`

---

## Putting It Together — The Audit Matrix

Here's a condensed view of what to test at each layer:

| Layer | Tool | Test Type |
|---|---|---|
| SSL / nginx | `testssl.sh`, `nmap --script ssl-enum-ciphers` | External scan |
| Tenant isolation | JUnit + `MockMvc`, custom `UserRepositoryDomainIsolationTest` | Unit + integration |
| JWT | JUnit `JwtAuthenticationFilterTest`, `JwtUtilTest` | Unit |
| API Key | JUnit `ApiKeyFilterTest` (valid key, invalid key, session passthrough) | Unit |
| Roles / CORS | Spring Security integration tests (`SecurityConfigIT`, `AdminTokenIT`) | Integration |

Running these as part of CI means every pull request proves the security chain is intact — not just that business logic works.

---

## A Note on Auth Modes

Our API supports four authentication paths that can coexist:

```
JWT (HS256, 1hr)         — stateless API clients, mobile
Session Cookie           — browser sessions (SameSite: Lax)
Admin API Key            — internal tooling, scheduled jobs
Google OAuth2            — Sign in with Google (external IdP)
```

The filter chain handles all four without conflict because each filter checks for its own credential type and short-circuits cleanly if it finds a different (already valid) auth mode in the `SecurityContext`.

---

## Key Takeaway

Security in a multi-tenant system is not one thing you add — it's a sequence of concerns, each handled in the right place:

- **nginx** handles TLS and access logging
- **Tenant filter** handles data isolation
- **JWT filter** handles user identity
- **API key filter** handles machine-to-machine auth
- **Spring Security** handles authorization

When each layer has clear, testable responsibility, auditing becomes a checklist rather than a mystery. And when something breaks, the layer structure tells you exactly where to look.

---

*Next up: how we handle email template overrides per tenant without leaking template data across tenant boundaries.*
