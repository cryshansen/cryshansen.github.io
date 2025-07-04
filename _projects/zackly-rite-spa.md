---
layout: page
title: Zackly-Rite Appointment Booking App Project
description: An exploration in React Frameworks to learn practically with refactoring a vanilla site into a modern frameworks.
img: assets/img/9.jpg
permalink: /projects/chartcom/
importance: 3
category: work
related_publications: false
---

# Zackly-Rite Appointment Booking App

This is a React-based single-page application (SPA) designed to allow users to book massage therapy appointments with Zackly-Rite. The app provides a calendar interface to select dates, displays real-time available time slots from a PHP API backend, and includes a secure booking form with validation. As this site is rather simplistic, SPA is the best approach.

Hosted via **GitHub Pages**.

---

## 🔗 Live Demo

👉 [View on GitHub Pages](https://cryshansen.github.io/zackly-rite-spa/)

---

## ✨ Features

- 📅 **Interactive Calendar**: Pick a booking date
- ⏰ **Real-Time Availability**: Fetches booked times from the backend and disables them
- 📋 **Client Form with Validation**: Form includes Yup + `react-hook-form` for first name, last name, phone, and email
- 🤖 **Google reCAPTCHA**: For spam protection (v2)
- ✅ **Booking Confirmation**: Stores booking and redirects to a confirmation page
- 🌐 **SEO-Ready**: `React Helmet` integration for better meta handling
- ⚙️ **Environment Config**: API URLs are set through `.env` for flexibility

---

## 🛠️ Tech Stack

- **Frontend**: React + Vite
- **Routing**: React Router DOM
- **Form Handling**: react-hook-form + Yup
- **Backend API**: PHP with REST endpoints
- **Security**: Google reCAPTCHA v2
- **Meta Tags**: React Helmet
- **Deployment**: GitHub Pages

---

## 🚀 Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/cryshansenn/zackly-rite-spa.git
cd zackly-rite-spa
