---
layout: post
title: "Layer 1 — nginx as Your Security Perimeter: SSL Termination and Access Logging"
date: 2026-05-12 09:00:00 -0500
description: A deep dive into using nginx as the outermost security layer in a multi-tenant SaaS — covering TLS configuration, Let's Encrypt automation, access log design, and rate limiting.
tags: [nginx, ssl, tls, security, devops, lets-encrypt]
categories: [architecture, devops-posts]
series: security-layers
giscus_comments: true
related_posts: true
toc:
  sidebar: left
---

> This post is part of the [Security Auditing in a Multi-Tenant SaaS](/blog/2026/security-auditing-layers-multitenant-saas) series. Each post deep-dives one layer of the filter chain.

nginx sits at the edge. Before a request reaches your application, framework, or business logic, it passes through nginx — which means nginx is your first and best opportunity to reject bad traffic cheaply.

This post covers what nginx is actually doing in a production multi-tenant setup, why each configuration decision matters, and how to audit that it's doing its job.

---

## What nginx Is Responsible For

In this stack, nginx has four jobs:

1. **TLS termination** — decrypt HTTPS, forward plain HTTP internally
2. **Tenant routing** — forward requests with a `Host` header the app can trust
3. **Access logging** — record every request at the perimeter
4. **A first line of rate limiting** — before requests hit application threads

It is _not_ responsible for authentication, authorization, or business logic. The moment you start adding auth logic to nginx config, you're fighting the tool.

---

## TLS Configuration

### Why terminate at nginx?

Your application doesn't need to know about TLS. By terminating at nginx:

- Certificate management is centralized in one place
- The app connects to nginx over plain HTTP on a local port (never exposed externally)
- You can upgrade TLS configuration without touching application code

### Let's Encrypt + certbot

Let's Encrypt issues free 90-day certificates. The renewal lifecycle is fully automatable:

```bash
# Initial issuance
certbot --nginx -d api.yourdomain.com

# Auto-renewal (runs twice daily via cron or systemd timer)
certbot renew --quiet

# Dry run — always test this in CI
certbot renew --dry-run
```

**The production risk:** certbot renewal fails silently more often than people expect — usually due to firewall rules blocking port 80 (which the HTTP-01 challenge needs) or DNS propagation delays after infrastructure changes. Set a monitoring alert that fires when the certificate is fewer than 14 days from expiry.

```bash
# Check expiry from the command line
echo | openssl s_client -connect api.yourdomain.com:443 2>/dev/null \
  | openssl x509 -noout -dates
```

### TLS Protocol and Cipher Configuration

Modern nginx config should look roughly like this:

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;
ssl_stapling on;
ssl_stapling_verify on;
```

**What each line does:**

- `ssl_protocols` — TLS 1.0 and 1.1 are deprecated (RFC 8996). Never enable them.
- `ssl_prefer_server_ciphers on` — the server's cipher preference wins, not the client's. Prevents a client from negotiating down to a weaker cipher.
- `ssl_ciphers` — ECDHE cipher suites provide forward secrecy: even if the private key is later compromised, past sessions cannot be decrypted.
- `ssl_stapling` — OCSP stapling caches the certificate revocation status at nginx, preventing a round trip to Let's Encrypt's OCSP server on every handshake.

**Audit with testssl.sh:**

```bash
# Run against your live endpoint
docker run --rm drwetter/testssl.sh api.yourdomain.com

# What to look for in output:
# ✓ TLS 1.3 offered
# ✓ TLS 1.2 offered
# ✗ TLS 1.1 not offered
# ✗ TLS 1.0 not offered
# ✓ Forward Secrecy offered
# ✓ OCSP stapling
# ✗ No BEAST, POODLE, CRIME, HEARTBLEED vulnerabilities
```

---

## Tenant Routing via the Host Header

In a multi-tenant setup where a single backend instance serves multiple domains, nginx is responsible for preserving the `Host` header so the application can resolve the tenant.

```nginx
# api.tenant-a.example.com
server {
    listen 443 ssl;
    server_name api.tenant-a.example.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;             # preserve original Host
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# api.tenant-b.example.com — same backend, different Host
server {
    listen 443 ssl;
    server_name api.tenant-b.example.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Critical:** `proxy_set_header Host $host` — without this, nginx sends its own `server_name` as the Host header, which might be a catch-all and break tenant resolution entirely. This is a configuration mistake that's easy to miss and hard to debug.

**X-Forwarded-For and real IPs:**
If your application logs IP addresses for audit purposes, it must read from `X-Forwarded-For`, not `RemoteAddr` (which will always be `127.0.0.1` when proxied). Configure your application to trust this header only from localhost.

---

## Access Log Design

The default nginx access log format loses information you'll want during a security incident. Design your log format before you need it.

```nginx
log_format detailed '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent" '
                    'host=$host '
                    'rt=$request_time '         # total request time
                    'uct=$upstream_connect_time '
                    'urt=$upstream_response_time '
                    'cs=$upstream_cache_status';

access_log /var/log/nginx/access.log detailed;
```

**Why `$host` in the log?**
In a multi-tenant setup, the same nginx process handles multiple domains. Without `host=` in the log line, you can't filter logs by tenant during an incident.

**Why `$request_time` and `$upstream_response_time`?**

- `$request_time` — wall clock from first byte received to last byte sent (includes network time)
- `$upstream_response_time` — time the backend spent processing

A spike in `$upstream_response_time` with normal `$request_time` points to a slow query. A spike in `$request_time` with a fast `$upstream_response_time` points to a slow network or large response body. These two numbers together tell you where a performance problem lives without touching the application.

**Log rotation:**
nginx logs are append-only and grow without bound. Configure logrotate:

```
/var/log/nginx/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    sharedscripts
    postrotate
        nginx -s reopen
    endscript
}
```

---

## Rate Limiting at the Perimeter

nginx can reject excessive requests before they consume application threads — the cheapest possible form of rate limiting.

```nginx
# Define a rate limit zone in http block
http {
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/m;
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;
}

server {
    # Tighter limit on auth endpoints
    location /api/auth/ {
        limit_req zone=auth_limit burst=3 nodelay;
        limit_req_status 429;
        proxy_pass http://localhost:8080;
    }

    # General API limit
    location /api/ {
        limit_req zone=api_limit burst=10 nodelay;
        limit_req_status 429;
        proxy_pass http://localhost:8080;
    }
}
```

**`burst`** — allows short bursts above the rate limit before throttling. `burst=10` means up to 10 requests can queue before nginx starts returning 429.

**`nodelay`** — processes burst requests immediately rather than spacing them out. Without this, a burst of 10 requests takes 10x the rate interval to drain, which breaks legitimate clients.

**Tuning auth endpoints separately** matters. A brute-force attack on a login endpoint looks like a burst of POST requests from one IP. `5r/m` with `burst=3` means an attacker gets 8 attempts before being throttled — your application's own lockout logic (e.g., after 5 failed attempts) should handle the rest.

---

## Security Headers

Add these to every HTTPS response:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

**HSTS (`Strict-Transport-Security`):** Tells browsers never to connect over plain HTTP. `max-age=31536000` is one year. `includeSubDomains` ensures subdomains are also forced to HTTPS — be careful here if you have any HTTP-only subdomains.

**`X-Content-Type-Options: nosniff`:** Prevents browsers from MIME-sniffing a response away from the declared `Content-Type`. Stops a class of attacks where malicious content is uploaded as an image and executed as JavaScript.

**`X-Frame-Options: DENY`:** Prevents your app from being embedded in an iframe on another domain — closes clickjacking.

---

## Audit Checklist

```
SSL / TLS
  [ ] TLS 1.0 and 1.1 disabled
  [ ] TLS 1.2 and 1.3 enabled
  [ ] ECDHE cipher suites (forward secrecy)
  [ ] OCSP stapling enabled
  [ ] Certificate expiry monitored (alert < 14 days)
  [ ] certbot renew --dry-run passes in CI

Proxy Headers
  [ ] proxy_set_header Host $host present in all tenant server blocks
  [ ] X-Real-IP and X-Forwarded-For set correctly
  [ ] Application configured to trust X-Forwarded-For only from localhost

Logging
  [ ] Custom log format includes $host, $request_time, $upstream_response_time
  [ ] logrotate configured, 14-day retention minimum
  [ ] Logs shipped to a centralized store (even S3) for incident forensics

Rate Limiting
  [ ] Auth endpoints have tighter limits than general API
  [ ] 429 response (not 503) for rate-limited requests
  [ ] Burst configured so legitimate clients aren't broken

Security Headers
  [ ] HSTS with includeSubDomains
  [ ] X-Content-Type-Options: nosniff
  [ ] X-Frame-Options: DENY

External Scan
  [ ] testssl.sh shows no critical findings
  [ ] Mozilla Observatory score A or above (https://observatory.mozilla.org)
```

---

## What nginx Does Not Do

To close: nginx is not the right place to handle application-level auth. If you find yourself writing Lua scripts in nginx to validate JWTs or check database state, that logic belongs in the application. nginx's job is to be a fast, reliable proxy with good TLS — not a policy engine.

The tenant resolution, JWT validation, and authorization logic in the layers that follow all happen inside the application, where you have proper testing infrastructure and language-native error handling.

---

_Next in the series: [Layer 2 — Tenant Resolution: How a Single API Instance Serves Multiple Customers Safely](/blog/2026/layer2-tenant-resolution)_
