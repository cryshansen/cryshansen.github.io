---
layout: post
title: Building a Dropin Chatbot Widget for any SPA App
date: 2026-02-03
description:
tags: [react, chatbot, UI, integrations, API]
categories: [react-posts]
giscus_comments: false
related_posts: true
related_publications: false
featured: false
mermaid:
  enabled: true
  zoomable: true
code_diff: true
---

### Building a Drop-In Chatbot Widget for Any React App

One of the hardest parts of adding AI to an app isn’t the model — it’s the integration.

Most chatbots are tightly coupled to:

- a specific API
- a specific app layout
- a specific auth system
- or a specific backend contract

I wanted the opposite. I need a feature that can be reused and not require any real code change besides maybe some slight UI color matching within the drop. So I built Orbie AI — a fully self-contained, drop-in chatbot widget for React or other SPA's that can plug into any GET-based chatbot API, with zero assumptions about the host application.

---

### The Goal

The goal was simple:

Drop a chatbot into any React app the same way you’d drop in a chart or a map.

That meant:

- No app-level state dependencies
- No forced auth strategy
- No hard-coded API endpoints
- No global styles leaking into the host app

Just a widget.

---

### Feature-First Architecture

Instead of building the chatbot into App.tsx, Orbie is structured as a feature module:

```text
features/
  orbie-ai/
    components/
    context/
    services/
    config/
    _tests_/
```

This gives us:

- True encapsulation
- Easy removal or reuse
- Clear public API boundaries

The host app only passes configuration — everything else lives inside the feature.

---

### Drop-In Usage

Here’s what using Orbie looks like inside a host app:
{% raw %}

```tsx
<OrbieWidget
  config={{
    apiUrl: import.meta.env.VITE_CHATBOT_API_URL,
    endpoint: import.meta.env.VITE_CHATBOT_API_ENDPOINT,
  }}
  chatbotName="Oracle"
  theme="dark"
  initialPrompt="Ask me about your future 🔮"
  context="home-page"
  userId="123"
/>
```

{% endraw %}

That’s it.

- No reducers.
- No providers at the app level.
- No shared state collisions.

---

### API-Agnostic by Design

Orbie doesn’t care what your chatbot does.

All it expects is:

- a GET endpoint
- a response shape it can render

The service layer is injected:

```ts
createChatbotService(apiBaseUrl);
```

Which means you can point Orbie at:

- a fortune teller [fortune-ai](https://github.com/cryshansen/fortune-ai) playground
- a support bot
- an internal tools assistant
- or a completely different backend later

No refactor required.

---

### Context Without Coupling

Props like context and userId are intentionally optional.

They exist so you can:

- tag messages by page or environment
- integrate later with analytics or auth
- enrich prompts without changing the widget API

If you don’t need them — Orbie still works.

---

### Testing as a First-Class Feature

This isn’t a demo widget.

Orbie ships with:

- isolated service mocks
- widget-level integration tests
- error-state validation
- multi-instance safety checks

Because a reusable widget that isn’t testable… isn’t reusable.

---

### Why This Matters

The real win here isn’t the chatbot.

It’s the pattern:

- Feature-scoped config
- Explicit inputs
- No assumptions about the host app
- Drop-in, drop-out safety

This is how reusable UI should be built. And Orbie is just the beginning.
