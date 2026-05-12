---
layout: post
title: "Building Sovereign Social Automation with Meta's System Users"
date: 2026-04-15
description: "A technical guide on bypassing session flakes using Meta System Users for multi-tenant SaaS."
tags: [saas, automation, api, meta]
categories: [engineering]
featured: true
---

## Building Sovereign Social Automation with Meta's System Users

After fighting with Meta's disappearing browser sessions and flaky personal account tokens, I successfully migrated the **Fluxo Social Engine** to a "Sovereign Infrastructure" model. 

If you are building a multi-tenant SaaS that needs to post to Instagram and Facebook on behalf of users, this is the blueprint you need.

## The Problem: Session Flakes
Standard User Access Tokens expire every 60 days and break if the user changes their password or security settings. For a SaaS like **Fluxo**, we need permanent, "headless" authority.

## The Solution: The System User "Triple-Link"
By using a **System User** (a non-human bot user within Business Manager), we achieve permanent stability.

### Phase 1: Internal Admin Setup
To set this up, you must establish three distinct links in the Meta Business Suite:

1.  **System User → Assets:** Create an Admin System User and assign it to your Facebook Page, Instagram Account, and Meta App with **Full Control**.
2.  **App → Assets:** Add your Meta App as a *Connected Asset* to the Facebook Page.
3.  **App → Use Cases:** In the Developer Portal, add the "Facebook Page" use case to unlock `pages_manage_posts`.

### Phase 2: The "Two-Key" Protocol
Facebook's Feed API is stricter than Instagram's. While IG accepts a System User token, the FB Feed requires a **Page Access Token**.

```bash
# Exchange System Token for Page Token
curl -X GET "[https://graph.facebook.com/v25.0/](https://graph.facebook.com/v25.0/){page_id}?fields=access_token&access_token={SYSTEM_TOKEN}"
```

Implementation Logic
Our marketingPy engine follows this asynchronous dispatch flow:

Fetch the ephemeral Page Token using the permanent System Token.

Post to Instagram: (2-step container process with a 45s sleep).

Post to Facebook Feed: Direct POST to /{page_id}/feed using the Page Token.

{% include figure.html path="assets/img/posts/social-flow.png" title="Automation Workflow" class="img-fluid rounded z-depth-1" %}

For Tenants (The Handshake)
When a new user joins the platform, they simply:

Link their IG Business account to their FB Page.

Accept our Tester Invite.

Confirm the connection in their Page Settings.

This creates a seamless "Sovereign" bridge where the user owns their data, and Fluxo provides the power.


### 3. Tips for al-folio Customization
* **Images:** If you have a diagram of your infrastructure, place it in `assets/img/posts/` and use the `{% raw %}{% include figure.html ... %}{% endraw %}` tag as shown above.
* **Math/Equations:** If you want to get fancy with the lead-scoring logic, al-folio supports MathJax. You can use $ $ for inline math.
* **Social Preview:** Since this template is built for researchers/developers, ensure your `description` in the Front Matter is punchy; it will show up on your "Projects" or "Blog" index page.

Would you like me to help you refine the **lead-scorer** section of this post to show off the logic behind *when* the bot decides to post?