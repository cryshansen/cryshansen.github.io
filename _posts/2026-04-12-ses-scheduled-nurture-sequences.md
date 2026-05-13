---
layout: post
title: "Scheduled Email Triggers & Nurture Sequence Architecture"
date: 2026-04-12 09:45:00 -0400
description: "How to design and implement a scheduled email trigger system and multi-step marketing nurture sequences using Spring Scheduler, conditional state evaluation, and AWS SES."
tags:
  - aws
  - ses
  - email
  - spring-boot
  - java
  - marketing
  - scheduling
  - nurture
categories:
  - engineering
  - marketing-tech
author: your_name
og_image: /assets/img/blog/ses-nurture.png
related_posts: true
toc:
  - name: Two Types of Email Triggers
  - name: Event-Driven Triggers
  - name: Scheduled Triggers with Spring
  - name: Designing a Nurture Sequence
  - name: Conditional State Evaluation
  - name: Suppression and Exit Conditions
  - name: Warming Up a New Sending Domain
  - name: Observability
---

> 📬 **Series: Email Infrastructure with AWS SES**
>
> 1. [Overview, SMTP Setup, DNS & Marketing]({% post_url 2026-04-12-aws-ses-email-setup %})
> 2. [Multi-Tenant FROM Address Resolution & Spring EmailService]({% post_url 2026-04-12-ses-multi-tenant-email-service %})
> 3. [SNS Bounce & Complaint Webhook Handling]({% post_url 2026-04-15-ses-bounce-complaint-handling %})
> 4. **You are here** — Scheduled Email Triggers & Nurture Sequence Architecture

---

Transactional emails respond to what users do. Marketing nurture emails respond to what users _haven't_ done yet — or guide them through a journey based on where they are in the funnel. This post covers designing the trigger system that powers both, with a particular focus on scheduled sends and the conditional logic that makes nurture sequences effective rather than just noisy.

---

## Two Types of Email Triggers

Every email your application sends originates from one of two trigger types:

**Event-driven triggers** fire immediately in response to a user action. They are synchronous from the application's perspective — the event happens, the email goes out:

| Trigger                  | Template               | Timing      |
| ------------------------ | ---------------------- | ----------- |
| Appointment booked       | `BOOKING_CONFIRMATION` | Immediately |
| User signs up            | `SIGNUP_VERIFY`        | Immediately |
| Password reset requested | `PASSWORD_RESET`       | Immediately |
| Payment received         | `PAYMENT_RECEIPT`      | Immediately |

**Scheduled triggers** run on a clock rather than a user event. They require a periodic job that evaluates which users meet a condition and sends accordingly:

| Trigger                 | Template               | Timing                    |
| ----------------------- | ---------------------- | ------------------------- |
| Appointment tomorrow    | `APPOINTMENT_REMINDER` | 24h before                |
| No-show detected        | `NO_SHOW_FOLLOWUP`     | 2h after missed appt      |
| Weekly report           | `WEEKLY_SUMMARY`       | Sunday 6 PM per tenant TZ |
| Inactive user (7 days)  | `REENGAGEMENT_D7`      | Day 7 of inactivity       |
| Inactive user (14 days) | `REENGAGEMENT_D14`     | Day 14 of inactivity      |

Both types flow through the same `EmailService` — the difference is only in what initiates the call.

---

## Event-Driven Triggers

The cleanest implementation is a Spring application event. The trigger publishes an event; a listener calls `EmailService`. This decouples business logic from email logic entirely:

```java
// In your booking service
@Service
@RequiredArgsConstructor
public class BookingService {

    private final ApplicationEventPublisher eventPublisher;

    public Booking createBooking(CreateBookingRequest request) {
        Booking booking = // ... persist booking
        eventPublisher.publishEvent(new BookingCreatedEvent(this, booking));
        return booking;
    }
}
```

```java
// In your email listener
@Component
@RequiredArgsConstructor
public class BookingEmailListener {

    private final EmailService emailService;

    @EventListener
    @Async
    public void onBookingCreated(BookingCreatedEvent event) {
        Booking booking = event.getBooking();
        emailService.sendEmail(EmailRequest.builder()
            .tenantId(booking.getTenantId())
            .recipientEmail(booking.getClientEmail())
            .templateType(EmailTemplateType.BOOKING_CONFIRMATION)
            .templateData(Map.of(
                "first_name", booking.getClientFirstName(),
                "booking_date", formatDate(booking.getStartTime()),
                "booking_time", formatTime(booking.getStartTime()),
                "business_name", booking.getTenantName()
            ))
            .build());
    }
}
```

Using `@Async` on the listener means the email send never blocks the booking transaction. The booking succeeds even if the email is delayed or temporarily fails.

---

## Scheduled Triggers with Spring

Spring's `@Scheduled` annotation handles periodic jobs. For email triggers, you typically run a job every few minutes that queries for records meeting a send condition:

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class AppointmentReminderScheduler {

    private final AppointmentRepository appointmentRepo;
    private final EmailService emailService;

    @Scheduled(cron = "0 */5 * * * *") // every 5 minutes
    public void sendAppointmentReminders() {
        LocalDateTime windowStart = LocalDateTime.now().plusHours(23).plusMinutes(55);
        LocalDateTime windowEnd   = LocalDateTime.now().plusHours(24).plusMinutes(5);

        List<Appointment> upcoming = appointmentRepo
            .findConfirmedInWindowNotYetNotified(windowStart, windowEnd);

        for (Appointment appt : upcoming) {
            try {
                emailService.sendEmail(buildReminderRequest(appt));
                appointmentRepo.markReminderSent(appt.getId());
            } catch (Exception e) {
                log.error("Failed to send reminder for appointment {}", appt.getId(), e);
                // Continue processing others — don't let one failure stop the batch
            }
        }
    }
}
```

### Idempotency Is Critical

The `markReminderSent` call is essential. Without it, every scheduler run will find the same upcoming appointments and send duplicate reminders. Use a boolean flag or timestamp column (`reminder_sent_at`) on the appointment record, and filter it in your query:

```sql
SELECT * FROM appointments
WHERE status = 'CONFIRMED'
  AND start_time BETWEEN :windowStart AND :windowEnd
  AND reminder_sent_at IS NULL
```

For distributed deployments (multiple instances), use a database-level advisory lock or a distributed lock (Redis `SETNX`) around the scheduler to prevent two instances from processing the same appointments simultaneously.

---

## Designing a Nurture Sequence

A nurture sequence is a series of emails sent to a contact over time, each contingent on the contact not having converted (or not having met some other exit condition). The architecture requires:

1. **Sequence definition** — what emails to send and when
2. **Enrollment** — adding a contact to a sequence when they meet a trigger condition
3. **Step processor** — a scheduled job that advances contacts through their sequences
4. **Exit evaluation** — checking whether a contact should stop receiving the sequence

### Sequence Definition

Define sequences in configuration or a database table:

```java
public enum NurtureSequence {
    POST_SIGNUP(List.of(
        new SequenceStep(Duration.ZERO,        EmailTemplateType.WELCOME),
        new SequenceStep(Duration.ofDays(2),   EmailTemplateType.GETTING_STARTED),
        new SequenceStep(Duration.ofDays(7),   EmailTemplateType.REENGAGEMENT_D7),
        new SequenceStep(Duration.ofDays(14),  EmailTemplateType.SOCIAL_PROOF),
        new SequenceStep(Duration.ofDays(21),  EmailTemplateType.OFFER)
    ));

    private final List<SequenceStep> steps;
}
```

### Enrollment Table

```sql
CREATE TABLE nurture_enrollments (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    contact_id      BIGINT NOT NULL,
    tenant_id       VARCHAR(100) NOT NULL,
    sequence        VARCHAR(100) NOT NULL,
    current_step    INT NOT NULL DEFAULT 0,
    enrolled_at     TIMESTAMP NOT NULL,
    next_send_at    TIMESTAMP NOT NULL,
    completed_at    TIMESTAMP,
    exited_at       TIMESTAMP,
    exit_reason     VARCHAR(100),
    INDEX idx_next_send (next_send_at, completed_at, exited_at)
);
```

### Step Processor

```java
@Scheduled(cron = "0 0 * * * *") // every hour
public void processNurtureSteps() {
    List<NurtureEnrollment> due = enrollmentRepo
        .findDueForSending(Instant.now());

    for (NurtureEnrollment enrollment : due) {
        try {
            processStep(enrollment);
        } catch (Exception e) {
            log.error("Failed nurture step for enrollment {}", enrollment.getId(), e);
        }
    }
}

private void processStep(NurtureEnrollment enrollment) {
    NurtureSequence sequence = NurtureSequence.valueOf(enrollment.getSequence());
    List<SequenceStep> steps = sequence.getSteps();
    int stepIndex = enrollment.getCurrentStep();

    if (stepIndex >= steps.size()) {
        enrollmentRepo.markCompleted(enrollment.getId());
        return;
    }

    // Evaluate exit conditions before sending
    if (shouldExit(enrollment)) {
        enrollmentRepo.markExited(enrollment.getId(), exitReason(enrollment));
        return;
    }

    SequenceStep step = steps.get(stepIndex);
    emailService.sendEmail(buildNurtureRequest(enrollment, step));

    // Advance to next step
    if (stepIndex + 1 < steps.size()) {
        Instant nextSend = Instant.now().plus(steps.get(stepIndex + 1).getDelay());
        enrollmentRepo.advanceStep(enrollment.getId(), stepIndex + 1, nextSend);
    } else {
        enrollmentRepo.markCompleted(enrollment.getId());
    }
}
```

---

## Conditional State Evaluation

The `shouldExit` check is what separates a smart nurture sequence from an email blast. Before sending each step, evaluate the contact's current state:

```java
private boolean shouldExit(NurtureEnrollment enrollment) {
    Contact contact = contactRepo.findById(enrollment.getContactId());

    // Exit if they've converted (booked an appointment)
    if (contact.getFirstBookingAt() != null) return true;

    // Exit if they've unsubscribed from marketing email
    if (!contact.isMarketingEmailOptIn()) return true;

    // Exit if address is suppressed (bounced or complained)
    if (suppressionRepo.isSuppressed(contact.getEmail())) return true;

    // Exit if they're already an active client (past the nurture stage)
    if (contact.getStatus() == ContactStatus.ACTIVE_CLIENT) return true;

    return false;
}
```

This ensures that a user who books an appointment on day 3 doesn't receive the day-7 "still interested?" re-engagement email. The sequence simply exits cleanly, and the booking confirmation flow takes over.

---

## Suppression and Exit Conditions

Beyond the per-contact state checks, apply these sequence-level rules:

**Unsubscribe handling:** Every marketing email must include an unsubscribe link. When a contact clicks it, set `marketing_email_opt_in = false` on their record. The `shouldExit` check above will catch this on the next step.

**Global suppression check:** Always cross-reference the suppression list (from [Part 3]({% post_url 2026-04-15-ses-bounce-complaint-handling %})) before sending any nurture step. An address that hard-bounced should never receive another email, regardless of sequence state.

**Frequency cap:** Avoid sending multiple emails on the same day from different sequences. A contact might be enrolled in a post-signup sequence and also receive an appointment reminder on the same day — implement a daily cap:

```java
private boolean exceedsDailyCap(Contact contact) {
    int sentToday = emailLogRepo.countSentToday(contact.getEmail());
    return sentToday >= maxEmailsPerDay; // e.g. 1 or 2
}
```

---

## Warming Up a New Sending Domain

If you're launching a new domain or IP address for marketing sends, **do not blast your full list immediately**. Inbox providers observe a new sender's volume and gradually extend trust. Ramping too quickly signals spam behavior.

A conservative warmup schedule:

| Week | Daily volume | Who to send to                           |
| ---- | ------------ | ---------------------------------------- |
| 1    | 50–200       | Most engaged (opened/clicked in 90 days) |
| 2    | 500–1,000    | Engaged (opened in 180 days)             |
| 3    | 2,000–5,000  | All opted-in contacts                    |
| 4+   | Full volume  | Maintain based on engagement             |

Wire the warmup schedule into your enrollment processor by adding a configurable volume cap that increases on a schedule. Store the current warmup phase in config or a feature flag that you advance manually (or automate based on elapsed days).

---

## Observability

Production nurture sequences need visibility into what's happening:

**Email send log table:** Record every email sent, with template type, tenant, recipient (hashed or pseudonymized for privacy), timestamp, and the enrollment/step that triggered it.

```sql
CREATE TABLE email_send_log (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id       VARCHAR(100),
    recipient_hash  VARCHAR(64),  -- SHA-256 of email
    template_type   VARCHAR(100),
    enrollment_id   BIGINT,
    step_index      INT,
    sent_at         TIMESTAMP,
    ses_message_id  VARCHAR(255)  -- for correlating with bounce/complaint events
);
```

Storing the SES `messageId` (returned from the send call) is particularly valuable: when a bounce notification arrives, it includes the original `messageId`, letting you trace exactly which send triggered the feedback.

**Metrics to track:**

- Emails sent per sequence per day
- Step completion rates (what % reach step 3 vs drop out at step 1)
- Exit reason distribution (converted vs unsubscribed vs bounced)
- Sequence-level conversion rate (enrolled → booked)

These metrics tell you not just whether your infrastructure is working, but whether your nurture content is actually moving people through the funnel.

---

## Wrapping Up the Series

This post completes the four-part series on building a production email infrastructure with AWS SES:

1. [Part 1: Overview, SMTP Setup, DNS & Marketing]({% post_url 2026-04-12-aws-ses-email-setup %}) — the foundations: SMTP config, SPF/DKIM/DMARC, and what the architecture looks like
2. [Part 2: Multi-Tenant FROM Address Resolution]({% post_url 2026-04-12-ses-multi-tenant-email-service %}) — the Spring `EmailService` and `TemplateRenderer` that power per-tenant sending
3. [Part 3: SNS Bounce & Complaint Webhook Handling]({% post_url 2026-04-15-ses-bounce-complaint-handling %}) — protecting your sending reputation with automated suppression
4. **Part 4 (this post)** — the scheduler and conditional logic that powers event-driven and nurture email

Together these four pieces give you an email system that's reliable, reputation-safe, multi-tenant-capable, and ready to power marketing at scale.
