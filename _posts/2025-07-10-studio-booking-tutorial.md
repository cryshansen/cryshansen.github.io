---
layout: post
title: Building a Studio Booking App
date: 2025-07-10 14:24:00
description: Ever want to build a booking app and see what is under the hood of such a system?
tags: angular cart local-storage login authentication booking architecture design-in-code
categories: angular-posts
giscus_comments: false
related_posts: false
related_publications: false
featured: true
mermaid:
  enabled: true
  zoomable: true
code_diff: true
---

# 🎥 Building a Studio Booking App with Angular: A Complete Tutorial

## Introduction

Have you ever wanted to build a front end of a fully functional booking application? In this tutorial, we’ll walk through how we built **Studio Booker**, an Angular-powered stand alone single-page app for managing photography studio bookings — from browsing studios to booking a time slot, managing a cart, and completing checkout with a polished confirmation and PDF receipt. It also includes basic front end user login/signup forms and button for a subsection of this tutuorial.

---

## 🔧 Features Overview

- Studio listing with details and prices
- Calendar view with FullCalendar.js
- Reactive booking form
- Cart system with persistent storage
- Checkout with billing info and promo code
- Confirmation page with printable PDF
- Sign in - user management
- Sign up -- user management
- Hosted as a subdomain (e.g., `booker.crystalhansenartographic.com`)

---

## 🧱 Tech Stack

- Angular 17+
- Bootstrap 5
- FullCalendar.js
- Reactive Forms
- LocalStorage for persistence
- html2pdf.js for client-side PDF generation

---

### 🔄 App Flow

#### 1. Studio Listing

The user browses available studios with name, description, accessories, and pricing. Clicking “Book Now” sends studio data to the calendar component.

{% raw %}

```ts
  this.router.navigate(['/calendar', id], {{

}});
```

{% endraw %}

---

#### 2. Calendar View

- Uses FullCalendar.js
- Clicking a day opens a booking form with that date pre-filled
- Clicking an event populates the form with existing booking info

---

3. Booking Form Reactive form with:

- Title
- Date (readonly if selected from calendar)
- Time slot (button selector)
- Price (from studio)

Emits the completed booking object to be added to the cart.

---

4. Cart System

- Displays list of bookings
- Allows item removal
- Calculates total
- Uses LocalStorage for persistence
- Cart is cleared on successful booking confirmation

---

5. Checkout
   Includes:

- First/Last Name, Email, Address
- Promo code validation (EXAMPLECODE)
- Card info and payment method
- Validates form on submission
- Sends booking + user info to the confirmation page.

---

6. Confirmation

- Displays cart summary and confirmation ID
- Downloadable/printable PDF using html2pdf.js
- Clears cart on load

---

#### Key Concepts

- Angular routing (with route/query parameters)
- Component communication via @Input() and @Output()
- FullCalendar integration
- Reactive Forms & validation
- LocalStorage-based cart service
- Hosting Angular on a subdomain with .htaccess
- PDF generation with html2pdf.js

{: .note}
Deployment Notes
Subdomain configured via shared hosting (e.g., HostPapa)
Built using: `ng build --configuration production`
Deployed to `/public_html/studio-booker/`

.htaccess routes all paths to index.html
Always show details

{% raw %}

```apache

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{{REQUEST_FILENAME}} !-f
  RewriteCond %{{REQUEST_FILENAME}} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

{% endraw %}

---

# Potential Improvements

- Backend database (e.g., Firebase, Node.js, Laravel)
- Authentication & user accounts
- Admin panel for booking management
- Online payments with Stripe or PayPal
- Email confirmations

---

### Conclusion

This project demonstrates how to build a modern Angular application with real-world booking workflows. It’s scalable, stylish, and packed with useful patterns for building your own booking system.

Want to build it yourself or extend it? Fork it, deploy it, and make it your own! package found [github repository](https://github.com/cryshansen/studio-booker)

Happy Booking!
