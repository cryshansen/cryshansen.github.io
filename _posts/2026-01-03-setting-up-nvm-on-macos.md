---
layout: post
title: "Setting Up NVM on macOS (Node Version Manager)"
date: 2026-01-03
description: "A practical guide to installing and using NVM on macOS for managing multiple Node.js versions."
categories: [javascript, node, tooling, devops-posts]
tags: [nvm, nodejs, macos, dev-environment, devOps]
---

## Why Use NVM?

If you work on multiple JavaScript projects, you’ve probably run into this problem:

- One project needs **Node 16**
- Another requires **Node 18**
- A newer app wants **Node 20**

Installing Node globally makes this painful.

**NVM (Node Version Manager)** solves this by allowing you to:

- Install multiple Node.js versions
- Switch versions per project
- Match production environments more closely
- Avoid breaking older apps when upgrading Node

On macOS, NVM is the most common and reliable way to manage Node versions.

---

## Prerequisites

Before installing NVM, make sure you have:

- macOS
- A terminal (Terminal.app or iTerm)
- `curl` or `wget` (macOS includes `curl` by default)

Check if Node is already installed:

```bash
node -v
```

If Node was installed via Homebrew, we’ll remove it later to avoid conflicts.

---

### Step 1: Insgtall NVM

Run the official install script:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

⚠️ Always check the official repo for the latest version: [nvm offical repo](https://github.com/nvm-sh/nvm)

This script:

- Installs nvm into ~/.nvm

- Updates your shell profile (.zshrc, .bashrc, etc.)

---

### Step 2: Load NVM in Your Shell

After installation, restart your terminal, or manually load NVM:

For Zsh (default on modern macOS)

```bash
    source ~/.zshrc
```

For Bash

```bash
    source ~/.bashrc
```

Verify installation:

```bash
    nvm --version
```

If you see a version number, NVM is installed correctly 🎉

---

#### Step 3: Install Node.js Using NVM

List available Node versions:

```bash
nvm ls-remote
```

Install a specific version:

```bash
nvm install 18
```

Install the latest LTS:

```bash
nvm install --lts
```

Set the default Node version:

```basg
nvm alias default 18
```

Verify:

```bash
node -v
npm -v
```

---

#### Step 4: Switching Node Versions

Switch versions anytime:

```bash
nvm use 16
nvm use 18
nvm use 22
```

List installed versions:

```bash
nvm ls
```

This makes it easy to jump between legacy and modern projects.

--

#### Step 5: Per-Project Node Versions with .nvmrc

Inside a project root, create a .nvmrc file:

```bash
18
```

Then run:

```bash
nvm use
```

This ensures:

- Everyone on your team uses the same Node version
- CI environments match local development
- Fewer “works on my machine” issues

---

#### Step 6: Removing Homebrew Node (If Needed)

If you previously installed Node with Homebrew, remove it to avoid conflicts:

brew uninstall node

Confirm NVM-managed Node is active:

which node

Expected output:

```text
~/.nvm/versions/node/...
```

---

#### Common Issues & Fixes

nvm: command not found

Restart your terminal

Ensure .zshrc or .bashrc contains:

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

---

#### Node version resets on new terminal

- Make sure nvm alias default is set
- Verify your shell profile is loading correctly

---

#### Recommended Workflow

Typical setup I use:

- .nvmrc in every Node project
- LTS for production apps
- Older versions only when maintaining legacy code

This mirrors real-world team setups and CI pipelines.

---

### Final Thoughts

NVM is one of those tools that:

- Saves time
- Prevents environment bugs
- Makes you a better teammate

Once installed, you’ll rarely think about Node versions again — and that’s exactly the point.
