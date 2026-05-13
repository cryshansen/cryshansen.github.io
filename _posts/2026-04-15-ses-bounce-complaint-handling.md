---
layout: post
title: "SNS Bounce & Complaint Webhook Handling with AWS SES"
date: 2026-04-15 09:30:00 -0400
description: "How to configure AWS SNS to receive SES bounce and complaint notifications, expose a webhook endpoint, and maintain a suppression list that protects your sending reputation."
tags:
  - aws
  - ses
  - sns
  - email
  - spring-boot
  - java
  - deliverability
categories:
  - engineering
  - infrastructure
author: your_name
og_image: /assets/img/blog/ses-sns-bounce.png
related_posts: true
toc:
  - name: Why Bounce Handling Is Non-Negotiable
  - name: SES Feedback Notifications Overview
  - name: Setting Up the SNS Topic
  - name: The Webhook Endpoint
  - name: Processing Bounce and Complaint Events
  - name: Suppression List Management
  - name: Monitoring Your Sending Reputation
---

> 📬 **Series: Email Infrastructure with AWS SES**
>
> 1. [Overview, SMTP Setup, DNS & Marketing]({% post_url 2026-04-12-aws-ses-email-setup %})
> 2. [Multi-Tenant FROM Address Resolution & Spring EmailService]({% post_url 2026-04-12-ses-multi-tenant-email-service %})
> 3. **You are here** — SNS Bounce & Complaint Webhook Handling
> 4. [Scheduled Email Triggers & Nurture Sequence Architecture]({% post_url 2026-04-12-ses-scheduled-nurture-sequences %})

---

Sending an email is only half the job. When that email bounces, or the recipient marks it as spam, AWS SES knows about it — but your application doesn't unless you wire up notifications. This post covers building the full feedback loop: SNS topic configuration, a webhook endpoint that receives and validates notifications, and the suppression list that keeps your reputation clean.

---

## Why Bounce Handling Is Non-Negotiable

AWS SES monitors two metrics that directly affect your ability to send:

- **Bounce rate:** If this exceeds **5%**, SES will pause sending on your account. Above 10% risks permanent suspension.
- **Complaint rate:** If this exceeds **0.1%** (one complaint per thousand sends), you'll see degraded deliverability. Above 0.5% triggers review.

These aren't arbitrary thresholds — they reflect what major inbox providers (Gmail, Outlook) use to decide whether to accept your mail at all. If you ignore bounces and keep sending to invalid addresses, you're not just risking your SES account; you're damaging the domain reputation that your DNS records (SPF, DKIM, DMARC) took time to build.

The fix is simple in principle: **when SES tells you an address bounced or complained, never send to it again.** The implementation is a webhook endpoint, a suppression table, and a pre-send check.

---

## SES Feedback Notifications Overview

SES delivers feedback through **Amazon SNS (Simple Notification Service)**. The flow is:

```
SES sends email
  → Delivery fails (bounce) or recipient reports spam (complaint)
    → SES publishes notification to SNS topic
      → SNS delivers to your webhook endpoint (HTTP/S subscription)
        → Your app processes event and updates suppression list
```

There are three notification types:

- **Bounce** — the email could not be delivered. Two subtypes: _hard_ (permanent, e.g. address doesn't exist) and _soft_ (temporary, e.g. mailbox full).
- **Complaint** — the recipient marked the email as spam via their inbox client.
- **Delivery** — optional confirmation that the email was successfully delivered (useful for audit logs, not required for reputation management).

Hard bounces and complaints must result in permanent suppression. Soft bounces can be retried with a backoff strategy, but after repeated soft bounces on the same address, suppress it as well.

---

## Setting Up the SNS Topic

**Step 1: Create an SNS topic**

In the AWS Console, go to **SNS → Topics → Create topic**. Choose `Standard` type. Name it something like `ses-feedback-notifications`.

**Step 2: Subscribe your endpoint**

Add an HTTPS subscription pointing to your application's webhook URL:

```
Protocol: HTTPS
Endpoint: https://yourdomain.com/webhooks/ses-feedback
```

AWS will send a confirmation request to your endpoint — your handler must respond by fetching the `SubscribeURL` in the payload. (See the webhook implementation below.)

**Step 3: Connect the topic to SES**

In **SES → Verified Identities → your domain → Notifications**:

- Set **Bounces** → your SNS topic
- Set **Complaints** → your SNS topic
- Optionally set **Deliveries** → your SNS topic

Check **"Include original headers"** — this makes it easier to correlate notifications back to specific sends in your logs.

---

## The Webhook Endpoint

SNS delivers notifications as HTTP POST requests with a `Content-Type: text/plain` body that contains a JSON payload. There are two categories of request to handle:

1. **SubscriptionConfirmation** — sent once when you add the HTTPS subscription; you must fetch the `SubscribeURL` to activate
2. **Notification** — the actual bounce or complaint event

```java
@RestController
@RequestMapping("/webhooks")
@RequiredArgsConstructor
@Slf4j
public class SesFeedbackWebhookController {

    private final SesFeedbackProcessor feedbackProcessor;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @PostMapping(value = "/ses-feedback", consumes = "text/plain")
    public ResponseEntity<Void> handleSesNotification(@RequestBody String rawBody) {
        try {
            JsonNode root = objectMapper.readTree(rawBody);
            String messageType = root.path("Type").asText();

            switch (messageType) {
                case "SubscriptionConfirmation" -> {
                    // Auto-confirm the SNS subscription
                    String subscribeUrl = root.path("SubscribeURL").asText();
                    restTemplate.getForObject(subscribeUrl, String.class);
                    log.info("Confirmed SNS subscription for SES feedback");
                }
                case "Notification" -> {
                    String message = root.path("Message").asText();
                    feedbackProcessor.process(objectMapper.readTree(message));
                }
                default -> log.warn("Unhandled SNS message type: {}", messageType);
            }

            return ResponseEntity.ok().build();

        } catch (Exception e) {
            log.error("Failed to process SNS notification", e);
            // Return 200 anyway to prevent SNS from retrying a malformed payload
            return ResponseEntity.ok().build();
        }
    }
}
```

> **Always return HTTP 200** from your webhook, even on processing errors. If you return a 4xx or 5xx, SNS will retry delivery — which for malformed payloads just creates noise. Log the error and return 200; let your monitoring catch the anomaly.

### Validating SNS Message Signatures

In production, you should validate that the notification genuinely came from AWS. SNS signs each message and includes the signature in the payload. The AWS Java SDK provides `SnsMessageManager` for this:

```java
SnsMessageManager manager = new SnsMessageManager("us-east-1");
manager.parseMessage(rawBody.getBytes()); // throws if signature invalid
```

Add this before processing any payload in a security-conscious environment.

---

## Processing Bounce and Complaint Events

The `Message` field inside a Notification contains the actual SES feedback JSON. Its structure depends on the notification type.

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class SesFeedbackProcessor {

    private final EmailSuppressionRepository suppressionRepo;

    public void process(JsonNode message) {
        String notificationType = message.path("notificationType").asText();

        switch (notificationType) {
            case "Bounce" -> processBounce(message);
            case "Complaint" -> processComplaint(message);
            case "Delivery" -> log.debug("Delivery confirmed for message: {}",
                message.path("mail").path("messageId").asText());
            default -> log.warn("Unknown SES notification type: {}", notificationType);
        }
    }

    private void processBounce(JsonNode message) {
        String bounceType = message.path("bounce").path("bounceType").asText();
        JsonNode recipients = message.path("bounce").path("bouncedRecipients");

        boolean isPermanent = "Permanent".equals(bounceType);

        for (JsonNode recipient : recipients) {
            String email = recipient.path("emailAddress").asText();
            String diagnosticCode = recipient.path("diagnosticCode").asText();

            log.warn("Bounce [{}] for address: {} — {}", bounceType, email, diagnosticCode);

            if (isPermanent) {
                suppressionRepo.upsert(EmailSuppression.builder()
                    .email(email)
                    .reason(SuppressionReason.HARD_BOUNCE)
                    .diagnosticCode(diagnosticCode)
                    .suppressedAt(Instant.now())
                    .build());
            } else {
                // Soft bounce — record it; suppress after threshold
                suppressionRepo.recordSoftBounce(email);
            }
        }
    }

    private void processComplaint(JsonNode message) {
        JsonNode recipients = message.path("complaint").path("complainedRecipients");
        String feedbackType = message.path("complaint")
            .path("complaintFeedbackType").asText();

        for (JsonNode recipient : recipients) {
            String email = recipient.path("emailAddress").asText();

            log.warn("Complaint [{}] from address: {}", feedbackType, email);

            suppressionRepo.upsert(EmailSuppression.builder()
                .email(email)
                .reason(SuppressionReason.COMPLAINT)
                .suppressedAt(Instant.now())
                .build());
        }
    }
}
```

---

## Suppression List Management

The suppression list is a simple table that stores addresses that must not receive email:

```sql
CREATE TABLE email_suppression (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(255) NOT NULL,
    reason        ENUM('HARD_BOUNCE', 'SOFT_BOUNCE', 'COMPLAINT', 'MANUAL') NOT NULL,
    diagnostic    TEXT,
    soft_bounce_count INT DEFAULT 0,
    suppressed_at TIMESTAMP NOT NULL,
    UNIQUE KEY uq_email (email)
);
```

### Pre-Send Check in EmailService

Before every send, check the suppression list:

```java
public void sendEmail(EmailRequest request) {
    // Guard: never send to suppressed addresses
    if (suppressionRepo.isSuppressed(request.getRecipientEmail())) {
        log.info("Skipping suppressed address: {}", request.getRecipientEmail());
        return;
    }

    // ... rest of send logic
}
```

This should be a fast indexed lookup — put an index on the `email` column and keep it in memory if your list is large enough to warrant it.

### Soft Bounce Threshold

Track soft bounces and auto-suppress after a configurable number of failures:

```java
public void recordSoftBounce(String email) {
    EmailSuppression existing = findByEmail(email);
    int newCount = (existing != null ? existing.getSoftBounceCount() : 0) + 1;

    if (newCount >= softBounceThreshold) { // configurable, e.g. 3
        upsert(EmailSuppression.builder()
            .email(email)
            .reason(SuppressionReason.SOFT_BOUNCE)
            .softBounceCount(newCount)
            .suppressedAt(Instant.now())
            .build());
    } else {
        updateSoftBounceCount(email, newCount);
    }
}
```

---

## Monitoring Your Sending Reputation

Beyond suppression, set up visibility into your sending health:

**SES Account Dashboard** — In the AWS Console under SES, the account overview shows your current bounce and complaint rates. Check this weekly when you're ramping up volume.

**CloudWatch Alarms** — SES publishes metrics to CloudWatch. Create alarms for:

- `Reputation.BounceRate` > 3% → SNS alert
- `Reputation.ComplaintRate` > 0.08% → SNS alert

These give you early warning before you approach the thresholds that trigger SES action.

**Postmaster Tools** — Both [Gmail Postmaster Tools](https://postmaster.google.com) and [Microsoft SNDS](https://sendersupport.olc.protection.outlook.com/snds/) offer domain-level reputation dashboards that show how the inbox providers themselves perceive your sending. These are free and worth setting up once you're sending meaningful volume.

---

## What's Next

With bounce and complaint handling in place, your sending infrastructure is now self-protecting. The final piece is building the **scheduled trigger and nurture sequence system** that drives your marketing engine:

- [Part 4: Scheduled Email Triggers & Nurture Sequence Architecture]({% post_url 2026-04-12-ses-scheduled-nurture-sequences %})
- [Back to Part 1: Overview & DNS Setup]({% post_url 2026-04-12-aws-ses-email-setup %})
