---
layout: post
title: "Multi-Tenant FROM Address Resolution & Spring EmailService"
date: 2026-04-12 
description: "How to build a Spring @Service that resolves the correct sender address per tenant and renders per-tenant email templates from a database or file fallback."
tags: [ aws,ses, spring-boot, java, multi-tenant, email ]
categories: [engineering, backend]
author: your_name
og_image: /assets/img/blog/ses-multitenant.png
related_posts: true
toc:
  - name: The Problem with Hardcoded FROM Addresses
  - name: Tenant Identity Model
  - name: The EmailService Layer
  - name: Template Resolution Strategy
  - name: Wiring It Together with Spring
  - name: Testing Without Sending Real Emails
---

> 📬 **Series: Email Infrastructure with AWS SES**
>
> 1. [Overview, SMTP Setup, DNS & Marketing]({% post_url 2026-04-12-aws-ses-email-setup %})
> 2. **You are here** — Multi-Tenant FROM Address Resolution & Spring EmailService
> 3. [SNS Bounce & Complaint Webhook Handling]({% post_url 2026-04-15-ses-bounce-complaint-handling %})
> 4. [Scheduled Email Triggers & Nurture Sequence Architecture]({% post_url 2026-04-12-ses-scheduled-nurture-sequences %})

---

When a single application serves multiple tenants or brands, the question of _who is sending this email_ becomes surprisingly nuanced. A booking confirmation sent to a client should appear to come from the business they booked with — not a generic platform address. This post covers how to model that cleanly in Spring and wire it into AWS SES.

---

## The Problem with Hardcoded FROM Addresses

The naive approach hardcodes a FROM address in application config:

```properties
spring.mail.username=noreply@yourplatform.com
```

This works for a single-brand product but breaks immediately when you have multiple tenants, each with their own domain and identity. The client sees `noreply@yourplatform.com` instead of `hello@theirmastudio.com`, which damages trust and erodes brand integrity.

The fix is to make the FROM address a **runtime decision** based on which tenant is sending the email — resolved by the `EmailService`, not set statically in config.

---

## Tenant Identity Model

Before writing the service, define what a "tenant sending identity" looks like. At minimum, a tenant needs:

```java
public class TenantEmailIdentity {
    private String tenantId;
    private String fromAddress;      // e.g. hello@theirmastudio.com
    private String fromDisplayName;  // e.g. Their Ma Studio
    private String replyTo;          // optional override
}
```

Store this in your tenant settings table — or if you already have a tenant config table, add these columns to it. The `fromAddress` must be a **verified identity in SES** (either the full address or the domain it belongs to).

### Verifying Sending Identities in SES

Every FROM address or domain you send from must be verified:

- **Domain verification** (recommended): verify `theirmastudio.com` once and send from any address at that domain. Requires adding DKIM CNAME records per domain.
- **Email address verification**: verify `hello@theirmastudio.com` specifically. Simpler but requires verification per address.

For a multi-tenant platform where tenants bring their own domains, domain verification scales far better. Set up a workflow where new tenants are prompted to add DKIM records during onboarding and SES verification status is polled via the AWS SDK.

---

## The EmailService Layer

The `EmailService` is a Spring `@Service` that sits between your application triggers and SES. Its responsibilities are:

1. Accept an email request (recipient, template type, data payload)
2. Resolve the correct FROM identity for the current tenant
3. Delegate template rendering to `EmailTemplateRenderer`
4. Send via `JavaMailSender`

```java
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final EmailTemplateRenderer templateRenderer;
    private final TenantEmailIdentityRepository identityRepository;

    public void sendEmail(EmailRequest request) {
        // 1. Resolve tenant FROM identity
        TenantEmailIdentity identity = identityRepository
            .findByTenantId(request.getTenantId())
            .orElseThrow(() -> new EmailConfigurationException(
                "No email identity configured for tenant: " + request.getTenantId()
            ));

        // 2. Render template
        RenderedEmail rendered = templateRenderer.render(
            request.getTenantId(),
            request.getTemplateType(),
            request.getTemplateData()
        );

        // 3. Build and send message
        MimeMessage message = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(identity.getFromAddress(), identity.getFromDisplayName());
            helper.setTo(request.getRecipientEmail());
            helper.setSubject(rendered.getSubject());
            helper.setText(rendered.getHtmlBody(), true);

            if (StringUtils.hasText(identity.getReplyTo())) {
                helper.setReplyTo(identity.getReplyTo());
            }

            mailSender.send(message);
        } catch (MessagingException | UnsupportedEncodingException e) {
            throw new EmailSendException("Failed to send email to " + request.getRecipientEmail(), e);
        }
    }
}
```

### The EmailRequest Object

Keep the request object simple and immutable. Use a builder or record:

```java
public record EmailRequest(
    String tenantId,
    String recipientEmail,
    EmailTemplateType templateType,
    Map<String, String> templateData
) {}
```

`EmailTemplateType` is an enum of all known template types — `BOOKING_CONFIRMATION`, `SIGNUP_VERIFY`, `PASSWORD_RESET`, `WEEKLY_REPORT`, `NO_SHOW_REMINDER`, etc. This gives you compile-time safety and a single place to audit all template types in the system.

---

## Template Resolution Strategy

The `EmailTemplateRenderer` implements a two-tier fallback:

```
1. Check tenant_email_template_settings table (DB override)
   → If found: use subject + HTML from DB row
2. Fall back to file-based template
   → Load /email_templates/{templateType}.html from classpath
3. Run placeholder substitution on whichever was resolved
4. Return RenderedEmail { subject, htmlBody }
```

```java
@Service
@RequiredArgsConstructor
public class EmailTemplateRenderer {

    private final TenantTemplateSettingsRepository templateSettingsRepo;
    private final ResourceLoader resourceLoader;

    public RenderedEmail render(
            String tenantId,
            EmailTemplateType templateType,
            Map<String, String> data) {

        // Tier 1: check for tenant DB override
        Optional<TenantEmailTemplateSetting> override =
            templateSettingsRepo.findByTenantIdAndTemplateType(tenantId, templateType);

        String subject;
        String htmlBody;

        if (override.isPresent()) {
            subject = override.get().getSubject();
            htmlBody = override.get().getHtmlBody();
        } else {
            // Tier 2: load from classpath file
            String filename = templateType.name().toLowerCase().replace('_', '-') + ".html";
            Resource resource = resourceLoader.getResource(
                "classpath:email_templates/" + filename
            );
            try {
                htmlBody = resource.getContentAsString(StandardCharsets.UTF_8);
                subject = templateType.getDefaultSubject(); // defined on enum
            } catch (IOException e) {
                throw new TemplateNotFoundException("Missing email template: " + filename);
            }
        }

        // Placeholder substitution: [var_name] → runtime value
        for (Map.Entry<String, String> entry : data.entrySet()) {
            String placeholder = "[" + entry.getKey() + "]";
            subject = subject.replace(placeholder, entry.getValue());
            htmlBody = htmlBody.replace(placeholder, entry.getValue());
        }

        return new RenderedEmail(subject, htmlBody);
    }
}
```

### Placeholder Convention

Using `[var_name]` (square brackets) instead of `{{ var }}` or `${var}` keeps templates editable by non-developers in a simple HTML editor without risk of accidentally triggering Thymeleaf or Liquid syntax. Common placeholders across templates:

| Placeholder       | Example value   |
| ----------------- | --------------- |
| `[first_name]`    | Sarah           |
| `[booking_date]`  | Tuesday, May 13 |
| `[booking_time]`  | 2:00 PM         |
| `[business_name]` | Their Ma Studio |
| `[reset_link]`    | https://...     |

---

## Wiring It Together with Spring

Configure `JavaMailSender` using your SES SMTP credentials from environment variables:

```yaml
# application.yml
spring:
  mail:
    host: ${EMAIL_HOST:email-smtp.us-east-1.amazonaws.com}
    port: ${EMAIL_PORT:587}
    username: ${EMAIL_USERNAME}
    password: ${EMAIL_PASSWORD}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
            required: true
```

Note that `spring.mail.username` here is your **SES SMTP username**, not a FROM address. The FROM address is resolved at runtime by `EmailService` per tenant — it does not come from this config.

### Async Sending

For production, wrap email sends in `@Async` to prevent blocking the request thread:

```java
@Async("emailTaskExecutor")
public void sendEmail(EmailRequest request) {
    // ... same implementation
}
```

```java
@Bean("emailTaskExecutor")
public Executor emailTaskExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(2);
    executor.setMaxPoolSize(10);
    executor.setQueueCapacity(500);
    executor.setThreadNamePrefix("email-");
    executor.initialize();
    return executor;
}
```

---

## Testing Without Sending Real Emails

Never let integration tests hit SES. Use a test SMTP server locally:

**With MailHog (Docker):**

```bash
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

Then in `application-test.yml`:

```yaml
spring:
  mail:
    host: localhost
    port: 1025
```

MailHog catches all outgoing email and lets you inspect it at `http://localhost:8025` — including rendered HTML, headers, and FROM/TO resolution. It's indispensable for verifying that tenant identity resolution is working correctly before touching real SES.

---

## What's Next

With the `EmailService` and `TemplateRenderer` built, the next concern is **what happens when emails fail to deliver**. SES will notify you via SNS when emails bounce or recipients complain — and you must handle those events to protect your sending reputation.

- [Part 3: SNS Bounce & Complaint Webhook Handling]({% post_url 2026-04-15-ses-bounce-complaint-handling %})
- [Part 4: Scheduled Email Triggers & Nurture Sequence Architecture]({% post_url 2026-04-12-ses-scheduled-nurture-sequences %})
