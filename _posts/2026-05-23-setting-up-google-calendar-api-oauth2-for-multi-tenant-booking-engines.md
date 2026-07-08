---
layout: post
title: "Setting Up Google Calendar API & OAuth 2.0 for Multi-Tenant Booking Engines"
date: 2026-05-23
categories: backend architecture
tags: [google-api, oauth2, java, spring-boot, security, multi-tenant]
giscus_comments: true
related_posts: false
---

# Setting Up Google Calendar API & OAuth 2.0 for Multi-Tenant Booking Engines

This guide covers the end-to-end configuration within the Google Cloud Console, detailing how to establish scopes, structure redirect patterns, and configure things cleanly so your Java backend can securely obtain refresh tokens.

This article is the first in a three-part series on building architectural booking syncs:

1. **Part 1: Google Cloud Infrastructure & OAuth Configuration** (This Post)
2. [Part 2: Managing Tenant Isolation & Shared Team Calendars]({% post_url 2026-05-24-restrict-multi-tenant-bookings-and-google-accounts %})
3. [Part 3: Bidirectional Client Syncing with FullCalendar & Java]({% post_url 2026-05-25-google-calendar-and-full-calendar-bidirection %})

When building a multi-tenant booking or scheduling engine, syncing appointments directly to a provider's personal calendar is a core requirement. Relying on simple service accounts won't cut it here—service accounts are designed for accessing resources owned by your application, not your end-users. For private data, you need explicit user delegation via **OAuth 2.0**.

This guide covers the end-to-end configuration within the Google Cloud Console, detailing how to establish scopes, structure redirect patterns, and configure things cleanly so your Java backend can securely obtain and rotate refresh tokens.

---

## 1. The OAuth 2.0 Architecture

Before clicking through consoles, let’s look at how the token exchange flow operates between your client frontend, your Java backend, and Google's authorization servers.

+------------+ Authorization Request +-----------------+
| | --------------------------------------> | |
| | | Google OAuth |
| End-User | <-------------------------------------- | Server |
| (Browser) | User Grants Consent | |
| | +-----------------+
| | |
| | ----------------------------\ | Auth Code
+------------+ Redirects with Auth Code \ v
--------> +-----------------+
| |
| Java Backend |
| (Spring Boot) |
| |
+-----------------+
|
Exchange Code |
& Client Secret v
+-----------------+
| |
| Google Token |
| Server |
| |
+-----------------+

---

## 2. Google Cloud Project Setup

To start interacting with Google Workspace APIs, you need an active Google Cloud Platform (GCP) project.

### Step 1: Enable the Calendar API

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one from the top project dropdown.
3. In the left navigation sidebar, navigate to **APIs & Services** > **Library**.
4. Search for `Google Calendar API` and select it.
5. Click **Enable**.

---

## 3. Configuring the OAuth Consent Screen

Google requires an explicit consent screen setup before you can issue OAuth client credentials. This screen defines what the user sees when your application requests access to their account.

### Step 1: App Branding & Audience

1. Navigate to **APIs & Services** > **OAuth consent screen** (or **Google Auth platform** > **Branding** in newer console interfaces).
2. Choose your **User Type**:
   - **Internal:** Restricts access strictly to users within your own Google Workspace organization.
   - **External:** Essential if your multi-tenant app handles external clients, contractors, or independent practitioners.
3. Click **Create**.
4. Fill in the required **App information**:
   - **App name:** The name displayed to users during authorization.
   - **User support email:** For user inquiries regarding consent.
   - **Developer contact information:** Emails for Google system alerts.

### Step 2: Define Data Access Scopes

Scopes define the specific permissions your application is requesting. For a deep calendar booking integration, avoid requesting broad read/write access to the user's entire drive or profile if you don't need it.

1. In the **Data Access** / **Scopes** section, click **Add or Remove Scopes**.
2. Filter or search for the Calendar API and explicitly add the following scope:

```text
[https://www.googleapis.com/auth/calendar.events](https://www.googleapis.com/auth/calendar.events)

```

⚠️ Scope Granularity: The .../auth/calendar.events scope allows your app to read and write events on the user's calendars. If your backend only needs to create and modify bookings but shouldn't manage secondary calendars or change global calendar settings, this is preferred over the wider .../auth/calendar scope.Step 3: Add Test UsersIf your publishing status is set to Testing (unverified), Google blocks access to all accounts except those explicitly whitelisted here.Under Audience > Test users, click Add Users.Enter the Gmail or Google Workspace email addresses you plan to use for local development and testing.

## 4. Creating OAuth 2.0 Web Client Credentials

With the consent screen established, you can now generate the credentials that identify your Java server application to Google.

<div class="mb-5 position-relative">
  <div class="position-absolute d-flex align-items-center justify-content-center text-white font-weight-bold" 
       style="left: -42px; top: 0; width: 24px; height: 24px; background-color: var(--global-theme-color, #4a4a4a); border-radius: 50%; font-size: 11pt; box-shadow: 0 0 0 4px var(--global-bg-color, #fff);">
    1
  </div>
  <h5 class="font-weight-bold mb-1" style="color: var(--global-text-color);">
    Select Client Type <span class="text-muted font-weight-light" style="font-size: 10pt; margin-left: 8px;">— Credentials Management</span>
  </h5>
  <p class="text-justify" style="font-size: 10.5pt; color: var(--global-text-color);">
    Go to <strong>APIs & Services &gt; Credentials</strong>. Click <strong>+ Create Credentials</strong> at the top of the interface and select <strong>OAuth client ID</strong>. From the dropdown menu, choose <strong>Web application</strong> as your application type.
  </p>
</div>

<div class="mb-5 position-relative">
  <div class="position-absolute d-flex align-items-center justify-content-center text-white font-weight-bold" 
       style="left: -42px; top: 0; width: 24px; height: 24px; background-color: var(--global-theme-color, #4a4a4a); border-radius: 50%; font-size: 11pt; box-shadow: 0 0 0 4px var(--global-bg-color, #fff);">
    2
  </div>
  <h5 class="font-weight-bold mb-1" style="color: var(--global-text-color);">
    Configure Authorized Origins <span class="text-muted font-weight-light" style="font-size: 10pt; margin-left: 8px;">— Security Restraints</span>
  </h5>
  <p class="text-justify" style="font-size: 10.5pt; color: var(--global-text-color);">
    Under the <strong>Authorized JavaScript origins</strong> section, add the base origin URL of your client-side application. For local development environments, add <code>http://localhost:3000</code>. For production, add your top-level domain name.
  </p>
</div>

<div class="mb-2 position-relative">
  <div class="position-absolute d-flex align-items-center justify-content-center text-white font-weight-bold" 
       style="left: -42px; top: 0; width: 24px; height: 24px; background-color: var(--global-theme-color, #4a4a4a); border-radius: 50%; font-size: 11pt; box-shadow: 0 0 0 4px var(--global-bg-color, #fff);">
    3
  </div>
  <h5 class="font-weight-bold mb-1" style="color: var(--global-text-color);">
    Set Redirect URIs <span class="text-muted font-weight-light" style="font-size: 10pt; margin-left: 8px;">— Callback Endpoint</span>
  </h5>
  <p class="text-justify" style="font-size: 10.5pt; color: var(--global-text-color);">
    Under <strong>Authorized redirect URIs</strong>, explicitly declare the absolute routing endpoint exposed by your Java backend that handles incoming authorization codes. For example:
  </p>
  <div class="card p-2 bg-light border-0" style="font-family: monospace; font-size: 10pt; color: #d63384; border-left: 4px solid var(--global-theme-color) !important;">
    http://localhost:8080/api/v1/oauth2/callback/google
  </div>
</div>

---

## 5. Backend Parameters for Token Long-Term Retention

When routing your user to Google's authorization endpoint from your Java application (or when constructing the authorization URL using tools like the google-api-client or Spring Security OAuth2), you must pass two specific parameters to guarantee a long-term architecture works.By default, Google only returns an access token that expires in one hour. To get a permanent key (a refresh token) to update calendars while the user is offline, construct your request parameters like this:

Parameter Key Required Value Purpose
access_typeoffline Explicitly tells Google your backend needs to execute tasks when the user is not actively interacting with the browser. Crucial for receiving a refresh token.

prompt consent Forces the consent screen to show up again even if the user has already approved your application. Google only sends the refresh_token on the very first authorization unless this parameter forces it.

### Handling Token Expiry in Java

Once your callback receives the auth_code, you post it back to Google's token endpoint to receive the token bundle. Store the resulting payload securely:

1. Access Token: Valid for 3600 seconds. Keep this in a temporary short-lived cache or session context.
2. Refresh Token: Valid indefinitely (unless revoked by the user). Store this encrypted in your database linked directly to your tenant's account ID.

When your booking application fires an automated sync event and encounters a 401 Unauthorized response from the Google Calendar API, your Java error handler should intercept the exception, fetch the encrypted refresh_token, make an isolated token refresh request, update the tenant record, and retry the booking creation seamlessly.

## 6. Token Management Best Practices

When building the data model on your Java backend, store the tokens securely.

    Force Offline Access: When routing your user to Google's authorization endpoint, pass the query parameter access_type=offline and prompt=consent. This forces Google to supply a refresh_token alongside the initial access_token.

    Handle Token Expiry: Access tokens automatically expire after 3,600 seconds (1 hour).
    Your Java backend should intercept 401 Unauthorized responses from the Calendar API, use the saved refresh_token to fetch a fresh access token from https://oauth2.googleapis.com/token, update the tenant's record, and retry the scheduling payload.

### Next Steps

Now that your Google Cloud Platform project is successfully issuing credentials and securely passing back refresh tokens, you need to decide how those credentials map to your actual application data layer.

## Conclusion

To see how to isolate these tokens inside a business ecosystem without forcing every single staff member to sign into Google, head over to **[Part 2: Managing Tenant Isolation & Shared Team Calendars]({% post_url 2026-05-24-restrict-multi-tenant-bookings-and-google-accounts %})**.
