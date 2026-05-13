---
layout: post
title: Docker Cheatsheet for the Mindless 
date: 2026-03-19
description: Docker cheat sheet for quick reference of common tasks.
tags: [docker, restart, compose, ]
categories: [docker ]
giscus_comments: false
related_posts: false
related_publications: false
featured: false
mermaid:
  enabled: true
  zoomable: true
code_diff: true
---


# Docker Cheatsheet for the mindless chore

Here’s a tight, practical Docker cheat sheet for reloading your app depending on what you need 👇

## 🔄 1. Restart a running container

If your app is already built and you just want to restart it:

```bash
docker restart <container_name>
```

---

## 🔁 2. Rebuild + restart (most common)

When you changed code or dependencies:

```bash
    docker-compose down
    docker-compose up --build -d
```

Or with newer syntax:

```bash
    docker compose down
    docker compose up --build -d
```

---

## ⚡ 3. Fast reload (no rebuild)

If you're using volumes (live code sync):

```bash
    docker compose restart
```

---

## 🧹 4. Clean rebuild (fix weird issues)

When things are broken/cached badly:

```bash
    docker compose down -v
    docker compose build --no-cache
    docker compose up -d
```

## 🛑 5. Stop everything

```bash
    docker compose down
```

## 🔍 6. Check what's running

```bash
    docker ps
```

## 📜 7. View logs (super useful)

```bash
    docker compose logs -f
```

## 🎯 8. Restart ONE service only

```bash
    docker compose restart <service_name>
```

## 💡 Pro tips (this is usually what you want)

- If code changes not showing → use --build

- If permissions errors ("operation not permitted") → try:

```bash
    docker compose down -v
```

If using Node/PHP dev → make sure volumes are mounted so you don’t rebuild every time

# 🐳 Docker Dev Cheat Sheet (Java + Python Hugging Face)

## 🧠 Goal

- Avoid re-downloading Hugging Face models
- Work independently on:

  - Python (AI service)
  - Java (main app)

---

## ⚙️ One-Time Setup

### Start everything (build + cache models)

```bash
docker compose up --build
```

---

## 🐍 Python (Hugging Face)

### Build + run ONLY Python

```bash
docker compose up --build python
```

### Restart Python fast (no rebuild)

```bash
docker compose restart python
```

### View Python logs

```bash
docker compose logs -f python
```

---

## ☕ Java App

### Build + run ONLY Java

```bash
docker compose up --build java
```

### Restart Java only

```bash
docker compose restart java
```

### View Java logs

```bash
docker compose logs -f java
```

---

## 🔥 When models keep re-downloading (fix)

Make sure you have a volume:

```yaml
volumes:
  - hf_cache:/root/.cache/huggingface
```

---

## 🧹 Clean Reset (only if broken)

⚠️ This WILL delete cached models

```bash
docker compose down -v
docker compose up --build
```

---

## ⚡ Fast Dev Workflow

### Working on Python:

```bash
docker compose up python
```

### Working on Java:

```bash
docker compose up java
```

---

## 🎯 Pro Tips

- Use volumes → no rebuild needed for code changes
- Use `--build` only when dependencies change
- Hugging Face cache = HUGE time saver
- Keep services isolated → faster debugging

---

## ✅ Best Daily Commands

```bash
# Start one service
docker compose up python

# Rebuild one service
docker compose up --build java

# Check logs
docker compose logs -f

# Restart fast
docker compose restart
```

---

🚀 Optional (next level optimization)

If you want even faster builds:

1. Pre-download model in Dockerfile
   RUN python -c "from transformers import pipeline; pipeline('sentiment-analysis')"
2. Use .dockerignore

Avoid sending junk to build:

```text
node_modules
.git
__pycache__
```
