---
layout: post
title: "Bridging the Gap: Connecting React (Azure SWA) to a Secured .NET 8 API"
date: 2026-06-29
tags: [architecture, fullstack, .net , azure, swa, api]
categories: [devOps,.net]
description: A architectural breakdown of resolving Cross-Origin (CORS) cookie authentication constraints between Azure Static Web Apps and Azure App Service.
toc:
  beginning: true
mermaid:
  enabled: true
---

Deploying a modern full-stack web application into production requires a clean separation of concerns. In our previous post, we hardened a .NET 8 Minimal API backend using Role-Based Access Control (RBAC). 

Today, we take the architecture full-stack by introducing a highly responsive React user interface styled with Material-UI, hosted globally via **Azure Static Web Apps (SWA)**, and bound directly to our live Azure cloud engine.

---

## The Full-Stack Demo

The integrated environment is live and communicating across cloud domains. Explore the running build or inspect the split-repository source pipelines below:

<div class="text-center" style="margin: 25px 0; display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
    <a href="https://proud-moss-0cfd07110.7.azurestaticapps.net" alt="GatekeeperAuth" title="GatekeeperAuth" class="btn btn-sm z-depth-1" target="_blank" rel="noopener noreferrer" style="background-color: #0078d4; color: white; padding: 10px 15px;">
        <i class="fa-solid fa-rocket"></i> Launch Live App
    </a>
    <a href="https://github.com/cryshansen/Gatekeeper-ui" class="btn btn-sm z-depth-1" target="_blank" rel="noopener noreferrer" style="padding: 10px 15px;">
        <i class="fa-brands fa-github"></i> Frontend Repository
    </a>
    <a href="https://github.com/cryshansen/GateKeeperAuth" class="btn btn-sm z-depth-1" target="_blank" rel="noopener noreferrer" style="padding: 10px 15px;">
        <i class="fa-solid fa-code-branch"></i> Backend Repository
    </a>
</div>

---

## Distributed Cloud Architecture

To maximize efficiency and eliminate unnecessary server overhead, we decoupled our client layers from our logic compute blocks. The system operates across two isolated Azure environments:

```mermaid
graph LR
    subgraph Client Space (CDN Edge)
        A[React SWA UI] -->|HTTPS Requests + Credentials| B(.NET 8 App Service)
    end
    subgraph Compute Space (Azure Core)
        B -->|Validates Session| C[Secure Endpoints]
        B -.->|SameSite=None Cookie| A
    end
    style A fill:#61dafb,stroke:#333,stroke-width:2px,color:#000
    style B fill:#512bd4,stroke:#333,stroke-width:2px,color:#fff
```
---

## The Cross-Domain Cookie Challenge
Because our frontend and backend run on distinct Azure service structures, they communicate across entirely separate domains. By default, standard security contexts block authentication tokens from tracking across unmapped endpoints.

To overcome this without resorting to unsecure local storage tokens, we shifted our .NET architecture to enforce explicit trust guidelines:

SameSiteMode.None + forced SSL to permit cross-domain browser cookie persistence.

AllowCredentials() within CORS to authorize Axios asynchronous calls to inherit background session authorization rules natively.

- 1. Updating the .NET Security Gates
To safely handshake with our remote React build, we modified Program.cs to handle incoming cross-origin headers gracefully:

``` C#
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactAppPolicy", policy =>
    {
        policy.WithOrigins("[https://your-react-app-name.azurestaticapps.net](https://your-react-app-name.azurestaticapps.net)")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Essential for cross-origin cookie passing
    });
});

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "GatekeeperSession";
        options.Cookie.HttpOnly = true; 
        options.Cookie.SameSite = SameSiteMode.None; // Required for cross-domain
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always; // Required for SameSite=None
    });
```

- 2. Injecting Compilation Variables via GitHub Actions
Because static web environments compile application scripts completely down to minimized browser assets prior to runtime distribution, standard server-side configuration mapping is unreachable. Instead, we injected our backend variables directly into our delivery pipelines via encrypted GitHub Repository Secrets.

Our automated workflow file (.github/workflows/azure-static-web-apps.yml) intercepts these fields smoothly during build execution:

``` YAML
      - name: Build And Deploy
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          action: "upload"
          app_location: "/"
          output_location: "build"
        env: 
          REACT_APP_API_BASE: ${{ secrets.REACT_APP_API_BASE }}
```

Now, when our Axios wrapper calls process.env.REACT_APP_API_BASE, it hooks directly into our cloud architecture instantly.

## Key Takeaways
By isolating our stateless UI layers from our analytical engines, we achieve:

- Near-Zero Hosting Costs: Running client distributions globally over free CDN edges.

- Hardened Security: Retaining stateful cookie boundaries while preventing manual script intervention or security leaks.

- Continuous Delivery: Automated pipeline testing maps, builds, and distributes downstream adjustments every single time code drops onto a tracked repository.