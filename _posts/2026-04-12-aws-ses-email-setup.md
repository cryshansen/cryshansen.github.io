---
layout: post
title: "Setting Up Transactional & Marketing Email with AWS SES"
date: 2026-05-12 09:00:00 -0400
description: "A developer's guide to configuring AWS SES for transactional email, DNS authentication, multi-tenant templates, and marketing nurture sequences."
tags:
  - aws
  - ses
  - email
  - devops
  - smtp
  - spring-boot
categories:
  - engineering
  - infrastructure
author: your_name
og_image: /assets/img/blog/ses-overview.png
related_posts: true
toc:
  - name: Why AWS SES
  - name: Understanding the Email Architecture
  - name: SMTP Configuration
  - name: DNS Configuration
  - name: Building a Template Engine
  - name: SES as a Marketing Nurture Engine
  - name: Production Readiness Checklist
---

Whether you're building a booking platform, SaaS product, or any web application that needs to send emails at scale, AWS Simple Email Service (SES) is one of the most cost-effective and reliable choices available. But getting it right — especially when email deliverability and marketing effectiveness are on the line — requires more than just plugging in SMTP credentials.

This post is the **first in a four-part series**:

> 📬 **Series: Email Infrastructure with AWS SES**
>
> 1. **You are here** — Overview, SMTP setup, DNS, templates, and marketing
> 2. [Multi-Tenant FROM Address Resolution & Spring EmailService]({% post_url 2026-04-12-ses-multi-tenant-email-service %})
> 3. [SNS Bounce & Complaint Webhook Handling]({% post_url 2026-04-15-ses-bounce-complaint-handling %})
> 4. [Scheduled Email Triggers & Nurture Sequence Architecture]({% post_url 2026-04-12-ses-scheduled-nurture-sequences %})

---

## Why AWS SES?

AWS SES gives you high-volume sending at a fraction of the cost of services like SendGrid or Mailgun, with deep integration into the AWS ecosystem. It supports both transactional email (booking confirmations, password resets, reports) and marketing campaigns through the same infrastructure.

The tradeoff is that SES requires more setup upfront — particularly around DNS and identity verification — but done right, it delivers exceptional inbox placement rates.

---

## Understanding the Email Architecture

A well-designed email system separates concerns cleanly. At a high level, you need:

- **Triggers** — the events in your application that initiate an email
- **An Email Service layer** — a centralized service class that orchestrates sending
- **A Template Renderer** — resolves the correct email content per tenant or context
- **SES as the delivery layer** — the SMTP or API endpoint that sends the message

```
[App Triggers] → [EmailService] → [TemplateRenderer] → [AWS SES] → [Client Inbox]
```

This separation matters because it keeps your sending logic, template logic, and delivery mechanism independent. When you need to swap a template, update a subject line per tenant, or change your sending domain, none of those changes bleed into each other.

### Trigger Types to Plan For

Before writing a single line of code, map out your email triggers. They fall into two categories:

**Event-driven triggers** fire immediately in response to user action:
- User signup and email verification
- Appointment or booking confirmation
- Password reset request
- Payment receipt

**Scheduled triggers** run on a timer regardless of user action:
- Weekly or monthly summary reports
- No-show reminders
- Re-engagement nudges for inactive users

> For a deep dive into the scheduled trigger architecture and nurture sequence design, see [Part 4: Scheduled Email Triggers & Nurture Sequence Architecture]({% post_url 2026-04-12-ses-scheduled-nurture-sequences %}).

---

## SMTP Configuration: The Basics

AWS SES supports both an HTTP API and SMTP. For most Java/Spring applications already using `JavaMailSender` or a similar abstraction, SMTP is the simpler integration path.

**The correct SMTP settings for SES:**

```
Host:       email-smtp.us-east-1.amazonaws.com
Port:       587
Encryption: STARTTLS (not SSL)
```

Use **port 587 with STARTTLS** — not 465. Port 465 is a legacy SSL port that AWS does support, but 587/STARTTLS is the modern standard and more broadly compatible across mail clients and firewalls.

### A Critical Note on Regions

SES is not available in every AWS region. The primary supported regions are `us-east-1` (N. Virginia), `us-west-2` (Oregon), and `eu-west-1` (Ireland). If your EC2 is in a region like `us-east-2` (Ohio), **you can still use SES** — just point your SMTP host explicitly at a supported region's endpoint. Your compute and your email service do not need to share a region.

### SMTP Credentials Are Not IAM Credentials

Your SES SMTP username and password are **not** your AWS Access Key ID and Secret. You generate them specifically inside the SES console:

1. Navigate to **SES → SMTP Settings → Create SMTP Credentials**
2. AWS creates a dedicated IAM user with `AmazonSesSendingAccess`
3. Store the SMTP username and password securely in environment variables

```dotenv
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USERNAME=YOUR_SES_SMTP_USERNAME
EMAIL_PASSWORD=YOUR_SES_SMTP_PASSWORD
```

---

## DNS Configuration: The Foundation of Deliverability

This is where most developers underinvest, and it's the single biggest factor in whether your emails land in the inbox or spam. Three DNS records matter: **SPF**, **DKIM**, and **DMARC**.

### SPF — Sender Policy Framework

SPF tells receiving mail servers which IP addresses are authorized to send email on behalf of your domain. Without it, spam filters will treat your legitimate emails with suspicion.

```
Type:  TXT
Name:  @
Value: v=spf1 include:amazonses.com ~all
```

**Common mistake:** If you use multiple services (SES for transactional, Mailchimp for newsletters), you need to include all of them in one SPF record. SPF only allows one TXT record per domain — multiple records will break it.

### DKIM — DomainKeys Identified Mail

DKIM adds a cryptographic signature to every email your server sends. For SES, AWS generates the key pair for you:

1. Go to **SES → Verified Identities → your domain**
2. AWS provides three CNAME records to add to your DNS
3. Once propagated, SES automatically signs every outgoing email

```
Type:  CNAME
Name:  [selector1]._domainkey.yourdomain.com
Value: [selector1].dkim.amazonses.com
```

Repeat for all three records AWS provides. **DKIM is non-negotiable for marketing volume** — without it, bulk sends are far more likely to be filtered.

### DMARC — Domain-based Message Authentication

DMARC builds on SPF and DKIM, telling receiving servers what to do when a message fails authentication checks.

```
Type:  TXT
Name:  _dmarc.yourdomain.com
Value: v=DMARC1; p=none; rua=mailto:dmarc-reports@yourdomain.com
```

Start with `p=none` (monitor only), then graduate to `p=quarantine` or `p=reject` once you're confident in your sending patterns.

### DNS Propagation Checklist

- [ ] SPF `TXT` record at domain root includes `amazonses.com`
- [ ] All three DKIM `CNAME` records added and verified in SES console
- [ ] DMARC `TXT` record at `_dmarc.yourdomain.com`
- [ ] Domain shows as **Verified** in SES Verified Identities

Tools like [MXToolbox](https://mxtoolbox.com) and [mail-tester.com](https://www.mail-tester.com) let you validate all three without sending a real email.

---

## Building a Template Engine

If your application supports multiple brands or tenants, you need a template resolution strategy that's flexible and maintainable. A practical two-tier approach:

1. **Database overrides** — per-tenant subject lines and HTML bodies stored in a `email_template_settings` table
2. **File-based fallbacks** — well-designed default HTML templates on disk

```
TemplateRenderer.resolve(tenantId, templateType)
  → Check tenant_email_template_settings table
  → If found: use subject + HTML from DB
  → If not: load from /email_templates/{templateType}.html
  → Replace [placeholder_vars] with runtime values
  → Return HTML string to EmailService
```

> For the full Spring `@Service` implementation including tenant FROM address resolution, see [Part 2: Multi-Tenant FROM Address Resolution]({% post_url 2026-04-12-ses-multi-tenant-email-service %}).

---

## SES as a Marketing Nurture Engine

Where SES becomes genuinely powerful for growth is as the backbone of a **marketing nurture engine** — automated sequences that guide leads from first contact to conversion.

**Key considerations for marketing volume:**

- **Sandbox mode:** New SES accounts can only send to verified addresses. Request production access before any real marketing sends.
- **Bounce and complaint handling:** You must suppress bounced addresses and honor unsubscribes — or AWS will throttle and eventually suspend your sending.
- **Dedicated IPs:** For high-volume senders, dedicated IPs let you build and control your own sending reputation independently of other SES users.
- **Warmup strategy:** Never blast your full list from a fresh domain. Start at 50–200 emails/day to your most engaged users and scale up over 3–4 weeks.

> For SNS bounce/complaint webhook setup and suppression list management, see [Part 3: SNS Bounce & Complaint Webhook Handling]({% post_url 2026-04-15-ses-bounce-complaint-handling %}).

---

## Production Readiness Checklist

- [ ] SES account out of sandbox (production access approved)
- [ ] SPF, DKIM, and DMARC DNS records verified
- [ ] SMTP credentials stored in environment variables, not in code
- [ ] SNS topic configured to receive SES bounce and complaint notifications
- [ ] Bounce and unsubscribe handling implemented
- [ ] Outbound port 587 open in EC2 security group egress rules
- [ ] SMTP connectivity tested from inside the production container
- [ ] At least one sending identity (domain or email) verified in SES console
- [ ] Email templates tested across Gmail, Outlook, and Apple Mail

---

## What's Next

This overview covers the foundations. The three follow-up posts go deep on the implementation details:

- [Part 2: Multi-Tenant FROM Address Resolution & Spring EmailService]({% post_url 2026-05-12-ses-multi-tenant-email-service %}) — how to resolve the correct sender address per tenant and wire up the Spring service layer
- [Part 3: SNS Bounce & Complaint Webhook Handling]({% post_url 2026-05-12-ses-bounce-complaint-handling %}) — protecting your sending reputation with automated suppression
- [Part 4: Scheduled Email Triggers & Nurture Sequence Architecture]({% post_url 2026-05-12-ses-scheduled-nurture-sequences %}) — building the scheduler and conditional logic that powers marketing nurture
