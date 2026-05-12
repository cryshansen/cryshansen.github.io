---
layout: post
title: "Layer 2 — Tenant Resolution: How a Single API Instance Serves Multiple Customers Safely"
date: 2026-05-12 09:10:00 -0500
description: A deep dive into multi-tenant data isolation using Host-header-based tenant resolution, thread-local context, and Hibernate filters — including the failure modes that cause data leakage.
tags: [multi-tenant, spring-boot, hibernate, security, saas, data-isolation]
categories: architecture
series: security-layers
giscus_comments: true
related_posts: true
toc:
  sidebar: left
---

> This post is part of the [Security Auditing in a Multi-Tenant SaaS](/blog/2026/security-auditing-layers-multitenant-saas) series. Each post deep-dives one layer of the filter chain.

Tenant isolation is the security concern most specific to multi-tenant systems — and the one most likely to be quietly broken by a well-intentioned feature change. Unlike authentication failures (which produce visible errors), tenant isolation failures produce invisible ones: a query silently returns another tenant's data without raising an exception.

This post covers how we implement and audit tenant resolution in a Spring Boot application serving multiple customers from a single instance.

---

## The Core Problem

When a single database and a single API process serve multiple tenants, every database query must be scoped to the correct tenant. There are two ways to achieve this:

1. **Separate databases per tenant** — clean isolation, expensive and operationally complex
2. **Shared database with a tenant discriminator column** — efficient, manageable, but requires discipline

We use option 2: a `domain` column on every tenant-scoped table, with automatic query filtering applied at the ORM layer.

The risk is clear: if the filter is missing on one entity, or if tenant context is set incorrectly, a query returns rows from the wrong tenant. The application never throws an exception — it just silently serves the wrong data.

---

## How Tenant Resolution Works

### Step 1 — Read the Host Header (nginx → Filter)

nginx preserves the original `Host` header when proxying to the backend (see [Layer 1](/blog/2026/layer1-nginx-ssl-termination)). A servlet filter reads it on every request:

```java
@Component
@Order(1)  // runs before JWT filter
public class TenantResolverFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        String host = request.getHeader("Host");

        if (host == null || host.isBlank()) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Missing Host header");
            return;
        }

        // Strip port if present: api.tenant.com:8080 → api.tenant.com
        String domain = host.contains(":") ? host.split(":")[0] : host;

        // Resolve to the frontend domain if this is an API subdomain
        // api.tenant.com → tenant.com
        String tenantDomain = resolveTenantDomain(domain);

        if (!tenantRegistry.isKnownTenant(tenantDomain)) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Unknown tenant");
            return;
        }

        TenantContext.setCurrentTenant(tenantDomain);
        try {
            chain.doFilter(request, response);
        } finally {
            TenantContext.clear();  // CRITICAL — see below
        }
    }
}
```

### Step 2 — Thread-Local Context

`TenantContext` holds the current tenant for the duration of the request:

```java
public class TenantContext {
    private static final ThreadLocal<String> CURRENT_TENANT = new ThreadLocal<>();

    public static void setCurrentTenant(String domain) {
        CURRENT_TENANT.set(domain);
    }

    public static String getCurrentTenant() {
        return CURRENT_TENANT.get();
    }

    public static void clear() {
        CURRENT_TENANT.remove();  // remove(), not set(null)
    }
}
```

**Why `remove()` and not `set(null)`?**
Thread pools reuse threads. If a thread processes request A (tenant X) and then request B (tenant Y), the ThreadLocal value from request A persists into request B unless explicitly cleared. `remove()` removes the entry from the ThreadLocal map entirely. `set(null)` leaves the entry in the map — which can cause subtle issues if code checks `!= null` rather than calling `getCurrentTenant()`.

The `finally` block in the filter ensures `clear()` is called even if the request throws an exception.

### Step 3 — Hibernate Filter

The resolved domain is applied as an automatic query filter via Hibernate's `@Filter` mechanism:

```java
// On the base entity or each tenant-scoped entity
@Entity
@FilterDef(name = "tenantFilter",
           parameters = @ParamDef(name = "tenantDomain", type = String.class))
@Filter(name = "tenantFilter", condition = "domain = :tenantDomain")
public class Appointment {
    @Column(name = "domain", nullable = false)
    private String domain;
    // ... other fields
}
```

```java
// In a Spring interceptor or repository base class — enable the filter per session
@Autowired
private EntityManager entityManager;

public void enableTenantFilter() {
    Session session = entityManager.unwrap(Session.class);
    session.enableFilter("tenantFilter")
           .setParameter("tenantDomain", TenantContext.getCurrentTenant());
}
```

The result: every `SELECT` that Hibernate generates for `@Filter`-annotated entities automatically appends `WHERE domain = 'tenant.example.com'`. The application code never needs to remember to add a `.where(domain = ?)` clause — it's structural.

---

## The Failure Modes

### Failure Mode 1 — Missing Filter on a New Entity

Every time a new entity is added to the codebase, the `@Filter` and `domain` column must be added deliberately. It's easy to forget, especially on entities that feel "global" (e.g., configuration tables that seem cross-tenant but aren't).

**Detection:** A test that queries the entity from one tenant context and asserts that records from another tenant are not returned:

```java
@Test
void domainFilter_preventsDataLeakAcrossTenants() {
    // Create a record for tenant A
    TenantContext.setCurrentTenant("tenant-a.example.com");
    enableTenantFilter();
    repository.save(new SomeEntity("tenant-a.example.com", "value-A"));

    // Query as tenant B — should return nothing
    TenantContext.setCurrentTenant("tenant-b.example.com");
    enableTenantFilter();
    List<SomeEntity> results = repository.findAll();

    assertThat(results).isEmpty();
}
```

### Failure Mode 2 — Context Not Cleared Between Requests

If the `TenantContext.clear()` is not in a `finally` block, an exception during request processing leaves stale context on the thread. The next request processed by that thread inherits the wrong tenant.

**Symptom:** Intermittent wrong-tenant data, only under error conditions, very hard to reproduce.

**Detection:** A test that simulates an exception mid-request and then makes a new request on the same thread, asserting that the context is clean.

### Failure Mode 3 — Missing Host Header Returns a Default Tenant

An early version of this filter had a fallback: if `Host` was missing, it defaulted to the primary tenant domain. This meant a malformed request (or a request from a misconfigured client) would silently get data from the default tenant.

The correct behavior is to return `400 Bad Request` and log the missing header. No fallback, no default.

### Failure Mode 4 — API Subdomain Leaks Into Tenant Domain

If the filter resolves `api.tenant.com` but the database records have `domain = 'www.tenant.com'`, the filter returns zero rows for every query — which looks like empty data rather than a bug.

Normalize domain resolution in `resolveTenantDomain()` to always map to the canonical frontend domain, and assert in a test that various input formats (with/without `api.`, with/without port) all resolve to the same canonical value.

---

## Testing Tenant Isolation

### Unit Tests

Test the filter in isolation with a `MockHttpServletRequest`:

```java
@Test
void resolvesCorrectDomain_fromHostHeader() throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.addHeader("Host", "api.tenant.example.com");

    filter.doFilterInternal(request, response, chain);

    assertThat(TenantContext.getCurrentTenant()).isEqualTo("tenant.example.com");
}

@Test
void returns400_whenHostHeaderMissing() throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest();
    // No Host header

    filter.doFilterInternal(request, response, chain);

    assertThat(response.getStatus()).isEqualTo(400);
    assertThat(TenantContext.getCurrentTenant()).isNull(); // not set
}

@Test
void clearsTenantContext_afterRequestCompletes() throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.addHeader("Host", "api.tenant.example.com");

    filter.doFilterInternal(request, response, chain);

    // Context should be cleared after filter completes
    assertThat(TenantContext.getCurrentTenant()).isNull();
}
```

### Integration Test — Domain Isolation at the Repository Level

```java
@SpringBootTest
@Transactional
class UserRepositoryDomainIsolationTest {

    @Test
    void userRepository_doesNotReturnDataAcrossTenants() {
        // Seed data for two tenants
        seedUser("alice@tenant-a.example.com", "tenant-a.example.com");
        seedUser("bob@tenant-b.example.com", "tenant-b.example.com");

        // Query as tenant A
        TenantContext.setCurrentTenant("tenant-a.example.com");
        enableTenantFilter();
        List<User> tenantAUsers = userRepository.findAll();

        assertThat(tenantAUsers).hasSize(1);
        assertThat(tenantAUsers.get(0).getEmail()).isEqualTo("alice@tenant-a.example.com");
        // Bob's record must not appear
        assertThat(tenantAUsers).noneMatch(u -> u.getEmail().equals("bob@tenant-b.example.com"));
    }
}
```

This test is the most important test in the security suite. It should run on every pull request.

---

## The Tenant Registry

Knowing *which* domains are valid tenants is itself a security concern. Without a registry check, an attacker could craft a request with `Host: attacker.com` and potentially create a new tenant context in your system.

The registry should be populated at startup from a trusted source (database, config file, environment variable) and cached. Invalid domains are rejected at the filter layer before any further processing.

```java
@Service
public class TenantRegistry {
    private final Set<String> knownDomains;

    public TenantRegistry(TenantRepository repo) {
        // Load at startup, cache in memory
        this.knownDomains = repo.findAllDomains()
                                .stream()
                                .collect(Collectors.toUnmodifiableSet());
    }

    public boolean isKnownTenant(String domain) {
        return knownDomains.contains(domain);
    }
}
```

For a system where tenants are provisioned dynamically, the registry needs to be refreshable without a restart — typically via a cache with a short TTL or an event-driven invalidation mechanism.

---

## Audit Checklist

```
Tenant Resolution
  [ ] Host header is required — no fallback to a default tenant
  [ ] Unknown Host headers return 400, not 200 with empty data
  [ ] Domain is normalized (strip api. prefix, strip port)
  [ ] TenantRegistry validates Host against known tenants at startup

Thread-Local Context
  [ ] TenantContext.clear() is always in a finally block
  [ ] Uses ThreadLocal.remove(), not set(null)
  [ ] No code path sets TenantContext without a corresponding clear

Hibernate Filter
  [ ] @Filter annotation present on every tenant-scoped entity
  [ ] Filter is enabled per-session before any repository calls
  [ ] New entities added to a checklist review: "does this need tenant scoping?"

Tests
  [ ] TenantResolverFilterTest covers: valid host, missing host, unknown host
  [ ] TenantContextTest covers: set, get, clear, clear-on-exception
  [ ] UserRepositoryDomainIsolationTest (or equivalent) runs on every PR
  [ ] Integration test seeds two tenants, queries as one, asserts the other is invisible
```

---

## What Comes Next

Once the tenant is resolved and set in context, the request knows *which* customer it's serving. The next question is *who* the user is — which is where JWT validation takes over.

---

*Next in the series: [Layer 3 — JWT Authentication: Stateless Identity with Short-Lived Tokens](/blog/2026/layer3-jwt-authentication)*
