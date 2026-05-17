---
layout: post
title: "Running Maven Builds: From Testing to EC2 Deployment"
date: 2026-05-17 
description: "A practical guide to running mvn test, packaging your Java app, and deploying it to AWS EC2 — including CI/CD with GitHub Actions and running as a systemd service."
tags: [maven, java, aws, ec2, devops, ci-cd]
categories: [devops]
giscus_comments: true
related_posts: false
toc:
  sidebar: left
---

Whether you're shipping a microservice or a full-stack Java application, Maven is the backbone of most JVM build pipelines. This guide walks through the full lifecycle — running tests, packaging your app, and deploying it to an AWS EC2 instance — with practical commands you can drop straight into your workflow.

---

## Prerequisites

Before you start, make sure you have:

- **Java 11+** installed (`java -version`)
- **Maven 3.6+** installed (`mvn -version`)
- An AWS EC2 instance running (Amazon Linux 2 or Ubuntu)
- SSH access to the instance (your `.pem` key file)
- Java installed on the EC2 instance

---

## Part 1: Running Tests with Maven

Maven's test lifecycle is straightforward. The key phases you'll use are `test`, `verify`, and `surefire:test`.

### Run all unit tests

```bash
mvn test
```

This compiles your source code and test code, then runs all unit tests found under `src/test/java`. Test reports land in `target/surefire-reports/`.

### Run tests and continue on failure

```bash
mvn test -Dmaven.test.failure.ignore=true
```

Useful in CI when you want to collect all test failures rather than stopping at the first one.

### Run a single test class

```bash
mvn test -Dtest=UserServiceTest
```

Or target a specific method:

```bash
mvn test -Dtest=UserServiceTest#shouldReturnUserById
```

### Run integration tests

Integration tests typically live in the `verify` phase, often powered by the Maven Failsafe plugin:

```bash
mvn verify
```

This runs both unit tests (`*Test.java`) and integration tests (`*IT.java`) in sequence.

### Skip tests entirely

```bash
mvn package -DskipTests
```

> **Note:** `-DskipTests` skips test *execution* but still compiles test classes. Use `-Dmaven.test.skip=true` to skip compilation too.

---

## Part 2: Building the Artifact

Once tests pass, package your application into a deployable artifact — typically a `.jar` or `.war`.

### Build a JAR

```bash
mvn clean package
```

`clean` wipes the `target/` directory first. `package` compiles, tests, and packages. Your artifact ends up at:

```
target/your-app-1.0.0.jar
```

### Build a fat/uber JAR (Spring Boot)

If you're using Spring Boot or the Maven Shade plugin, `mvn package` produces a self-contained executable JAR with all dependencies bundled:

```bash
mvn clean package -DskipTests
```

Run it directly:

```bash
java -jar target/your-app-1.0.0.jar
```

### Build for a specific Maven profile

Maven profiles let you swap configs — for example, `dev` vs `prod` database URLs:

```bash
mvn clean package -Pprod -DskipTests
```

---

## Part 3: Deploying to EC2

With your artifact built, the next step is getting it onto the EC2 instance. Here are the most practical deployment options.

### Option A: SCP + SSH (Simple and Direct)

The most straightforward approach for smaller teams or manual deployments.

**Step 1 — Copy the JAR to EC2:**

```bash
scp -i ~/.ssh/your-key.pem \
  target/your-app-1.0.0.jar \
  ec2-user@<YOUR_EC2_IP>:/home/ec2-user/app/
```

> On Ubuntu instances, replace `ec2-user` with `ubuntu`.

**Step 2 — SSH into the instance:**

```bash
ssh -i ~/.ssh/your-key.pem ec2-user@<YOUR_EC2_IP>
```

**Step 3 — Run the application:**

```bash
cd /home/ec2-user/app
nohup java -jar your-app-1.0.0.jar > app.log 2>&1 &
```

---

### Option B: Maven Wagon Plugin

Wire the SCP step directly into your Maven build. Add this to your `pom.xml`:

```xml
<build>
  <extensions>
    <extension>
      <groupId>org.apache.maven.wagon</groupId>
      <artifactId>wagon-ssh</artifactId>
      <version>3.5.3</version>
    </extension>
  </extensions>

  <plugins>
    <plugin>
      <groupId>org.codehaus.mojo</groupId>
      <artifactId>wagon-maven-plugin</artifactId>
      <version>2.0.2</version>
      <configuration>
        <serverId>ec2-server</serverId>
        <url>scp://ec2-user@<YOUR_EC2_IP>/home/ec2-user/app</url>
        <fromFile>target/your-app-1.0.0.jar</fromFile>
        <toFile>your-app.jar</toFile>
      </configuration>
    </plugin>
  </plugins>
</build>
```

Add your EC2 SSH key to `~/.m2/settings.xml`:

```xml
<servers>
  <server>
    <id>ec2-server</id>
    <privateKey>/path/to/your-key.pem</privateKey>
  </server>
</servers>
```

Then deploy with a single command:

```bash
mvn clean package wagon:upload-single -DskipTests
```

---

### Option C: GitHub Actions CI/CD Pipeline

For a fully automated pipeline, here's a GitHub Actions workflow that tests, builds, and deploys on every push to `main`:

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy to EC2

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Java
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Run tests
        run: mvn test

      - name: Build artifact
        run: mvn clean package -DskipTests

      - name: Deploy to EC2
        env:
          EC2_HOST: ${{ secrets.EC2_HOST }}
          EC2_USER: ${{ secrets.EC2_USER }}
          EC2_KEY: ${{ secrets.EC2_SSH_KEY }}
        run: |
          echo "$EC2_KEY" > key.pem
          chmod 600 key.pem
          scp -i key.pem -o StrictHostKeyChecking=no \
            target/*.jar $EC2_USER@$EC2_HOST:/home/$EC2_USER/app/app.jar
          ssh -i key.pem -o StrictHostKeyChecking=no $EC2_USER@$EC2_HOST \
            "pkill -f 'java -jar' || true && \
             nohup java -jar /home/$EC2_USER/app/app.jar > /home/$EC2_USER/app/app.log 2>&1 &"
          rm key.pem
```

Store `EC2_HOST`, `EC2_USER`, and `EC2_SSH_KEY` as GitHub repository secrets.

---

## Part 4: Running as a systemd Service (Recommended for Production)

Instead of `nohup`, manage the process with systemd — it restarts automatically on crash and survives reboots.

**Create a service file on EC2:**

```bash
sudo nano /etc/systemd/system/myapp.service
```

```ini
[Unit]
Description=My Java Application
After=network.target

[Service]
User=ec2-user
WorkingDirectory=/home/ec2-user/app
ExecStart=/usr/bin/java -jar /home/ec2-user/app/app.jar
SuccessExitStatus=143
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Enable and start the service:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable myapp
sudo systemctl start myapp
```

**Check status and tail logs:**

```bash
sudo systemctl status myapp
sudo journalctl -u myapp -f
```

To deploy a new version, copy the new JAR and restart:

```bash
sudo systemctl restart myapp
```

---

## Quick Reference

| Goal | Command |
| :--- | :--- |
| Run all tests | `mvn test` |
| Run integration tests | `mvn verify` |
| Run a single test | `mvn test -Dtest=MyTest` |
| Build (skip tests) | `mvn clean package -DskipTests` |
| Build for prod profile | `mvn clean package -Pprod` |
| Copy JAR to EC2 | `scp -i key.pem target/app.jar ec2-user@HOST:/path/` |
| SSH to EC2 | `ssh -i key.pem ec2-user@HOST` |
| Restart systemd service | `sudo systemctl restart myapp` |

---

## Wrapping Up

The Maven build lifecycle covers everything from compiling and testing to packaging, and with a few shell commands (or a CI pipeline), you can take that artifact all the way to a running EC2 instance. For production workloads, running your app as a systemd service is worth the five-minute setup — you get automatic restarts, centralized logging via `journalctl`, and clean start/stop semantics.

From here, the natural next step is moving toward a more managed deployment target — ECS, Elastic Beanstalk, or a CodeDeploy-managed EC2 fleet — but this pipeline gets most teams very far, very fast.
