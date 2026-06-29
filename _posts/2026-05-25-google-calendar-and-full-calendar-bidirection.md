---
layout: post
title: "Google Calendar API Bidirectionally with Full Calendar in a Multi-Tenant Booking Engines"
date: 2026-05-25
categories: backend architecture
tags: [google-api, oauth2, java, spring-boot, security]
giscus_comments: true
related_posts: false
---

# Setting Up Google Calendar API Bidirectionally with Full Calendar in a Multi-Tenant Booking Engines

This article is the third in a three-part series on building architectural booking syncs:

1. [Part 1: Google Cloud Infrastructure & OAuth Configuration]({% post_url 2026-05-23-setting-up-google-calendar-api-oauth2-for-multi-tenant booking-engines %})
2. [Part 2: Managing Tenant Isolation & Shared Team Calendars]({% post_url 2026-05-24-restrict-multi-tenant-bookings-and-google-accounts %})
3. [Part 3: Bidirectional Client Syncing with FullCalendar & Java] (This Post)

When connecting Google Calendar API to a client-side interface like FullCalendar via a Java backend (Spring Boot, etc.) for a read/write bidirectional sync, choosing the right scope depends on your application's architecture.For creating, reading, updating, and deleting events without over-provisioning your permissions, use the following guidelines:

## The Recommended Scope

```Plaintext
 https://www.googleapis.com/auth/calendar.events
```

### Why this is the best choice:

- Capabilities: It grants full read/write permission to all events on all calendars the authenticated user has write-access to. This means your Java backend can run events.insert(), events.update(), events.patch(), and events.delete().
- Security Principle of Least Privilege: It stops short of giving your app global control over the user's entire calendar account. For instance, your backend cannot delete entire secondary calendars, clear a calendar completely, or alter global sharing permissions (ACLs).
- User Friction: When your users go through the OAuth consent screen, they see a warning explicitly limited to "View and edit events on all your calendars" rather than the much more alarming "See, edit, share, and permanently delete all the calendars you can access".

### When to use Alternate Scopes

Depending on your microservice architecture, you might need to lean narrower or broader.

| Scope String | Use Case for FullCalendar + Java | Data Access Level |
| .../auth/calendar.events.readonly | Read-Only Feed: If your FullCalendar implementation only displays a read-only dashboard of a doctor's or practitioner's availability and doesn't allow adding or updating events.| Sensitive |
|.../auth/calendar.events | Standard Read/Write (Best Choice): Perfect for two-way sync. Moving an event in FullCalendar fires an update to Java, which calls events.patch() on Google. Creating a booking inside your app inserts an event onto Google Calendar. | Sensitive |
|.../auth/calendar | Full Management: Only use this if your multi-tenant engine needs to programmatically create entirely new secondary calendars for a specific team or workspace inside the tenant's account, or modify calendar colors/metadata.| Restricted (Requires heavy verification)|

## Implementation in Java

If you are using the official Google APIs Client Library for Java (google-api-services-calendar), do not hardcode the string. Use the native SDK constants provided inside the library to eliminate typos:

```Java
import com.google.api.services.calendar.CalendarScopes;
import java.util.Collections;
import java.util.List;

public class GoogleCalendarConfig {
    // This resolves directly to: "https://www.googleapis.com/auth/calendar.events"
    private static final List<String> SCOPES =
        Collections.singletonList(CalendarScopes.CALENDAR_EVENTS);
}
```

## Architecture Pro-Tip for FullCalendar Bidirectional Sync

When connecting FullCalendar to Google Calendar through Java, avoid matching your primary database keys directly with random string increments.

When calling Google's events.insert(), generate a custom string ID in Java (or use your internal event table's UUID stripped of hyphens) and assign it to the Google Event object via .setId(). This creates a clean 1:1 immutable binding between your local database entity, FullCalendar's internal id property, and Google Calendar. When a user drags and drops a block on the UI, your React/Vue frontend can immediately send that ID down to Java to execute a fast target update.

## Conclusion

This setup allows your app to
2026-05-24-restrict-multi-tenant-bookings-and-google-accounts
